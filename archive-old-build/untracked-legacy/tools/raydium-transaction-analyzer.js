/**
 * RENAISSANCE-GRADE: Raydium Transaction Capture & Analysis System
 * Captures live Raydium LP creation transactions and reverse-engineers account structures
 * 
 * Performance Requirements:
 * - Transaction capture: 100+ samples in 30 minutes
 * - Analysis speed: <500ms per transaction
 * - Pattern detection: Identify all discriminator variants
 * - Account mapping: Map positions to actual token types
 */

import { Connection, PublicKey } from '@solana/web3.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class RaydiumTransactionAnalyzer {
  constructor(rpcManager) {
    this.rpcManager = rpcManager;
    this.connection = rpcManager.getCurrentConnection();
    
    // PRODUCTION RAYDIUM PROGRAM ID
    this.RAYDIUM_AMM_V4 = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
    
    // Capture configuration
    this.captureConfig = {
      maxTransactions: 100,
      timeoutMinutes: 30,
      minAccountCount: 16,
      maxAccountCount: 30,
      validDiscriminators: new Set()
    };
    
    // Analysis data
    this.capturedTransactions = [];
    this.analysisResults = {
      discriminators: new Map(),
      accountPatterns: new Map(),
      tokenPositions: new Map(),
      errors: []
    };
    
    // Known Solana addresses for classification
    this.KNOWN_ADDRESSES = {
      programs: new Set([
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',  // Token Program
        '11111111111111111111111111111111111111111112',  // System Program  
        'SysvarRent111111111111111111111111111111111',   // Rent Sysvar
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',  // Associated Token
        'ComputeBudget111111111111111111111111111111',   // Compute Budget
        '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'   // Raydium AMM V4
      ]),
      quoteTokens: new Map([
        ['So11111111111111111111111111111111111111112', 'SOL'],
        ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'],
        ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'USDT'],
        ['DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', 'BONK'],
        ['5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC', 'PEPE']
      ])
    };
    
    console.log('🔬 Renaissance Raydium Transaction Analyzer initialized');
    console.log(`📊 Target: ${this.captureConfig.maxTransactions} transactions in ${this.captureConfig.timeoutMinutes} minutes`);
  }

  /**
   * CAPTURE PHASE: Get live Raydium transactions from mainnet
   */
  async captureRaydiumTransactions() {
    console.log('🎯 PHASE 1: CAPTURING LIVE RAYDIUM TRANSACTIONS');
    console.log('📡 Scanning mainnet for recent Raydium AMM V4 transactions...');
    
    const startTime = Date.now();
    const timeoutMs = this.captureConfig.timeoutMinutes * 60 * 1000;
    
    try {
      // Get recent transactions for Raydium AMM V4 program
      const signatures = await this.connection.getSignaturesForAddress(
        new PublicKey(this.RAYDIUM_AMM_V4),
        {
          limit: 1000,
          commitment: 'confirmed'
        }
      );
      
      console.log(`📊 Found ${signatures.length} recent Raydium transactions`);
      
      // Process transactions in batches
      const batchSize = 10;
      for (let i = 0; i < signatures.length && this.capturedTransactions.length < this.captureConfig.maxTransactions; i += batchSize) {
        const batch = signatures.slice(i, i + batchSize);
        
        console.log(`🔍 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(signatures.length/batchSize)} (${this.capturedTransactions.length}/${this.captureConfig.maxTransactions} captured)`);
        
        const batchPromises = batch.map(sig => this.analyzeTransaction(sig.signature));
        const results = await Promise.allSettled(batchPromises);
        
        results.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value) {
            this.capturedTransactions.push(result.value);
          }
        });
        
        // Check timeout
        if (Date.now() - startTime > timeoutMs) {
          console.log(`⏱️ Timeout reached (${this.captureConfig.timeoutMinutes} minutes)`);
          break;
        }
        
        // Rate limiting to avoid overwhelming RPC
        await this.sleep(100);
      }
      
      console.log(`✅ CAPTURE COMPLETE: ${this.capturedTransactions.length} transactions captured`);
      return this.capturedTransactions;
      
    } catch (error) {
      console.error('❌ Capture failed:', error);
      this.analysisResults.errors.push({
        phase: 'capture',
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }

  /**
   * ANALYZE SINGLE TRANSACTION: Extract account structure and instruction data
   */
  async analyzeTransaction(signature) {
    try {
      const tx = await this.connection.getTransaction(signature, {
        encoding: 'json',
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });
      
      if (!tx || !tx.transaction) {
        return null;
      }
      
      // Find Raydium instructions
      const raydiumInstructions = [];
      
      // Handle different transaction versions
      let accountKeys;
      if (tx.transaction.message.staticAccountKeys) {
        // Version 0 transaction
        accountKeys = tx.transaction.message.staticAccountKeys;
      } else if (tx.transaction.message.accountKeys) {
        // Legacy transaction
        accountKeys = tx.transaction.message.accountKeys.map(key => 
          typeof key === 'string' ? key : key.pubkey
        );
      } else {
        console.log(`⚠️ Unable to extract account keys from transaction ${signature}`);
        return null;
      }
      
      // Handle different message structures
      const message = tx.transaction.message;
      
      // Get instructions (compiled or regular)
      const instructions = message.compiledInstructions || message.instructions;
      if (!instructions || instructions.length === 0) {
        console.log(`⚠️ No instructions found in transaction ${signature}`);
        return null;
      }
      
      instructions.forEach((instruction, index) => {
        const programIdIndex = instruction.programIdIndex;
        if (programIdIndex >= accountKeys.length) {
          return;
        }
        
        const programId = accountKeys[programIdIndex];
        
        if (programId === this.RAYDIUM_AMM_V4) {
          // Decode instruction data
          let dataBuffer;
          if (typeof instruction.data === 'string') {
            dataBuffer = Buffer.from(instruction.data, 'base64');
          } else if (Buffer.isBuffer(instruction.data)) {
            dataBuffer = instruction.data;
          } else if (Array.isArray(instruction.data)) {
            dataBuffer = Buffer.from(instruction.data);
          } else {
            console.log(`⚠️ Unknown data format in instruction ${index}`);
            return;
          }
          
          const discriminator = dataBuffer.length > 0 ? dataBuffer[0].toString(16).padStart(2, '0') : 'empty';
          
          // Get account indexes
          const accountIndexes = instruction.accountKeyIndexes || instruction.accounts || [];
          
          // Create a pseudo-instruction object for compatibility
          const compatInstruction = {
            accounts: accountIndexes,
            data: instruction.data,
            programIdIndex: programIdIndex
          };
          
          // Filter for LP creation instructions (not swaps)
          if (this.isLikelyLPCreation(compatInstruction, discriminator, accountKeys)) {
            raydiumInstructions.push({
              index,
              discriminator,
              dataLength: dataBuffer.length,
              data: instruction.data,
              accounts: accountIndexes,
              accountCount: accountIndexes.length,
              programId,
              signature // Add signature for tracking
            });
          }
        }
      });
      
      if (raydiumInstructions.length === 0) {
        return null;
      }
      
      const analysisData = {
        signature,
        slot: tx.slot,
        blockTime: tx.blockTime,
        accountKeys,
        accountCount: accountKeys.length,
        raydiumInstructions,
        timestamp: Date.now()
      };
      
      // Immediate pattern analysis
      raydiumInstructions.forEach(instruction => {
        this.recordDiscriminatorPattern(instruction.discriminator, instruction);
        this.analyzeAccountStructure(instruction, accountKeys);
      });
      
      return analysisData;
      
    } catch (error) {
      console.log(`⚠️ Failed to analyze transaction ${signature}: ${error.message}`);
      return null;
    }
  }

  /**
   * PATTERN DETECTION: Identify likely LP creation vs other operations
   */
  isLikelyLPCreation(instruction, discriminator, accountKeys) {
    // Account count heuristics
    const accountCount = instruction.accounts.length;
    if (accountCount < this.captureConfig.minAccountCount || accountCount > this.captureConfig.maxAccountCount) {
      return false;
    }
    
    // Known swap discriminators to exclude
    const swapDiscriminators = new Set(['09', '0a', '0b']);
    if (swapDiscriminators.has(discriminator)) {
      return false;
    }
    
    // Check for token program presence (required for LP creation)
    const hasTokenProgram = instruction.accounts.some(accountIndex => 
      accountKeys[accountIndex] === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    );
    
    if (!hasTokenProgram) {
      return false;
    }
    
    return true;
  }

  /**
   * DISCRIMINATOR PATTERN ANALYSIS
   */
  recordDiscriminatorPattern(discriminator, instruction) {
    if (!this.analysisResults.discriminators.has(discriminator)) {
      this.analysisResults.discriminators.set(discriminator, {
        count: 0,
        accountCounts: [],
        dataLengths: [],
        examples: []
      });
    }
    
    const pattern = this.analysisResults.discriminators.get(discriminator);
    pattern.count++;
    pattern.accountCounts.push(instruction.accountCount);
    pattern.dataLengths.push(instruction.dataLength);
    
    if (pattern.examples.length < 5) {
      pattern.examples.push({
        accounts: Array.isArray(instruction.accounts) ? instruction.accounts.slice() : [],
        dataLength: instruction.dataLength
      });
    }
    
    this.captureConfig.validDiscriminators.add(discriminator);
  }

  /**
   * ACCOUNT STRUCTURE ANALYSIS: Map account positions to token types
   */
  analyzeAccountStructure(instruction, accountKeys) {
    const { discriminator, accounts } = instruction;
    
    // Classify each account position
    const positionAnalysis = accounts.map((accountIndex, position) => {
      const address = accountKeys[accountIndex];
      
      return {
        position,
        accountIndex,
        address,
        type: this.classifyAddress(address),
        isUnique: this.countAddressOccurrences(address, accounts, accountKeys) === 1
      };
    });
    
    // Store pattern for this discriminator
    if (!this.analysisResults.accountPatterns.has(discriminator)) {
      this.analysisResults.accountPatterns.set(discriminator, []);
    }
    
    this.analysisResults.accountPatterns.get(discriminator).push({
      accounts: positionAnalysis,
      signature: instruction.signature
    });
    
    // Update token position mapping
    this.updateTokenPositionMapping(discriminator, positionAnalysis);
  }

  /**
   * ADDRESS CLASSIFICATION: Identify address types
   */
  classifyAddress(address) {
    if (this.KNOWN_ADDRESSES.programs.has(address)) {
      return 'program';
    }
    
    if (this.KNOWN_ADDRESSES.quoteTokens.has(address)) {
      return 'quote_token';
    }
    
    // Additional heuristics could be added here
    return 'unknown';
  }

  /**
   * COUNT ADDRESS OCCURRENCES: Detect pools (multiple refs) vs tokens (single ref)
   */
  countAddressOccurrences(targetAddress, accounts, accountKeys) {
    return accounts.filter(accountIndex => 
      accountKeys[accountIndex] === targetAddress
    ).length;
  }

  /**
   * TOKEN POSITION MAPPING: Track where tokens appear for each discriminator
   */
  updateTokenPositionMapping(discriminator, positionAnalysis) {
    if (!this.analysisResults.tokenPositions.has(discriminator)) {
      this.analysisResults.tokenPositions.set(discriminator, {
        quoteTokenPositions: new Set(),
        unknownTokenPositions: new Set(),
        programPositions: new Set(),
        multiRefPositions: new Set()
      });
    }
    
    const mapping = this.analysisResults.tokenPositions.get(discriminator);
    
    positionAnalysis.forEach(({ position, type, isUnique }) => {
      switch (type) {
        case 'quote_token':
          mapping.quoteTokenPositions.add(position);
          break;
        case 'unknown':
          mapping.unknownTokenPositions.add(position);
          break;
        case 'program':
          mapping.programPositions.add(position);
          break;
      }
      
      if (!isUnique) {
        mapping.multiRefPositions.add(position);
      }
    });
  }

  /**
   * ANALYSIS PHASE: Process captured data and extract patterns
   */
  async analyzePatterns() {
    console.log('🔬 PHASE 2: ANALYZING CAPTURED TRANSACTION PATTERNS');
    console.log(`📊 Processing ${this.capturedTransactions.length} transactions...`);
    
    const analysis = {
      discriminatorSummary: this.generateDiscriminatorSummary(),
      accountLayoutPatterns: this.generateAccountLayoutPatterns(),
      tokenExtractionRules: this.generateTokenExtractionRules(),
      validationFindings: this.generateValidationFindings()
    };
    
    console.log('✅ ANALYSIS COMPLETE');
    return analysis;
  }

  /**
   * DISCRIMINATOR SUMMARY: What discriminators exist and their characteristics
   */
  generateDiscriminatorSummary() {
    const summary = {};
    
    this.analysisResults.discriminators.forEach((data, discriminator) => {
      summary[discriminator] = {
        occurrences: data.count,
        avgAccountCount: data.accountCounts.reduce((a, b) => a + b, 0) / data.accountCounts.length,
        avgDataLength: data.dataLengths.reduce((a, b) => a + b, 0) / data.dataLengths.length,
        accountCountRange: [Math.min(...data.accountCounts), Math.max(...data.accountCounts)],
        dataLengthRange: [Math.min(...data.dataLengths), Math.max(...data.dataLengths)]
      };
    });
    
    return summary;
  }

  /**
   * ACCOUNT LAYOUT PATTERNS: Where tokens appear for each discriminator
   */
  generateAccountLayoutPatterns() {
    const patterns = {};
    
    this.analysisResults.tokenPositions.forEach((mapping, discriminator) => {
      patterns[discriminator] = {
        likelyQuoteTokenPositions: Array.from(mapping.quoteTokenPositions),
        likelyMemeTokenPositions: Array.from(mapping.unknownTokenPositions),
        programPositions: Array.from(mapping.programPositions),
        multiRefPositions: Array.from(mapping.multiRefPositions)
      };
    });
    
    return patterns;
  }

  /**
   * TOKEN EXTRACTION RULES: Generate dynamic extraction logic
   */
  generateTokenExtractionRules() {
    const rules = {};
    
    this.analysisResults.tokenPositions.forEach((mapping, discriminator) => {
      const quotePositions = Array.from(mapping.quoteTokenPositions);
      const unknownPositions = Array.from(mapping.unknownTokenPositions);
      const multiRefPositions = Array.from(mapping.multiRefPositions);
      
      rules[discriminator] = {
        primaryTokenStrategy: unknownPositions.length > 0 ? 'position_based' : 'heuristic',
        primaryTokenPositions: unknownPositions,
        secondaryTokenStrategy: quotePositions.length > 0 ? 'position_based' : 'heuristic',
        secondaryTokenPositions: quotePositions,
        poolStrategy: multiRefPositions.length > 0 ? 'multi_ref' : 'heuristic',
        poolPositions: multiRefPositions
      };
    });
    
    return rules;
  }

  /**
   * VALIDATION FINDINGS: Issues with current parser assumptions
   */
  generateValidationFindings() {
    const findings = {
      missingDiscriminators: [],
      incorrectAccountLayouts: [],
      recommendations: []
    };
    
    // Check missing discriminators
    const currentDiscriminators = new Set(['e7', 'e8', 'e9']);
    this.analysisResults.discriminators.forEach((data, discriminator) => {
      if (!currentDiscriminators.has(discriminator)) {
        findings.missingDiscriminators.push({
          discriminator,
          occurrences: data.count,
          impact: 'high'
        });
      }
    });
    
    // Check account layout assumptions
    const currentLayouts = {
      'e8': { coinMint: 7, pcMint: 8, ammId: 3 },
      'e7': { coinMint: 8, pcMint: 9, ammId: 4 }
    };
    
    Object.entries(currentLayouts).forEach(([discriminator, layout]) => {
      const actualPattern = this.analysisResults.tokenPositions.get(discriminator);
      if (actualPattern) {
        const hasQuoteAtExpected = actualPattern.quoteTokenPositions.has(layout.pcMint);
        const hasUnknownAtExpected = actualPattern.unknownTokenPositions.has(layout.coinMint);
        
        if (!hasQuoteAtExpected || !hasUnknownAtExpected) {
          findings.incorrectAccountLayouts.push({
            discriminator,
            expected: layout,
            actual: {
              quotePositions: Array.from(actualPattern.quoteTokenPositions),
              unknownPositions: Array.from(actualPattern.unknownTokenPositions)
            },
            impact: 'critical'
          });
        }
      }
    });
    
    // Generate recommendations
    findings.recommendations = [
      'Implement dynamic discriminator detection for all discovered variants',
      'Replace static account layouts with position-flexible extraction',
      'Add heuristic fallbacks for unknown account structures',
      'Implement address frequency analysis for pool identification'
    ];
    
    return findings;
  }

  /**
   * SAVE RESULTS: Export analysis for parser development
   */
  async saveAnalysis(analysis) {
    console.log('💾 SAVING ANALYSIS RESULTS');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = './analysis-output';
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
      
      // Save comprehensive analysis
      await fs.writeFile(
        path.join(outputDir, `raydium-analysis-${timestamp}.json`),
        JSON.stringify(analysis, null, 2)
      );
      
      // Save captured transaction data
      await fs.writeFile(
        path.join(outputDir, `raydium-transactions-${timestamp}.json`),
        JSON.stringify(this.capturedTransactions, null, 2)
      );
      
      // Save implementation code
      await this.generateParserCode(analysis, outputDir, timestamp);
      
      console.log(`✅ Analysis saved to ${outputDir}/`);
      console.log(`📊 Files: raydium-analysis-${timestamp}.json, raydium-transactions-${timestamp}.json`);
      
    } catch (error) {
      console.error('❌ Failed to save analysis:', error);
    }
  }

  /**
   * GENERATE PARSER CODE: Create new parser based on analysis
   */
  async generateParserCode(analysis, outputDir, timestamp) {
    const { discriminatorSummary, tokenExtractionRules } = analysis;
    
    const parserCode = `
/**
 * GENERATED RAYDIUM PARSER - Based on ${this.capturedTransactions.length} real transactions
 * Generated: ${new Date().toISOString()}
 * Discriminators analyzed: ${Object.keys(discriminatorSummary).join(', ')}
 */

class RaydiumParserGenerated {
  constructor() {
    // Discovered discriminators from live data
    this.DISCRIMINATOR_MAP = ${JSON.stringify(discriminatorSummary, null, 4)};
    
    // Token extraction rules from pattern analysis
    this.EXTRACTION_RULES = ${JSON.stringify(tokenExtractionRules, null, 4)};
  }

  // Implementation methods would go here...
  // [Generated based on actual patterns found]
}

module.exports = RaydiumParserGenerated;
`;
    
    await fs.writeFile(
      path.join(outputDir, `raydium-parser-generated-${timestamp}.js`),
      parserCode
    );
  }

  /**
   * UTILITY: Sleep function for rate limiting
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * PUBLIC API: Run complete analysis
   */
  async runCompleteAnalysis() {
    console.log('🚀 STARTING RAYDIUM TRANSACTION ANALYSIS');
    console.log('🎯 Goal: Understand real transaction patterns for robust parser');
    
    try {
      // Phase 1: Capture transactions
      await this.captureRaydiumTransactions();
      
      // Phase 2: Analyze patterns
      const analysis = await this.analyzePatterns();
      
      // Phase 3: Save results
      await this.saveAnalysis(analysis);
      
      // Phase 4: Print summary
      this.printSummary(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  /**
   * PRINT SUMMARY: Display key findings
   */
  printSummary(analysis) {
    console.log('\n🔬 ANALYSIS SUMMARY');
    console.log('==================');
    
    console.log('\n📊 DISCRIMINATORS FOUND:');
    Object.entries(analysis.discriminatorSummary).forEach(([disc, data]) => {
      console.log(`  0x${disc}: ${data.occurrences} transactions, avg ${data.avgAccountCount.toFixed(1)} accounts`);
    });
    
    console.log('\n🎯 CRITICAL FINDINGS:');
    analysis.validationFindings.missingDiscriminators.forEach(finding => {
      console.log(`  ❌ Missing discriminator 0x${finding.discriminator} (${finding.occurrences} transactions)`);
    });
    
    analysis.validationFindings.incorrectAccountLayouts.forEach(finding => {
      console.log(`  ❌ Incorrect layout for 0x${finding.discriminator}`);
      console.log(`     Expected quote at position ${finding.expected.pcMint}, found at: ${finding.actual.quotePositions}`);
    });
    
    console.log('\n✅ RECOMMENDATIONS:');
    analysis.validationFindings.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('  1. Review analysis files in ./analysis-output/');
    console.log('  2. Update parser with discovered patterns');
    console.log('  3. Test against captured transaction data');
    console.log('  4. Deploy robust parser to production');
  }
}

export default RaydiumTransactionAnalyzer;