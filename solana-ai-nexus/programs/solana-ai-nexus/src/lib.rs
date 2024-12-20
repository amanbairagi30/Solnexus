use anchor_lang::prelude::*;
use anchor_spl::token::{self};

mod state;
mod contexts;
mod errors;
mod events;

use state::*;
use contexts::*;
use events::*;

declare_id!("6gT2Yv1C1RdgN8ABQrbQ9dzzMbKVjLtRJ45ziSkN6nZc");

const MAX_ACTIONS_PER_MINUTE: u32 = 10;
const RATE_LIMIT_DURATION: i64 = 60;

#[program]
pub mod solana_ai_nexus {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.agent_count = 0;
        state.task_count = 0;
        Ok(())
    }

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        description: String,
        metadata_uri: String,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let agent = &mut ctx.accounts.agent;

        agent.id = state.agent_count;
        agent.owner = ctx.accounts.owner.key();
        agent.name = name;
        agent.description = description;
        agent.metadata_uri = metadata_uri;
        agent.reputation_score = 0;
        agent.tasks_completed = 0;
        agent.is_active = true;

        state.agent_count = state.agent_count.checked_add(1).unwrap();
        
        Ok(())
    }

    pub fn create_task(
        ctx: Context<CreateTask>,
        description: String,
        reward: u64,
        deadline: i64,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        let task = &mut ctx.accounts.task;

        task.id = state.task_count;
        task.creator = ctx.accounts.creator.key();
        task.description = description;
        task.reward = reward;
        task.deadline = deadline;
        task.status = TaskStatus::Pending;

        state.task_count = state.task_count.checked_add(1).unwrap();
        Ok(())
    }

    pub fn assign_task(ctx: Context<AssignTask>, agent_id: u64) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let agent = &ctx.accounts.agent;

        require!(agent.is_active, errors::CustomError::AgentNotActive);
        require!(task.status == TaskStatus::Pending, errors::CustomError::InvalidTaskStatus);

        task.agent_id = Some(agent_id);
        task.status = TaskStatus::InProgress;
        Ok(())
    }

    pub fn complete_task(ctx: Context<CompleteTask>, result_uri: String) -> Result<()> {
        let task = &mut ctx.accounts.task;
        let agent = &mut ctx.accounts.agent;

        require!(task.status == TaskStatus::InProgress, errors::CustomError::InvalidTaskStatus);
        
        task.status = TaskStatus::Completed;
        task.result_uri = Some(result_uri);
        agent.tasks_completed = agent.tasks_completed.checked_add(1).unwrap();
        
        Ok(())
    }

    pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64) -> Result<()> {
        let staker_key = ctx.accounts.staker.key();
        
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.stake_account.to_account_info(),
                    authority: ctx.accounts.staker.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(StakeEvent {
            staker: staker_key,
            amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_reputation(
        ctx: Context<UpdateReputation>,
        agent_id: u64,
        score_delta: i32,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        
        require!(
            ctx.accounts.authority.key() == ctx.accounts.state.authority,
            errors::CustomError::Unauthorized
        );

        let new_score = if score_delta >= 0 {
            agent.reputation_score.checked_add(score_delta as u32)
        } else {
            agent.reputation_score.checked_sub(score_delta.abs() as u32)
        }.ok_or(errors::CustomError::InvalidReputationScore)?;

        let old_score = agent.reputation_score;
        agent.reputation_score = new_score;

        emit!(ReputationUpdateEvent {
            agent_id,
            old_score,
            new_score,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    pub fn pause_protocol(ctx: Context<AdminOnly>) -> Result<()> {
        require!(
            ctx.accounts.authority.key() == ctx.accounts.state.authority,
            errors::CustomError::Unauthorized
        );
        Ok(())
    }

    pub fn validate_transaction(ctx: Context<ValidateTransaction>) -> Result<()> {
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;
        let transaction = &ctx.accounts.transaction;
        
        require!(current_time <= transaction.deadline, errors::CustomError::TransactionExpired);
        require!(transaction.slippage <= 1000, errors::CustomError::SlippageExceeded);
        require!(transaction.amount > 0, errors::CustomError::InsufficientStake);
        
        Ok(())
    }
}

#[error_code]
pub enum CustomError {
    #[msg("Agent is not active")]
    AgentNotActive,
    #[msg("Invalid task status")]
    InvalidTaskStatus,
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    #[msg("Invalid reputation score")]
    InvalidReputationScore,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Transaction expired")]
    TransactionExpired,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    #[msg("Insufficient stake")]
    InsufficientStake,
}
