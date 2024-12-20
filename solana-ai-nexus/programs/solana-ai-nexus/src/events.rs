use anchor_lang::prelude::*;

#[event]
pub struct StakeEvent {
    pub staker: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct ReputationUpdateEvent {
    pub agent_id: u64,
    pub old_score: u32,
    pub new_score: u32,
    pub timestamp: i64,
}

#[event]
pub struct ProposalCreatedEvent {
    pub proposal_id: u64,
    pub proposer: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct VoteEvent {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub vote_for: bool,
    pub timestamp: i64,
}

#[event]
pub struct AnalyticsEvent {
    pub event_type: String,
    pub timestamp: i64,
}

#[event]
pub struct UpgradeEvent {
    pub version: u32,
    pub timestamp: i64,
}

#[event]
pub struct SystemEvent {
    pub event_type: String,
    pub severity: EventSeverity,
    pub timestamp: i64,
    pub details: String,
}

#[event]
pub struct SystemHealthEvent {
    pub timestamp: i64,
    pub status: SystemStatus,
    pub error_rate: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum EventSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy)]
pub enum SystemStatus {
    Healthy,
    Degraded,
    Critical,
    Maintenance,
}
