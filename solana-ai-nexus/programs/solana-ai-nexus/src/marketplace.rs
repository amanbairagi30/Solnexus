use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

#[account]
pub struct Marketplace {
    pub authority: Pubkey,
    pub listing_count: u64,
    pub total_volume: u64,
    pub fee_percentage: u8,
    pub is_active: bool,
}

#[account]
pub struct AgentListing {
    pub listing_id: u64,
    pub agent_id: u64,
    pub seller: Pubkey,
    pub price: u64,
    pub description: String,
    pub created_at: i64,
    pub status: ListingStatus,
    pub rating: u8,
    pub reviews_count: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ListingStatus {
    Active,
    Sold,
    Cancelled,
    Suspended,
}

#[derive(Accounts)]
pub struct InitializeMarketplace<'info> {
    #[account(init, payer = authority, space = 8 + Marketplace::SPACE)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateListing<'info> {
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(init, payer = seller, space = 8 + AgentListing::SPACE)]
    pub listing: Account<'info, AgentListing>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PurchaseListing<'info> {
    #[account(mut)]
    pub marketplace: Account<'info, Marketplace>,
    #[account(mut)]
    pub listing: Account<'info, AgentListing>,
    #[account(mut)]
    pub buyer: Signer<'info>,
    #[account(mut)]
    pub buyer_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub seller_token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

impl Marketplace {
    pub const SPACE: usize = 8 + // discriminator
                            32 + // authority
                            8 + // listing_count
                            8 + // total_volume
                            1 + // fee_percentage
                            1 + // is_active
                            64; // padding
}

impl AgentListing {
    pub const SPACE: usize = 8 + // discriminator
                            8 + // listing_id
                            8 + // agent_id
                            32 + // seller
                            8 + // price
                            200 + // description
                            8 + // created_at
                            1 + // status
                            1 + // rating
                            4 + // reviews_count
                            64; // padding
}

#[event]
pub struct ListingCreated {
    pub listing_id: u64,
    pub agent_id: u64,
    pub seller: Pubkey,
    pub price: u64,
    pub timestamp: i64,
}

#[event]
pub struct ListingSold {
    pub listing_id: u64,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub price: u64,
    pub timestamp: i64,
}

// Add these instructions to your solana_ai_nexus module in lib.rs
pub fn initialize_marketplace(ctx: Context<InitializeMarketplace>) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    marketplace.authority = ctx.accounts.authority.key();
    marketplace.listing_count = 0;
    marketplace.total_volume = 0;
    marketplace.fee_percentage = 2; // 2% fee
    marketplace.is_active = true;
    Ok(())
}

pub fn create_listing(
    ctx: Context<CreateListing>,
    agent_id: u64,
    price: u64,
    description: String,
) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    let listing = &mut ctx.accounts.listing;
    let clock = Clock::get()?;

    listing.listing_id = marketplace.listing_count;
    listing.agent_id = agent_id;
    listing.seller = ctx.accounts.seller.key();
    listing.price = price;
    listing.description = description;
    listing.created_at = clock.unix_timestamp;
    listing.status = ListingStatus::Active;
    listing.rating = 0;
    listing.reviews_count = 0;

    marketplace.listing_count = marketplace.listing_count.checked_add(1).unwrap();

    emit!(ListingCreated {
        listing_id: listing.listing_id,
        agent_id: listing.agent_id,
        seller: listing.seller,
        price: listing.price,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
}

pub fn purchase_listing(ctx: Context<PurchaseListing>) -> Result<()> {
    let marketplace = &mut ctx.accounts.marketplace;
    let listing = &mut ctx.accounts.listing;
    let clock = Clock::get()?;

    require!(listing.status == ListingStatus::Active, CustomError::InvalidListingStatus);

    // Calculate fees
    let fee_amount = (listing.price as u128)
        .checked_mul(marketplace.fee_percentage as u128)
        .unwrap()
        .checked_div(100)
        .unwrap() as u64;
    let seller_amount = listing.price.checked_sub(fee_amount).unwrap();

    // Transfer tokens from buyer to seller
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.buyer_token_account.to_account_info(),
                to: ctx.accounts.seller_token_account.to_account_info(),
                authority: ctx.accounts.buyer.to_account_info(),
            },
        ),
        seller_amount,
    )?;

    listing.status = ListingStatus::Sold;
    marketplace.total_volume = marketplace.total_volume.checked_add(listing.price).unwrap();

    emit!(ListingSold {
        listing_id: listing.listing_id,
        buyer: ctx.accounts.buyer.key(),
        seller: listing.seller,
        price: listing.price,
        timestamp: clock.unix_timestamp,
    });

    Ok(())
} 