/**
 * Generate Raydium patterns based on known discriminators and account structures
 * This provides a foundation for building the parser without needing live data
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Known Raydium AMM V4 discriminators and their account structures
const RAYDIUM_PATTERNS = {
  discriminators: {
    'e7': {
      name: 'initialize2',
      type: 'lp_creation',
      minAccounts: 19,
      accountStructure: {
        0: 'TOKEN_PROGRAM',
        1: 'SYSTEM_PROGRAM', 
        2: 'RENT_SYSVAR',
        3: 'ASSOCIATED_TOKEN_PROGRAM',
        4: 'AMM_ID',
        5: 'AMM_AUTHORITY',
        6: 'AMM_OPEN_ORDERS',
        7: 'AMM_LP_MINT',
        8: 'AMM_COIN_MINT',     // Token A (meme token)
        9: 'AMM_PC_MINT',       // Token B (quote token like SOL/USDC)
        10: 'AMM_COIN_VAULT',
        11: 'AMM_PC_VAULT',
        12: 'AMM_TARGET_ORDERS',
        13: 'SERUM_MARKET',
        14: 'SERUM_PROGRAM',
        15: 'SERUM_COIN_VAULT',
        16: 'SERUM_PC_VAULT',
        17: 'SERUM_VAULT_SIGNER',
        18: 'USER_WALLET'
      }
    },
    'e8': {
      name: 'initialize',
      type: 'lp_creation',
      minAccounts: 18,
      accountStructure: {
        0: 'TOKEN_PROGRAM',
        1: 'SYSTEM_PROGRAM',
        2: 'RENT_SYSVAR',
        3: 'AMM_ID',
        4: 'AMM_AUTHORITY',
        5: 'AMM_OPEN_ORDERS',
        6: 'AMM_LP_MINT',
        7: 'AMM_COIN_MINT',     // Token A (meme token)
        8: 'AMM_PC_MINT',       // Token B (quote token)
        9: 'AMM_COIN_VAULT',
        10: 'AMM_PC_VAULT',
        11: 'AMM_TARGET_ORDERS',
        12: 'SERUM_MARKET',
        13: 'SERUM_PROGRAM',
        14: 'SERUM_COIN_VAULT',
        15: 'SERUM_PC_VAULT',
        16: 'SERUM_VAULT_SIGNER',
        17: 'USER_WALLET'
      }
    },
    'e9': {
      name: 'initialize3',
      type: 'lp_creation',
      minAccounts: 18,
      accountStructure: {
        // Same as e8 based on our analysis
        0: 'TOKEN_PROGRAM',
        1: 'SYSTEM_PROGRAM',
        2: 'RENT_SYSVAR',
        3: 'AMM_ID',
        4: 'AMM_AUTHORITY',
        5: 'AMM_OPEN_ORDERS',
        6: 'AMM_LP_MINT',
        7: 'AMM_COIN_MINT',     // Token A (meme token)
        8: 'AMM_PC_MINT',       // Token B (quote token)
        9: 'AMM_COIN_VAULT',
        10: 'AMM_PC_VAULT',
        11: 'AMM_TARGET_ORDERS',
        12: 'SERUM_MARKET',
        13: 'SERUM_PROGRAM',
        14: 'SERUM_COIN_VAULT',
        15: 'SERUM_PC_VAULT',
        16: 'SERUM_VAULT_SIGNER',
        17: 'USER_WALLET'
      }
    },
    'ea': {
      name: 'initializeV4',
      type: 'lp_creation',
      minAccounts: 20,
      accountStructure: {} // To be determined from live data
    },
    'eb': {
      name: 'initializeV5',
      type: 'lp_creation',
      minAccounts: 21,
      accountStructure: {} // To be determined from live data
    },
    'f8': {
      name: 'createPool',
      type: 'lp_creation',
      minAccounts: 16,
      accountStructure: {} // To be determined from live data
    },
    '09': {
      name: 'swap',
      type: 'swap',
      minAccounts: 8
    },
    '0a': {
      name: 'swapV2',
      type: 'swap',
      minAccounts: 9
    },
    'cc': {
      name: 'deposit',
      type: 'liquidity',
      minAccounts: 10
    },
    'e3': {
      name: 'withdraw',
      type: 'liquidity',
      minAccounts: 10
    }
  },
  
  tokenExtractionRules: {
    'e7': {
      primaryTokenPosition: 8,    // AMM_COIN_MINT
      secondaryTokenPosition: 9,  // AMM_PC_MINT
      ammIdPosition: 4           // AMM_ID
    },
    'e8': {
      primaryTokenPosition: 7,    // AMM_COIN_MINT
      secondaryTokenPosition: 8,  // AMM_PC_MINT
      ammIdPosition: 3           // AMM_ID
    },
    'e9': {
      primaryTokenPosition: 7,    // AMM_COIN_MINT (same as e8)
      secondaryTokenPosition: 8,  // AMM_PC_MINT
      ammIdPosition: 3           // AMM_ID
    }
  },
  
  knownAddresses: {
    programs: {
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
      '11111111111111111111111111111111111111111112': 'System Program',
      'SysvarRent111111111111111111111111111111111': 'Rent Sysvar',
      'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM V4',
      'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX': 'Serum DEX V3',
      'ComputeBudget111111111111111111111111111111': 'Compute Budget Program'
    },
    quoteTokens: {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
      '5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC': 'PEPE'
    }
  }
};

// Generate improved parser based on patterns
function generateImprovedParser() {
  const parserCode = `/**
 * GENERATED: Improved Raydium Parser with Complete Discriminator Support
 * Generated: ${new Date().toISOString()}
 * Based on known Raydium AMM V4 patterns and discriminators
 */

export class RaydiumParserImproved {
  constructor() {
    // Complete discriminator mapping
    this.DISCRIMINATORS = ${JSON.stringify(RAYDIUM_PATTERNS.discriminators, null, 4)};
    
    // Token extraction rules per discriminator
    this.EXTRACTION_RULES = ${JSON.stringify(RAYDIUM_PATTERNS.tokenExtractionRules, null, 4)};
    
    // Known addresses for classification
    this.KNOWN_ADDRESSES = ${JSON.stringify(RAYDIUM_PATTERNS.knownAddresses, null, 4)};
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
`;

  return parserCode;
}

// Generate analysis report
function generateAnalysisReport() {
  const report = {
    summary: {
      totalDiscriminators: Object.keys(RAYDIUM_PATTERNS.discriminators).length,
      lpCreationDiscriminators: Object.values(RAYDIUM_PATTERNS.discriminators)
        .filter(d => d.type === 'lp_creation').length,
      mappedLayouts: Object.keys(RAYDIUM_PATTERNS.tokenExtractionRules).length
    },
    discriminatorDetails: RAYDIUM_PATTERNS.discriminators,
    extractionRules: RAYDIUM_PATTERNS.tokenExtractionRules,
    recommendations: [
      'Implement dynamic discriminator detection for all LP creation variants',
      'Use discriminator-specific account layouts for accurate token extraction',
      'Add heuristic fallbacks for unknown discriminators',
      'Monitor for new discriminators and update mapping regularly',
      'Implement performance monitoring for extraction accuracy'
    ],
    implementationPlan: {
      step1: 'Replace static discriminator mapping with complete set',
      step2: 'Implement discriminator-aware token extraction',
      step3: 'Add heuristic extraction for unknown discriminators',
      step4: 'Add monitoring and alerts for unknown discriminators',
      step5: 'Test with known LP creation transactions'
    }
  };
  
  return report;
}

// Save generated files
async function saveGeneratedFiles() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.join(__dirname, '..', '..', 'analysis-output');
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    // Save analysis report
    const report = generateAnalysisReport();
    await fs.writeFile(
      path.join(outputDir, `raydium-pattern-analysis-${timestamp}.json`),
      JSON.stringify(report, null, 2)
    );
    
    // Save improved parser
    const parserCode = generateImprovedParser();
    await fs.writeFile(
      path.join(outputDir, `raydium-parser-improved-${timestamp}.js`),
      parserCode
    );
    
    // Save implementation guide
    const implementationGuide = `# Raydium Parser Implementation Guide

## Generated: ${new Date().toISOString()}

### Summary
This guide provides the implementation steps for fixing the Raydium parser based on known patterns.

### Known Discriminators
${Object.entries(RAYDIUM_PATTERNS.discriminators)
  .map(([hex, info]) => `- 0x${hex}: ${info.name} (${info.type})`)
  .join('\n')}

### Token Extraction Rules
- **0xe7 (initialize2)**: Token A at position 8, Token B at position 9
- **0xe8 (initialize)**: Token A at position 7, Token B at position 8  
- **0xe9 (initialize3)**: Token A at position 7, Token B at position 8 (same as e8)

### Implementation Steps

1. **Update liquidity-pool-creation-detector.service.js**
   - Replace static discriminator mapping with complete set
   - Add discriminator-aware token extraction
   - Implement heuristic fallback for unknown discriminators

2. **Add Monitoring**
   - Track unknown discriminators
   - Monitor extraction success rate
   - Alert on new patterns

3. **Testing**
   - Test with known LP creation transactions
   - Verify token extraction accuracy
   - Monitor performance metrics

### Code Changes Required

1. In \`analyzeRaydiumInstructionDebug\`:
   - Add complete discriminator mapping
   - Support unknown discriminators with heuristics
   - Pass discriminator to extraction method

2. In \`extractRaydiumTokenMintsDebug\`:  
   - Implement discriminator-aware position mapping
   - Add fallback heuristic extraction
   - Improve error handling

3. Add new methods:
   - \`recordUnknownDiscriminator\`
   - \`getMinAccountsForDiscriminator\`
   - \`getBaseConfidenceForDiscriminator\`
`;

    await fs.writeFile(
      path.join(outputDir, `implementation-guide-${timestamp}.md`),
      implementationGuide
    );
    
    console.log('✅ Generated files saved to:', outputDir);
    console.log(`   - raydium-pattern-analysis-${timestamp}.json`);
    console.log(`   - raydium-parser-improved-${timestamp}.js`);
    console.log(`   - implementation-guide-${timestamp}.md`);
    
    // Print summary
    console.log('\n📊 Pattern Analysis Summary:');
    console.log(`   - Total discriminators: ${report.summary.totalDiscriminators}`);
    console.log(`   - LP creation types: ${report.summary.lpCreationDiscriminators}`);
    console.log(`   - Mapped layouts: ${report.summary.mappedLayouts}`);
    
    console.log('\n🎯 Next Steps:');
    report.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    
  } catch (error) {
    console.error('❌ Error saving files:', error);
  }
}

// Run generation
console.log('🔬 Generating Raydium parser patterns and implementation...\n');
saveGeneratedFiles();