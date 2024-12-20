use anchor_lang::prelude::*;

#[error_code]
pub enum CustomError {
    #[msg("Agent is not active")]
    AgentNotActive,
    #[msg("Invalid task status")]
    InvalidTaskStatus,
    #[msg("Insufficient stake")]
    InsufficientStake,
    #[msg("Invalid reputation score")]
    InvalidReputationScore,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Proposal already exists")]
    ProposalExists,
    #[msg("Invalid proposal status")]
    InvalidProposalStatus,
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    #[msg("Invalid upgrade")]
    InvalidUpgrade,
    #[msg("Cache expired")]
    CacheExpired,
    #[msg("Maximum recovery attempts exceeded")]
    MaxRecoveryAttemptsExceeded,
    #[msg("Suspicious activity detected")]
    SuspiciousActivity,
    #[msg("Address is blocked")]
    AddressBlocked,
    #[msg("Invalid response format")]
    InvalidResponseFormat,
    #[msg("Transaction expired")]
    TransactionExpired,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
}