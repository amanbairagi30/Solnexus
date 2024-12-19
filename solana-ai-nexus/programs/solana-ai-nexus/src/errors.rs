#[error_code]
pub enum DeFiError {
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    #[msg("Price impact too high")]
    PriceImpactTooHigh,
    #[msg("Oracle price is stale")]
    StalePrice,
    #[msg("Pool is paused")]
    PoolPaused,
    #[msg("Transaction expired")]
    TransactionExpired,
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    #[msg("Invalid fee rate")]
    InvalidFeeRate,
    #[msg("Insufficient output amount")]
    InsufficientOutputAmount,
    #[msg("Invalid token account")]
    InvalidTokenAccount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
} 