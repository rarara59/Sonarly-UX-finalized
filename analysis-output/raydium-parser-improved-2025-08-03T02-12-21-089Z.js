/**
 * GENERATED: Improved Raydium Parser with Complete Discriminator Support
 * Generated: 2025-08-03T02:12:21.095Z
 * Based on known Raydium AMM V4 patterns and discriminators
 */

export class RaydiumParserImproved {
  constructor() {
    // Complete discriminator mapping
    this.DISCRIMINATORS = {
    "e7": {
        "name": "initialize2",
        "type": "lp_creation",
        "minAccounts": 19,
        "accountStructure": {
            "0": "TOKEN_PROGRAM",
            "1": "SYSTEM_PROGRAM",
            "2": "RENT_SYSVAR",
            "3": "ASSOCIATED_TOKEN_PROGRAM",
            "4": "AMM_ID",
            "5": "AMM_AUTHORITY",
            "6": "AMM_OPEN_ORDERS",
            "7": "AMM_LP_MINT",
            "8": "AMM_COIN_MINT",
            "9": "AMM_PC_MINT",
            "10": "AMM_COIN_VAULT",
            "11": "AMM_PC_VAULT",
            "12": "AMM_TARGET_ORDERS",
            "13": "SERUM_MARKET",
            "14": "SERUM_PROGRAM",
            "15": "SERUM_COIN_VAULT",
            "16": "SERUM_PC_VAULT",
            "17": "SERUM_VAULT_SIGNER",
            "18": "USER_WALLET"
        }
    },
    "e8": {
        "name": "initialize",
        "type": "lp_creation",
        "minAccounts": 18,
        "accountStructure": {
            "0": "TOKEN_PROGRAM",
            "1": "SYSTEM_PROGRAM",
            "2": "RENT_SYSVAR",
            "3": "AMM_ID",
            "4": "AMM_AUTHORITY",
            "5": "AMM_OPEN_ORDERS",
            "6": "AMM_LP_MINT",
            "7": "AMM_COIN_MINT",
            "8": "AMM_PC_MINT",
            "9": "AMM_COIN_VAULT",
            "10": "AMM_PC_VAULT",
            "11": "AMM_TARGET_ORDERS",
            "12": "SERUM_MARKET",
            "13": "SERUM_PROGRAM",
            "14": "SERUM_COIN_VAULT",
            "15": "SERUM_PC_VAULT",
            "16": "SERUM_VAULT_SIGNER",
            "17": "USER_WALLET"
        }
    },
    "e9": {
        "name": "initialize3",
        "type": "lp_creation",
        "minAccounts": 18,
        "accountStructure": {
            "0": "TOKEN_PROGRAM",
            "1": "SYSTEM_PROGRAM",
            "2": "RENT_SYSVAR",
            "3": "AMM_ID",
            "4": "AMM_AUTHORITY",
            "5": "AMM_OPEN_ORDERS",
            "6": "AMM_LP_MINT",
            "7": "AMM_COIN_MINT",
            "8": "AMM_PC_MINT",
            "9": "AMM_COIN_VAULT",
            "10": "AMM_PC_VAULT",
            "11": "AMM_TARGET_ORDERS",
            "12": "SERUM_MARKET",
            "13": "SERUM_PROGRAM",
            "14": "SERUM_COIN_VAULT",
            "15": "SERUM_PC_VAULT",
            "16": "SERUM_VAULT_SIGNER",
            "17": "USER_WALLET"
        }
    },
    "ea": {
        "name": "initializeV4",
        "type": "lp_creation",
        "minAccounts": 20,
        "accountStructure": {}
    },
    "eb": {
        "name": "initializeV5",
        "type": "lp_creation",
        "minAccounts": 21,
        "accountStructure": {}
    },
    "f8": {
        "name": "createPool",
        "type": "lp_creation",
        "minAccounts": 16,
        "accountStructure": {}
    },
    "09": {
        "name": "swap",
        "type": "swap",
        "minAccounts": 8
    },
    "0a": {
        "name": "swapV2",
        "type": "swap",
        "minAccounts": 9
    },
    "cc": {
        "name": "deposit",
        "type": "liquidity",
        "minAccounts": 10
    },
    "e3": {
        "name": "withdraw",
        "type": "liquidity",
        "minAccounts": 10
    }
};
    
    // Token extraction rules per discriminator
    this.EXTRACTION_RULES = {
    "e7": {
        "primaryTokenPosition": 8,
        "secondaryTokenPosition": 9,
        "ammIdPosition": 4
    },
    "e8": {
        "primaryTokenPosition": 7,
        "secondaryTokenPosition": 8,
        "ammIdPosition": 3
    },
    "e9": {
        "primaryTokenPosition": 7,
        "secondaryTokenPosition": 8,
        "ammIdPosition": 3
    }
};
    
    // Known addresses for classification
    this.KNOWN_ADDRESSES = {
    "programs": {
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "Token Program",
        "11111111111111111111111111111111111111111112": "System Program",
        "SysvarRent111111111111111111111111111111111": "Rent Sysvar",
        "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated Token Program",
        "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": "Raydium AMM V4",
        "srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX": "Serum DEX V3",
        "ComputeBudget111111111111111111111111111111": "Compute Budget Program"
    },
    "quoteTokens": {
        "So11111111111111111111111111111111111111112": "SOL",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
        "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "BONK",
        "5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC": "PEPE"
    }
};
  }
  
  /**
   * Check if instruction is LP creation based on discriminator
   */
  isLPCreation(discriminatorHex) {
    const disc = this.DISCRIMINATORS[discriminatorHex];
    return disc && disc.type === 'lp_creation';
  }
  
  /**
   * Get instruction name from discriminator
   */
  getInstructionName(discriminatorHex) {
    const disc = this.DISCRIMINATORS[discriminatorHex];
    return disc ? disc.name : 'unknown';
  }
  
  /**
   * Extract token mints based on discriminator-specific rules
   */
  extractTokenMints(discriminatorHex, accounts, accountKeys) {
    const rules = this.EXTRACTION_RULES[discriminatorHex];
    if (!rules) {
      // Unknown discriminator - use heuristics
      return this.extractTokenMintsHeuristic(accounts, accountKeys);
    }
    
    // Validate account count
    const discInfo = this.DISCRIMINATORS[discriminatorHex];
    if (accounts.length < discInfo.minAccounts) {
      return null;
    }
    
    // Extract based on known positions
    const primaryIndex = accounts[rules.primaryTokenPosition];
    const secondaryIndex = accounts[rules.secondaryTokenPosition];
    const ammIndex = accounts[rules.ammIdPosition];
    
    if (primaryIndex >= accountKeys.length || 
        secondaryIndex >= accountKeys.length || 
        ammIndex >= accountKeys.length) {
      return null;
    }
    
    return {
      primaryToken: accountKeys[primaryIndex],
      secondaryToken: accountKeys[secondaryIndex],
      ammId: accountKeys[ammIndex],
      instructionType: discInfo.name,
      discriminator: discriminatorHex
    };
  }
  
  /**
   * Heuristic extraction for unknown discriminators
   */
  extractTokenMintsHeuristic(accounts, accountKeys) {
    // Look for quote tokens in the accounts
    let quoteTokenIndex = -1;
    let quoteTokenName = '';
    
    for (let i = 0; i < accounts.length; i++) {
      const address = accountKeys[accounts[i]];
      if (this.KNOWN_ADDRESSES.quoteTokens[address]) {
        quoteTokenIndex = i;
        quoteTokenName = this.KNOWN_ADDRESSES.quoteTokens[address];
        break;
      }
    }
    
    if (quoteTokenIndex === -1) {
      return null; // No quote token found
    }
    
    // Look for non-program addresses that could be token mints
    const possibleTokens = [];
    for (let i = 0; i < accounts.length; i++) {
      const address = accountKeys[accounts[i]];
      if (!this.KNOWN_ADDRESSES.programs[address] && 
          !this.KNOWN_ADDRESSES.quoteTokens[address]) {
        possibleTokens.push({ index: i, address });
      }
    }
    
    // Heuristic: meme token is usually near quote token
    let memeTokenIndex = -1;
    const nearbyIndices = [
      quoteTokenIndex - 1, 
      quoteTokenIndex + 1, 
      quoteTokenIndex - 2, 
      quoteTokenIndex + 2
    ];
    
    for (const idx of nearbyIndices) {
      if (idx >= 0 && idx < accounts.length) {
        const candidate = possibleTokens.find(t => t.index === idx);
        if (candidate) {
          memeTokenIndex = idx;
          break;
        }
      }
    }
    
    if (memeTokenIndex === -1 && possibleTokens.length > 0) {
      // Fallback: use first non-program address
      memeTokenIndex = possibleTokens[0].index;
    }
    
    // Find AMM ID (usually appears multiple times)
    const addressCounts = {};
    accounts.forEach(idx => {
      const addr = accountKeys[idx];
      addressCounts[addr] = (addressCounts[addr] || 0) + 1;
    });
    
    let ammId = null;
    for (const [addr, count] of Object.entries(addressCounts)) {
      if (count > 1 && !this.KNOWN_ADDRESSES.programs[addr]) {
        ammId = addr;
        break;
      }
    }
    
    return {
      primaryToken: memeTokenIndex !== -1 ? accountKeys[accounts[memeTokenIndex]] : null,
      secondaryToken: accountKeys[accounts[quoteTokenIndex]],
      ammId: ammId,
      instructionType: 'unknown_heuristic',
      quoteName: quoteTokenName
    };
  }
}

export default RaydiumParserImproved;
