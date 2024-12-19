use anchor_lang::prelude::*;
use std::collections::VecDeque;
use switchboard_v2::AggregatorAccountData;
use pyth_sdk_solana::load_price_feed_from_account_info;
use chainlink_solana as chainlink;

#[account]
#[derive(Default)]
pub struct PriceFeed {
    pub token_mint: Pubkey,
    pub price: u64,          // Price in USD with 6 decimals
    pub confidence: u64,     // Confidence interval
    pub last_update: i64,
    pub twap: u64,          // Time-weighted average price
    pub source: PriceSource,
    pub valid_period: i64,   // How long the price is considered valid
    pub fallback_source: Option<PriceSource>,
    pub price_history: Vec<PricePoint>,
    pub volatility: u64,
    pub circuit_breaker: CircuitBreaker,
    pub volatility_metrics: Option<VolatilityMetrics>,
}

#[account]
pub struct PriceOracle {
    pub authority: Pubkey,
    pub price_feeds: Vec<PriceFeed>,
    pub last_update: i64,
    pub is_valid: bool,
    pub update_frequency: i64,  // Minimum time between updates
    pub max_price_age: i64,    // Maximum age of price data
    pub min_confidence: u64,    // Minimum confidence level required
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum PriceSource {
    Chainlink,
    Pyth,
    Switchboard,
    UniswapV3,
    Internal,
    Aggregate,
    Fallback,
    TWAP,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PricePoint {
    pub price: u64,
    pub timestamp: i64,
    pub weight: u64,
}

#[account]
pub struct CircuitBreaker {
    pub max_price_change_percentage: u64,
    pub cooling_period: i64,
    pub last_triggered: i64,
    pub is_triggered: bool,
    pub volatility_threshold: u64,
    pub consecutive_breaches: u8,
    pub volume_threshold: u64,
    pub liquidity_threshold: u64,
    pub max_price_deviation_from_twap: u64,
}

impl CircuitBreaker {
    pub fn check_conditions(
        &self,
        new_price: u64,
        current_price: u64,
        twap: u64,
        volatility: u64,
        volume: u64,
        liquidity: u64,
    ) -> Result<()> {
        // Check price change
        let price_change = if new_price > current_price {
            new_price.checked_sub(current_price).unwrap()
        } else {
            current_price.checked_sub(new_price).unwrap()
        };

        let change_percentage = (price_change as u128)
            .checked_mul(10000)
            .unwrap()
            .checked_div(current_price as u128)
            .unwrap() as u64;

        // Check TWAP deviation
        let twap_deviation = if new_price > twap {
            new_price.checked_sub(twap).unwrap()
        } else {
            twap.checked_sub(new_price).unwrap()
        };

        let twap_deviation_percentage = (twap_deviation as u128)
            .checked_mul(10000)
            .unwrap()
            .checked_div(twap as u128)
            .unwrap() as u64;

        require!(
            change_percentage <= self.max_price_change_percentage &&
            volatility <= self.volatility_threshold &&
            volume >= self.volume_threshold &&
            liquidity >= self.liquidity_threshold &&
            twap_deviation_percentage <= self.max_price_deviation_from_twap,
            OracleError::CircuitBreakerTriggered
        );

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeOracle<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PriceOracle::SPACE
    )]
    pub oracle: Account<'info, PriceOracle>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut)]
    pub oracle: Account<'info, PriceOracle>,
    #[account(
        constraint = oracle.authority == authority.key() @ OracleError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdatePythPrice<'info> {
    #[account(mut)]
    pub oracle: Account<'info, PriceOracle>,
    pub pyth_price_account: AccountInfo<'info>,
    #[account(
        constraint = oracle.authority == authority.key() @ OracleError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateChainlinkPrice<'info> {
    #[account(mut)]
    pub oracle: Account<'info, PriceOracle>,
    pub chainlink_feed: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct AggregationStrategy {
    pub method: AggregationMethod,
    pub min_valid_sources: u8,
    pub max_deviation: u64,
    pub weights: Vec<u64>,
    pub outlier_threshold: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum AggregationMethod {
    WeightedAverage,
    Median,
    TrimmedMean,
    VolumeWeighted,
    ConfidenceWeighted,
    WeightedMedian,
    KalmanFilter,
    OutlierAdjusted,
}

impl PriceOracle {
    pub const SPACE: usize = 8 +  // discriminator
        32 +                      // authority
        4 + (10 * PriceFeed::SPACE) + // Vec of up to 10 price feeds
        8 +                      // last_update
        1 +                      // is_valid
        8 +                      // update_frequency
        8 +                      // max_price_age
        8;                       // min_confidence

    pub fn get_price(&self, token_mint: Pubkey) -> Result<u64> {
        let feed = self.price_feeds
            .iter()
            .find(|f| f.token_mint == token_mint)
            .ok_or(OracleError::PriceFeedNotFound)?;

        let clock = Clock::get()?;
        let age = clock.unix_timestamp - feed.last_update;
        
        require!(age <= self.max_price_age, OracleError::StalePrice);
        require!(feed.confidence >= self.min_confidence, OracleError::LowConfidence);

        Ok(feed.price)
    }

    pub fn get_twap(&self, token_mint: Pubkey) -> Result<u64> {
        let feed = self.price_feeds
            .iter()
            .find(|f| f.token_mint == token_mint)
            .ok_or(OracleError::PriceFeedNotFound)?;

        Ok(feed.twap)
    }

    pub fn calculate_twap(&self, token_mint: Pubkey, window_size: i64) -> Result<u64> {
        let feed = self.get_price_feed(token_mint)?;
        let clock = Clock::get()?;
        
        let mut total_weight = 0u128;
        let mut weighted_sum = 0u128;
        
        for point in feed.price_history.iter().rev() {
            let age = clock.unix_timestamp - point.timestamp;
            if age > window_size {
                break;
            }
            
            let weight = (window_size - age) as u128;
            weighted_sum = weighted_sum
                .checked_add(point.price as u128 * weight)
                .unwrap();
            total_weight = total_weight.checked_add(weight).unwrap();
        }
        
        Ok((weighted_sum.checked_div(total_weight).unwrap()) as u64)
    }

    pub fn aggregate_price(&self, token_mint: Pubkey, config: &AggregationConfig) -> Result<u64> {
        let mut valid_prices = Vec::new();
        let mut total_weight = 0u128;
        let mut weighted_sum = 0u128;

        for (source, weight) in config.sources.iter().zip(config.weights.iter()) {
            if let Ok(price) = self.get_price_from_source(token_mint, source.clone()) {
                valid_prices.push(price);
                weighted_sum = weighted_sum
                    .checked_add(price as u128 * *weight as u128)
                    .unwrap();
                total_weight = total_weight.checked_add(*weight as u128).unwrap();
            }
        }

        require!(
            valid_prices.len() >= config.min_valid_sources as usize,
            OracleError::InsufficientValidSources
        );

        // Check price deviation
        let min_price = *valid_prices.iter().min().unwrap();
        let max_price = *valid_prices.iter().max().unwrap();
        let deviation = max_price.checked_sub(min_price).unwrap();
        
        require!(
            deviation <= config.max_price_deviation,
            OracleError::PriceDeviationTooHigh
        );

        Ok((weighted_sum.checked_div(total_weight).unwrap()) as u64)
    }

    pub fn check_circuit_breaker(&self, token_mint: Pubkey, new_price: u64) -> Result<()> {
        let feed = self.get_price_feed(token_mint)?;
        let breaker = &feed.circuit_breaker;
        let clock = Clock::get()?;

        // Check if circuit breaker is already triggered
        if breaker.is_triggered {
            require!(
                clock.unix_timestamp >= breaker.last_triggered + breaker.cooling_period,
                OracleError::CircuitBreakerTriggered
            );
        }

        // Calculate price change percentage
        let price_change = if new_price > feed.price {
            new_price.checked_sub(feed.price).unwrap()
        } else {
            feed.price.checked_sub(new_price).unwrap()
        };

        let change_percentage = (price_change as u128)
            .checked_mul(10000)
            .unwrap()
            .checked_div(feed.price as u128)
            .unwrap() as u64;

        require!(
            change_percentage <= breaker.max_price_change_percentage,
            OracleError::PriceChangeExceedsLimit
        );

        Ok(())
    }

    pub fn get_price_with_fallback(&self, token_mint: Pubkey) -> Result<u64> {
        let feed = self.get_price_feed(token_mint)?;
        
        match self.get_price_from_source(token_mint, feed.source.clone()) {
            Ok(price) => Ok(price),
            Err(_) => {
                if let Some(fallback_source) = feed.fallback_source.clone() {
                    self.get_price_from_source(token_mint, fallback_source)
                } else {
                    Err(OracleError::NoValidPriceSource.into())
                }
            }
        }
    }

    fn get_price_from_source(&self, token_mint: Pubkey, source: PriceSource) -> Result<u64> {
        match source {
            PriceSource::Switchboard => {
                // Implement Switchboard price fetch
                self.get_switchboard_price(token_mint)
            },
            PriceSource::Pyth => {
                // Implement Pyth price fetch
                self.get_pyth_price(token_mint)
            },
            PriceSource::Chainlink => {
                // Implement Chainlink price fetch
                self.get_chainlink_price(token_mint)
            },
            _ => self.get_price(token_mint)
        }
    }

    pub fn update_pyth_price(ctx: Context<UpdatePythPrice>) -> Result<()> {
        let price_feed = load_price_feed_from_account_info(&ctx.accounts.pyth_price_account)?;
        let price_data = price_feed.get_current_price()
            .ok_or(OracleError::PriceFeedNotFound)?;

        let price = (price_data.price as u64)
            .checked_mul(10u64.pow(price_data.expo.unsigned_abs()))
            .unwrap();
        
        let confidence = price_data.conf as u64;
        Self::update_price_feed(
            &mut ctx.accounts.oracle,
            ctx.accounts.pyth_price_account.key(),
            price,
            confidence,
            PriceSource::Pyth,
        )
    }

    pub fn update_chainlink_price(ctx: Context<UpdateChainlinkPrice>) -> Result<()> {
        let round = chainlink::latest_round_data(
            &ctx.accounts.chainlink_feed
        )?;

        let price = round.answer as u64;
        let confidence = 95u64; // Chainlink typically has high confidence

        Self::update_price_feed(
            &mut ctx.accounts.oracle,
            ctx.accounts.chainlink_feed.key(),
            price,
            confidence,
            PriceSource::Chainlink,
        )
    }

    pub fn aggregate_prices(
        &self,
        prices: Vec<(u64, u64, PriceSource)>, // (price, confidence, source)
        strategy: &AggregationStrategy,
    ) -> Result<u64> {
        require!(
            prices.len() >= strategy.min_valid_sources as usize,
            OracleError::InsufficientValidSources
        );

        match strategy.method {
            AggregationMethod::WeightedAverage => {
                let mut weighted_sum = 0u128;
                let mut total_weight = 0u128;

                for ((price, confidence, _), weight) in prices.iter().zip(strategy.weights.iter()) {
                    weighted_sum = weighted_sum
                        .checked_add((*price as u128).checked_mul(*weight as u128).unwrap())
                        .unwrap();
                    total_weight = total_weight.checked_add(*weight as u128).unwrap();
                }

                Ok((weighted_sum.checked_div(total_weight).unwrap()) as u64)
            },
            AggregationMethod::Median => {
                let mut price_values: Vec<u64> = prices.iter()
                    .map(|(price, _, _)| *price)
                    .collect();
                price_values.sort_unstable();
                Ok(price_values[price_values.len() / 2])
            },
            // ... implement other methods
        }
    }

    pub fn calculate_volatility(&mut self, token_mint: Pubkey) -> Result<()> {
        let feed = self.get_price_feed_mut(token_mint)?;
        let clock = Clock::get()?;
        
        // Calculate returns
        let mut returns: Vec<i128> = Vec::new();
        let mut prev_price = None;
        
        for point in feed.price_history.iter() {
            if let Some(prev) = prev_price {
                let return_val = ((point.price as i128 - prev as i128) * 10000) / prev as i128;
                returns.push(return_val);
            }
            prev_price = Some(point.price);
        }
        
        // Calculate standard deviation
        if returns.len() >= 2 {
            let mean = returns.iter().sum::<i128>() / returns.len() as i128;
            let variance = returns.iter()
                .map(|x| {
                    let diff = x - mean;
                    (diff * diff) as u128
                })
                .sum::<u128>() / (returns.len() - 1) as u128;
            
            feed.volatility = (variance as f64).sqrt() as u64;
        }

        // Update Bollinger Bands
        if let Some(metrics) = &mut feed.volatility_metrics {
            metrics.bollinger_bands = self.calculate_bollinger_bands(&feed.price_history)?;
            metrics.last_calculation = clock.unix_timestamp;
        }

        Ok(())
    }

    pub fn aggregate_prices(
        &self,
        token_mint: Pubkey,
        strategy: &AggregationStrategy,
    ) -> Result<u64> {
        let mut prices = Vec::new();
        
        // Collect prices from different sources
        if let Ok(price) = self.get_chainlink_price(token_mint) {
            prices.push((price, 95, PriceSource::Chainlink));
        }
        if let Ok(price) = self.get_pyth_price(token_mint) {
            prices.push((price, 90, PriceSource::Pyth));
        }
        if let Ok(price) = self.get_switchboard_price(token_mint) {
            prices.push((price, 90, PriceSource::Switchboard));
        }
        if let Ok(price) = self.get_uniswap_price(token_mint) {
            prices.push((price, 85, PriceSource::UniswapV3));
        }

        match strategy.method {
            AggregationMethod::WeightedMedian => {
                self.calculate_weighted_median(&prices, &strategy.weights)
            },
            AggregationMethod::KalmanFilter => {
                self.apply_kalman_filter(&prices)
            },
            AggregationMethod::OutlierAdjusted => {
                self.calculate_outlier_adjusted_mean(&prices, strategy.outlier_threshold)
            },
            AggregationMethod::ConfidenceWeighted => {
                self.calculate_confidence_weighted_price(&prices)
            },
            // ... existing methods ...
        }
    }

    pub fn get_uniswap_price(&self, token_mint: Pubkey) -> Result<u64> {
        // Implementation for Uniswap V3 TWAP oracle
        // This would interact with Uniswap-style AMM on Solana
        todo!()
    }

    fn apply_kalman_filter(&self, prices: &[(u64, u64, PriceSource)]) -> Result<u64> {
        let mut estimate = prices[0].0 as f64;
        let mut error_estimate = 1.0;
        let q = 0.1; // Process noise
        
        for &(measurement, confidence, _) in prices.iter().skip(1) {
            let measurement_error = 1.0 - (confidence as f64 / 100.0);
            
            // Kalman gain
            let kalman_gain = error_estimate / (error_estimate + measurement_error);
            
            // Update estimate
            estimate += kalman_gain * (measurement as f64 - estimate);
            
            // Update error estimate
            error_estimate = (1.0 - kalman_gain) * error_estimate + q;
        }
        
        Ok(estimate as u64)
    }
}

pub fn initialize_oracle(
    ctx: Context<InitializeOracle>,
    update_frequency: i64,
    max_price_age: i64,
    min_confidence: u64,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    let clock = Clock::get()?;

    oracle.authority = ctx.accounts.authority.key();
    oracle.price_feeds = Vec::new();
    oracle.last_update = clock.unix_timestamp;
    oracle.is_valid = true;
    oracle.update_frequency = update_frequency;
    oracle.max_price_age = max_price_age;
    oracle.min_confidence = min_confidence;

    emit!(OracleInitialized {
        authority: oracle.authority,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

pub fn update_price(
    ctx: Context<UpdatePrice>,
    token_mint: Pubkey,
    price: u64,
    confidence: u64,
    source: PriceSource,
) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    let clock = Clock::get()?;

    require!(
        clock.unix_timestamp >= oracle.last_update + oracle.update_frequency,
        OracleError::TooFrequentUpdate
    );

    let feed = oracle.price_feeds
        .iter_mut()
        .find(|f| f.token_mint == token_mint);

    match feed {
        Some(feed) => {
            // Update existing feed
            let old_price = feed.price;
            feed.price = price;
            feed.confidence = confidence;
            feed.last_update = clock.unix_timestamp;
            feed.source = source;
            
            // Update TWAP
            feed.twap = ((feed.twap as u128)
                .checked_mul(3)
                .unwrap()
                .checked_add(price as u128)
                .unwrap()
                .checked_div(4)
                .unwrap()) as u64;
        }
        None => {
            // Add new feed
            oracle.price_feeds.push(PriceFeed {
                token_mint,
                price,
                confidence,
                last_update: clock.unix_timestamp,
                twap: price,
                source,
                valid_period: oracle.max_price_age,
                fallback_source: None,
                price_history: Vec::new(),
                volatility: 0,
                circuit_breaker: CircuitBreaker {
                    max_price_change_percentage: 0,
                    cooling_period: 0,
                    last_triggered: 0,
                    is_triggered: false,
                    volatility_threshold: 0,
                    consecutive_breaches: 0,
                    volume_threshold: 0,
                    liquidity_threshold: 0,
                    max_price_deviation_from_twap: 0,
                },
                volatility_metrics: None,
            });
        }
    }

    oracle.last_update = clock.unix_timestamp;

    emit!(PriceUpdated {
        token_mint,
        price,
        confidence,
        source,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[error_code]
pub enum OracleError {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("Price feed not found")]
    PriceFeedNotFound,
    #[msg("Price data is stale")]
    StalePrice,
    #[msg("Price confidence too low")]
    LowConfidence,
    #[msg("Update too frequent")]
    TooFrequentUpdate,
    #[msg("Insufficient valid price sources")]
    InsufficientValidSources,
    #[msg("Price deviation too high")]
    PriceDeviationTooHigh,
    #[msg("Circuit breaker triggered")]
    CircuitBreakerTriggered,
    #[msg("Price change exceeds limit")]
    PriceChangeExceedsLimit,
    #[msg("No valid price source available")]
    NoValidPriceSource,
}

#[event]
pub struct OracleInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PriceUpdated {
    pub token_mint: Pubkey,
    pub price: u64,
    pub confidence: u64,
    pub source: PriceSource,
    pub timestamp: i64,
} 