// src/services/token-pre-filter.service.ts

type TokenPreFilterInput = {
    address: string;
    name: string;
    symbol: string;
    lpValueUSD: number;
    uniqueHolders: number;
    buyTransactions: number;
    dex: 'Raydium' | 'Orca' | 'Meteora' | string;
    hasMintAuthority: boolean;
    hasFreezeAuthority: boolean;
    largestHolderPercentage: number;
    firstSeenTimestamp: number; // UNIX timestamp
    currentTimestamp: number; // UNIX timestamp
    smartWalletsInteracted: string[]; // array of wallet addresses
  };
  
  type TokenPreFilterResult = {
    passed: boolean;
    rejectionReasons: string[];
  };
  
  export class TokenPreFilterService {
    static evaluateToken(input: TokenPreFilterInput): TokenPreFilterResult {
      const rejectionReasons: string[] = [];
      const timeSinceFirstSeen = (input.currentTimestamp - input.firstSeenTimestamp) / 60; // in minutes
  
      // Edge override: wallet overlap auto-pass
      if (input.smartWalletsInteracted.length >= 2 && timeSinceFirstSeen <= 3) {
        return { passed: true, rejectionReasons: [] };
      }
  
      // Liquidity threshold
      if (input.lpValueUSD < 8000) {
        rejectionReasons.push('LP below $8k threshold');
      }
  
      // Holder threshold
      if (input.uniqueHolders < 25) {
        rejectionReasons.push('Fewer than 25 unique holders');
      }
  
      // Buy transaction threshold
      if (input.buyTransactions < 10) {
        rejectionReasons.push('Fewer than 10 buy transactions');
      }
  
      // DEX whitelist
      const approvedDEX = ['Raydium', 'Orca', 'Meteora'];
      if (!approvedDEX.includes(input.dex)) {
        rejectionReasons.push(`DEX not in approved list: ${input.dex}`);
      }
  
      // Mint authority check
      if (input.hasMintAuthority && timeSinceFirstSeen > 3) {
        rejectionReasons.push('Mint authority still present after 3 minutes');
      }
  
      // Freeze authority check
      if (input.hasFreezeAuthority) {
        rejectionReasons.push('Freeze authority exists');
      }
  
      // Holder concentration
      if (input.largestHolderPercentage > 50) {
        rejectionReasons.push('Largest holder controls >50% of supply');
      }
  
      // Metadata check
      if (!input.name || !input.symbol) {
        rejectionReasons.push('Missing token name or symbol');
      }
  
      const passed = rejectionReasons.length === 0;
      return { passed, rejectionReasons };
    }
  }