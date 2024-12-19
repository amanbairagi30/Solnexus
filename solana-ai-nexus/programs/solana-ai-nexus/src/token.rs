use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

#[account]
pub struct TokenConfig {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub total_staked: u64,
    pub reward_rate: u64,  // Rewards per epoch
    pub epoch_duration: i64, // Duration in seconds
    pub min_stake_duration: i64,
    pub last_update_time: i64,
}

#[account]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub last_claim_time: i64,
    pub locked_until: i64,
    pub rewards_earned: u64,
}

#[account]
pub struct RewardVault {
    pub authority: Pubkey,
    pub token_account: Pubkey,
    pub total_distributed: u64,
}

#[derive(Accounts)]
pub struct InitializeTokenConfig<'info> {
    #[account(init, payer = authority, space = 8 + TokenConfig::SPACE)]
    pub config: Account<'info, TokenConfig>,
    pub token_mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub config: Account<'info, TokenConfig>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + StakeAccount::SPACE,
        seeds = [b"stake", owner.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub stake_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub config: Account<'info, TokenConfig>,
    #[account(mut)]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)]
    pub reward_vault: Account<'info, RewardVault>,
    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl TokenConfig {
    pub const SPACE: usize = 8 + // discriminator
                            32 + // authority
                            32 + // token_mint
                            8 + // total_staked
                            8 + // reward_rate
                            8 + // epoch_duration
                            8 + // min_stake_duration
                            8 + // last_update_time
                            64; // padding
}

impl StakeAccount {
    pub const SPACE: usize = 8 + // discriminator
                            32 + // owner
                            8 + // amount
                            8 + // start_time
                            8 + // last_claim_time
                            8 + // locked_until
                            8 + // rewards_earned
                            64; // padding
}

#[event]
pub struct TokensStaked {
    pub owner: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct RewardsClaimed {
    pub owner: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

pub fn initialize_token_config(
    ctx: Context<InitializeTokenConfig>,
    reward_rate: u64,
    epoch_duration: i64,
    min_stake_duration: i64,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let clock = Clock::get()?;

    config.authority = ctx.accounts.authority.key();
    config.token_mint = ctx.accounts.token_mint.key();
    config.total_staked = 0;
    config.reward_rate = reward_rate;
    config.epoch_duration = epoch_duration;
    config.min_stake_duration = min_stake_duration;
    config.last_update_time = clock.unix_timestamp;

    Ok(())
}

pub fn stake_tokens(ctx: Context<Stake>, amount: u64) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let stake_account = &mut ctx.accounts.stake_account;
    let clock = Clock::get()?;

    // Transfer tokens to stake account
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.stake_token_account.to_account_info(),
                authority: ctx.accounts.owner.to_account_info(),
            },
        ),
        amount,
    )?;

    // Update stake account
    stake_account.owner = ctx.accounts.owner.key();
    stake_account.amount = stake_account.amount.checked_add(amount).unwrap();
    stake_account.start_time = clock.unix_timestamp;
    stake_account.last_claim_time = clock.unix_timestamp;
    stake_account.locked_until = clock.unix_timestamp.checked_add(config.min_stake_duration).unwrap();

    // Update config
    config.total_staked = config.total_staked.checked_add(amount).unwrap();
    config.last_update_time = clock.unix_timestamp;

    emit!(TokensStaked {
        owner: stake_account.owner,
        amount,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
    let config = &ctx.accounts.config;
    let stake_account = &mut ctx.accounts.stake_account;
    let clock = Clock::get()?;

    // Calculate rewards
    let time_staked = clock.unix_timestamp.checked_sub(stake_account.last_claim_time).unwrap();
    let epochs = time_staked.checked_div(config.epoch_duration).unwrap();
    
    let reward_amount = (stake_account.amount as u128)
        .checked_mul(config.reward_rate as u128)
        .unwrap()
        .checked_mul(epochs as u128)
        .unwrap()
        .checked_div(100)
        .unwrap() as u64;

    if reward_amount > 0 {
        // Transfer rewards
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.reward_vault.token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.reward_vault.to_account_info(),
                },
            ),
            reward_amount,
        )?;

        stake_account.rewards_earned = stake_account.rewards_earned.checked_add(reward_amount).unwrap();
        stake_account.last_claim_time = clock.unix_timestamp;

        emit!(RewardsClaimed {
            owner: stake_account.owner,
            amount: reward_amount,
            timestamp: clock.unix_timestamp,
        });
    }

    Ok(())
} 