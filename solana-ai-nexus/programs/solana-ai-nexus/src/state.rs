use anchor_lang::prelude::*;

#[account]
pub struct State {
    pub authority: Pubkey,
    pub agent_count: u64,
    pub task_count: u64,
    pub is_paused: bool,
}

#[account]
pub struct Agent {
    pub id: u64,
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub metadata_uri: String,
    pub reputation_score: u32,
    pub tasks_completed: u32,
    pub is_active: bool,
}

#[account]
pub struct Task {
    pub id: u64,
    pub creator: Pubkey,
    pub agent_id: Option<u64>,
    pub description: String,
    pub reward: u64,
    pub deadline: i64,
    pub status: TaskStatus,
    pub result_uri: Option<String>,
}

#[account]
pub struct Transaction {
    pub amount: u64,
    pub slippage: u64,
    pub deadline: i64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Copy)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Cancelled,
}

impl State {
    pub const SPACE: usize = 8 + 32 + 8 + 8 + 1 + 64;
}

impl Agent {
    pub const SPACE: usize = 8 + 8 + 32 + 64 + 256 + 128 + 4 + 4 + 1 + 64;
}

impl Task {
    pub const SPACE: usize = 8 + 8 + 32 + 9 + 256 + 8 + 8 + 1 + 129 + 64;
}

impl Transaction {
    pub const SPACE: usize = 8 + 8 + 8 + 8 + 64;
}
