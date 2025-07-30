/**
 * LAYOUT CONSTANTS - PRODUCTION GRADE
 * 
 * Binary layout offsets for Raydium and Orca account data parsing.
 * These offsets are based on actual Solana program account structures
 * and are critical for accurate LP data extraction.
 */

// Raydium AMM Pool Layout (752 bytes total)
const RAYDIUM_LAYOUT_CONSTANTS = {
  // Pool status and configuration
  STATUS_OFFSET: 8,                    // u64 - Pool status (6 = initialized)
  NON_CE_FLAG_OFFSET: 16,             // u64 - Nonce
  ORDER_NUM_OFFSET: 24,               // u64 - Order number
  DEPTH_OFFSET: 32,                   // u64 - Depth
  BASE_DECIMALS_OFFSET: 40,           // u64 - Base token decimals
  QUOTE_DECIMALS_OFFSET: 48,          // u64 - Quote token decimals
  STATE_OFFSET: 56,                   // u64 - State
  RESET_FLAG_OFFSET: 64,              // u64 - Reset flag
  
  // Token mint addresses (32 bytes each)
  BASE_MINT_OFFSET: 72,               // Pubkey - Base token mint
  QUOTE_MINT_OFFSET: 104,             // Pubkey - Quote token mint
  LP_MINT_OFFSET: 136,                // Pubkey - LP token mint
  
  // Market and authority addresses
  OPEN_ORDERS_OFFSET: 168,            // Pubkey - OpenOrders account
  TARGET_ORDERS_OFFSET: 200,          // Pubkey - Target orders
  BASE_VAULT_OFFSET: 232,             // Pubkey - Base token vault
  QUOTE_VAULT_OFFSET: 264,            // Pubkey - Quote token vault
  WITHDRAW_QUEUE_OFFSET: 296,         // Pubkey - Withdraw queue
  LP_VAULT_OFFSET: 328,               // Pubkey - LP token vault
  MARKET_VERSION_OFFSET: 360,         // u64 - Market version
  MARKET_ID_OFFSET: 368,              // Pubkey - Market ID
  MARKET_AUTHORITY_OFFSET: 400,       // Pubkey - Market authority
  
  // Reserve amounts and fees
  BASE_RESERVE_OFFSET: 432,           // u64 - Base token reserve
  QUOTE_RESERVE_OFFSET: 440,          // u64 - Quote token reserve
  LP_SUPPLY_OFFSET: 448,              // u64 - LP token supply
  START_TIME_OFFSET: 456              // u64 - Pool start time
};

// Orca Whirlpool Layout (653 bytes total)
const ORCA_LAYOUT_CONSTANTS = {
  // Pool configuration
  WHIRLPOOLS_CONFIG_OFFSET: 8,        // Pubkey - Whirlpools config
  WHIRLPOOL_BUMP_OFFSET: 40,          // u8[1] - Whirlpool bump
  TICK_SPACING_OFFSET: 41,            // u16 - Tick spacing
  TICK_SPACING_SEED_OFFSET: 43,       // u8[2] - Tick spacing seed
  FEE_RATE_OFFSET: 45,                // u16 - Fee rate (basis points)
  PROTOCOL_FEE_RATE_OFFSET: 47,       // u16 - Protocol fee rate
  
  // Liquidity and price
  LIQUIDITY_OFFSET: 49,               // u128 - Current liquidity
  SQRT_PRICE_OFFSET: 65,              // u128 - Current sqrt price
  TICK_CURRENT_INDEX_OFFSET: 81,      // i32 - Current tick index
  PROTOCOL_FEE_OWED_A_OFFSET: 85,     // u64 - Protocol fee owed A
  PROTOCOL_FEE_OWED_B_OFFSET: 93,     // u64 - Protocol fee owed B
  
  // Token A configuration
  TOKEN_MINT_A_OFFSET: 101,           // Pubkey - Token A mint
  TOKEN_VAULT_A_OFFSET: 133,          // Pubkey - Token A vault
  FEE_GROWTH_GLOBAL_A_OFFSET: 165,    // u128 - Fee growth global A
  
  // Token B configuration  
  TOKEN_MINT_B_OFFSET: 181,           // Pubkey - Token B mint
  TOKEN_VAULT_B_OFFSET: 213,          // Pubkey - Token B vault
  FEE_GROWTH_GLOBAL_B_OFFSET: 245,    // u128 - Fee growth global B
  
  // Reward tokens (3 reward token slots)
  REWARD_LAST_UPDATED_TIMESTAMP_OFFSET: 261, // u64 - Last updated timestamp
  REWARD_INFOS_OFFSET: 269,           // RewardInfo[3] - Reward token info array
  
  // Additional fields
  ORACLE_OFFSET: 557,                 // Pubkey - Oracle account
  
  // Reward info structure (96 bytes each, 3 total = 288 bytes)
  REWARD_INFO_SIZE: 96,
  REWARD_INFO_MINT_OFFSET: 0,         // Pubkey - Reward token mint (32 bytes)
  REWARD_INFO_VAULT_OFFSET: 32,       // Pubkey - Reward token vault (32 bytes)
  REWARD_INFO_AUTHORITY_OFFSET: 64,   // Pubkey - Reward authority (32 bytes)
  REWARD_INFO_EMISSIONS_PER_SECOND_X64_OFFSET: 96, // u128 - Emissions per second
  REWARD_INFO_GROWTH_GLOBAL_X64_OFFSET: 112        // u128 - Growth global
};

// Standard Solana Mint Account Layout (82 bytes)
const MINT_LAYOUT_CONSTANTS = {
  MINT_AUTHORITY_OPTION_OFFSET: 0,    // u32 - COption (4 bytes)
  MINT_AUTHORITY_OFFSET: 4,           // Pubkey - Mint authority (32 bytes)
  SUPPLY_OFFSET: 36,                  // u64 - Total supply
  DECIMALS_OFFSET: 44,                // u8 - Decimals
  IS_INITIALIZED_OFFSET: 45,          // u8 - Is initialized flag
  FREEZE_AUTHORITY_OPTION_OFFSET: 46, // u32 - COption (4 bytes)
  FREEZE_AUTHORITY_OFFSET: 50         // Pubkey - Freeze authority (32 bytes)
};

// Token Account Layout (165 bytes)
const TOKEN_ACCOUNT_LAYOUT_CONSTANTS = {
  MINT_OFFSET: 0,                     // Pubkey - Associated mint (32 bytes)
  OWNER_OFFSET: 32,                   // Pubkey - Owner (32 bytes)
  AMOUNT_OFFSET: 64,                  // u64 - Token amount
  DELEGATE_OPTION_OFFSET: 72,         // u32 - COption (4 bytes)
  DELEGATE_OFFSET: 76,                // Pubkey - Delegate (32 bytes)
  STATE_OFFSET: 108,                  // u8 - Account state
  IS_NATIVE_OPTION_OFFSET: 109,       // u32 - COption (4 bytes)
  IS_NATIVE_OFFSET: 113,              // u64 - Rent exempt reserve
  DELEGATED_AMOUNT_OFFSET: 121,       // u64 - Delegated amount
  CLOSE_AUTHORITY_OPTION_OFFSET: 129, // u32 - COption (4 bytes)
  CLOSE_AUTHORITY_OFFSET: 133         // Pubkey - Close authority (32 bytes)
};

// Export constants for use in parsing functions
export {
  RAYDIUM_LAYOUT_CONSTANTS,
  ORCA_LAYOUT_CONSTANTS,
  MINT_LAYOUT_CONSTANTS,
  TOKEN_ACCOUNT_LAYOUT_CONSTANTS
};