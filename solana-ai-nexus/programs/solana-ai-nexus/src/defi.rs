use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use std::cmp;

#[account]
pub struct LiquidityPool {
    pub pool_id: u64,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub token_a_account: Pubkey,
    pub token_b_account: Pubkey,
    pub lp_token_mint: Pubkey,
    pub total_liquidity: u64,
    pub fee_rate: u16,  // basis points (e.g., 30 = 0.3%)
    pub last_update_time: i64,
    pub authority: Pubkey,
    pub is_active: bool,
    pub emergency_admin: Pubkey,
}

#[account]
pub struct YieldFarm {
    pub pool_id: u64,
    pub reward_token_mint: Pubkey,
    pub reward_token_account: Pubkey,
    pub rewards_per_second: u64,
    pub last_update_time: i64,
    pub total_staked: u64,
    pub accumulated_rewards_per_share: u128,
    pub authority: Pubkey,
}

#[account]
pub struct UserPosition {
    pub owner: Pubkey,
    pub pool_id: u64,
    pub lp_tokens_staked: u64,
    pub reward_debt: u128,
    pub last_stake_time: i64,
}

#[derive(Accounts)]
pub struct InitializeLiquidityPool<'info> {
    #[account(init, payer = authority, space = 8 + LiquidityPool::SPACE)]
    pub pool: Account<'info, LiquidityPool>,
    pub token_a_mint: Account<'info, Mint>,
    pub token_b_mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_a_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub token_b_account: Account<'info, TokenAccount>,
    pub lp_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub lp_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl LiquidityPool {
    pub const SPACE: usize = 8 + // discriminator
                            8 + // pool_id
                            32 + // token_a_mint
                            32 + // token_b_mint
                            32 + // token_a_account
                            32 + // token_b_account
                            32 + // lp_token_mint
                            8 + // total_liquidity
                            2 + // fee_rate
                            8 + // last_update_time
                            32 + // authority
                            64; // padding
}

// AMM Functions
pub fn calculate_swap_output(
    input_amount: u64,
    input_reserve: u64,
    output_reserve: u64,
    fee_rate: u16,
) -> Result<u64> {
    require!(input_amount > 0, CustomError::InvalidAmount);
    require!(input_reserve > 0 && output_reserve > 0, CustomError::InsufficientLiquidity);

    // Calculate fee
    let fee_amount = (input_amount as u128)
        .checked_mul(fee_rate as u128)
        .unwrap()
        .checked_div(10000)
        .unwrap() as u64;
    
    let input_amount_with_fee = input_amount.checked_sub(fee_amount).unwrap();

    // Using constant product formula: x * y = k
    let numerator = (input_amount_with_fee as u128).checked_mul(output_reserve as u128).unwrap();
    let denominator = (input_reserve as u128).checked_add(input_amount_with_fee as u128).unwrap();
    
    Ok((numerator.checked_div(denominator).unwrap()) as u64)
}

pub fn initialize_liquidity_pool(
    ctx: Context<InitializeLiquidityPool>,
    pool_id: u64,
    fee_rate: u16,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let clock = Clock::get()?;

    pool.pool_id = pool_id;
    pool.token_a_mint = ctx.accounts.token_a_mint.key();
    pool.token_b_mint = ctx.accounts.token_b_mint.key();
    pool.token_a_account = ctx.accounts.token_a_account.key();
    pool.token_b_account = ctx.accounts.token_b_account.key();
    pool.lp_token_mint = ctx.accounts.lp_token_mint.key();
    pool.total_liquidity = 0;
    pool.fee_rate = fee_rate;
    pool.last_update_time = clock.unix_timestamp;
    pool.authority = ctx.accounts.authority.key();

    emit!(PoolInitialized {
        pool_id,
        token_a: pool.token_a_mint,
        token_b: pool.token_b_mint,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
    min_lp_tokens: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let clock = Clock::get()?;

    // Calculate LP tokens to mint
    let lp_tokens_to_mint = if pool.total_liquidity == 0 {
        // Initial liquidity
        (amount_a as u128).checked_mul(amount_b as u128).unwrap().sqrt() as u64
    } else {
        // Subsequent liquidity
        cmp::min(
            amount_a.checked_mul(pool.total_liquidity).unwrap()
                .checked_div(ctx.accounts.pool_token_a.amount).unwrap(),
            amount_b.checked_mul(pool.total_liquidity).unwrap()
                .checked_div(ctx.accounts.pool_token_b.amount).unwrap(),
        )
    };

    require!(lp_tokens_to_mint >= min_lp_tokens, CustomError::SlippageExceeded);

    // Transfer tokens to pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_token_a.to_account_info(),
                to: ctx.accounts.pool_token_a.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_a,
    )?;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_token_b.to_account_info(),
                to: ctx.accounts.pool_token_b.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_b,
    )?;

    // Mint LP tokens
    token::mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::MintTo {
                mint: ctx.accounts.lp_token_mint.to_account_info(),
                to: ctx.accounts.user_lp_token.to_account_info(),
                authority: pool.to_account_info(),
            },
        ),
        lp_tokens_to_mint,
    )?;

    pool.total_liquidity = pool.total_liquidity.checked_add(lp_tokens_to_mint).unwrap();
    pool.last_update_time = clock.unix_timestamp;

    emit!(LiquidityAdded {
        pool_id: pool.pool_id,
        provider: ctx.accounts.user.key(),
        amount_a,
        amount_b,
        lp_tokens: lp_tokens_to_mint,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut)]
    pub user_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_b: Account<'info, TokenAccount>,
    #[account(mut)]
    pub lp_token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_lp_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_tokens: u64,
    min_token_a: u64,
    min_token_b: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let clock = Clock::get()?;

    require!(pool.is_active, DeFiError::PoolPaused);

    // Calculate token amounts
    let total_supply = ctx.accounts.lp_token_mint.supply;
    let token_a_amount = (ctx.accounts.pool_token_a.amount as u128)
        .checked_mul(lp_tokens as u128)
        .unwrap()
        .checked_div(total_supply as u128)
        .unwrap() as u64;
    let token_b_amount = (ctx.accounts.pool_token_b.amount as u128)
        .checked_mul(lp_tokens as u128)
        .unwrap()
        .checked_div(total_supply as u128)
        .unwrap() as u64;

    require!(token_a_amount >= min_token_a, DeFiError::SlippageExceeded);
    require!(token_b_amount >= min_token_b, DeFiError::SlippageExceeded);

    // Burn LP tokens
    token::burn(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Burn {
                mint: ctx.accounts.lp_token_mint.to_account_info(),
                from: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        lp_tokens,
    )?;

    // Transfer tokens back to user
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.pool_token_a.to_account_info(),
                to: ctx.accounts.user_token_a.to_account_info(),
                authority: pool.to_account_info(),
            },
        ),
        token_a_amount,
    )?;

    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.pool_token_b.to_account_info(),
                to: ctx.accounts.user_token_b.to_account_info(),
                authority: pool.to_account_info(),
            },
        ),
        token_b_amount,
    )?;

    pool.total_liquidity = pool.total_liquidity.checked_sub(lp_tokens).unwrap();
    pool.last_update_time = clock.unix_timestamp;

    emit!(LiquidityRemoved {
        pool_id: pool.pool_id,
        provider: ctx.accounts.user.key(),
        amount_a: token_a_amount,
        amount_b: token_b_amount,
        lp_tokens,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SwapTokens<'info> {
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(mut)]
    pub user_token_in: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_out: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_in: Account<'info, TokenAccount>,
    #[account(mut)]
    pub pool_token_out: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

pub fn swap_tokens(
    ctx: Context<SwapTokens>, 
    amount_in: u64,
    minimum_amount_out: u64,
    deadline: i64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let clock = Clock::get()?;
    
    require!(clock.unix_timestamp <= deadline, DeFiError::TransactionExpired);
    require!(pool.is_active, DeFiError::PoolPaused);

    let input_reserve = ctx.accounts.pool_token_in.amount;
    let output_reserve = ctx.accounts.pool_token_out.amount;
    
    let amount_out = calculate_swap_output(
        amount_in,
        input_reserve,
        output_reserve,
        pool.fee_rate,
    )?;
    
    require!(amount_out >= minimum_amount_out, DeFiError::SlippageExceeded);

    // Transfer input tokens from user to pool
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_token_in.to_account_info(),
                to: ctx.accounts.pool_token_in.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        ),
        amount_in,
    )?;

    // Transfer output tokens from pool to user
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.pool_token_out.to_account_info(),
                to: ctx.accounts.user_token_out.to_account_info(),
                authority: pool.to_account_info(),
            },
        ),
        amount_out,
    )?;

    emit!(SwapExecuted {
        pool_id: pool.pool_id,
        user: ctx.accounts.user.key(),
        token_in: ctx.accounts.user_token_in.mint,
        token_out: ctx.accounts.user_token_out.mint,
        amount_in,
        amount_out,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct FlashLoan<'info> {
    // Flash loan implementation
}

#[derive(Accounts)]
pub struct EmergencyPause<'info> {
    #[account(mut)]
    pub pool: Account<'info, LiquidityPool>,
    #[account(
        constraint = pool.emergency_admin == admin.key() @ DeFiError::Unauthorized
    )]
    pub admin: Signer<'info>,
}

pub fn emergency_pause(ctx: Context<EmergencyPause>) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    let clock = Clock::get()?;

    pool.is_active = false;
    pool.last_update_time = clock.unix_timestamp;

    emit!(PoolPaused {
        pool_id: pool.pool_id,
        admin: ctx.accounts.admin.key(),
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

#[event]
pub struct PoolInitialized {
    pub pool_id: u64,
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityAdded {
    pub pool_id: u64,
    pub provider: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub lp_tokens: u64,
    pub timestamp: i64,
}

#[event]
pub struct SwapExecuted {
    pub pool_id: u64,
    pub user: Pubkey,
    pub token_in: Pubkey,
    pub token_out: Pubkey,
    pub amount_in: u64,
    pub amount_out: u64,
    pub timestamp: i64,
}

#[event]
pub struct LiquidityRemoved {
    pub pool_id: u64,
    pub provider: Pubkey,
    pub amount_a: u64,
    pub amount_b: u64,
    pub lp_tokens: u64,
    pub timestamp: i64,
}

#[event]
pub struct PoolPaused {
    pub pool_id: u64,
    pub admin: Pubkey,
    pub timestamp: i64,
} 