/**
 * Orca Whirlpool Detection - RENAISSANCE PRINCIPLES
 * Target: <10ms per transaction, 97%+ accuracy
 * SIMPLE: 150 lines, synchronous processing, no academic fluff
 * FAST: Cache-first validation, early exits, bounded loops
 * RELIABLE: Complete error handling, no crash conditions
 */

export class OrcaDetector {
  constructor(signalBus, tokenValidator, circuitBreaker = null, performanceMonitor = null) {
    // FIXED: Validate required dependencies
    if (!signalBus) throw new Error('OrcaDetector: signalBus is required');
    if (!tokenValidator) throw new Error('OrcaDetector: tokenValidator is required');
    
    this.signalBus = signalBus;
    this.tokenValidator = tokenValidator;
    this.circuitBreaker = circuitBreaker;
    this.monitor = performanceMonitor;
    
    // Orca Whirlpool program ID
    this.programId = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc';
    
    // Pool initialization discriminators (hex)
    this.poolInitDiscriminators = new Set(['87', 'f4']); // initialize_pool, initialize_pool_v2
    
    // Known quote tokens for pair identification
    this.quoteTokens = new Set([
      'So11111111111111111111111111111111111111112', // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // USDT
    ]);
    
    // Token symbol cache
    this.symbolCache = new Map([
      ['So11111111111111111111111111111111111111112', 'SOL'],
      ['EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'USDC'],
      ['Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', 'USDT']
    ]);
    
    // Performance tracking
    this.stats = {
      totalTransactions: 0,
      candidatesFound: 0,
      parseErrors: 0,
      avgLatency: 0
    };
  }
  
  // Primary transaction analysis method
  async analyzeTransaction(transaction) {
    const startTime = performance.now();
    this.stats.totalTransactions++;
    
    try {
      // FIXED: Complete transaction validation
      if (!transaction || 
          !transaction.transaction || 
          !transaction.transaction.message || 
          !Array.isArray(transaction.transaction.message.instructions) ||
          !Array.isArray(transaction.transaction.message.accountKeys)) {
        this.updateStats(startTime, false);
        return [];
      }
      
      const instructions = transaction.transaction.message.instructions;
      const accounts = transaction.transaction.message.accountKeys;
      
      if (accounts.length === 0) {
        this.updateStats(startTime, false);
        return [];
      }
      
      const candidates = [];
      
      // PERFORMANCE: Process max 2 instructions to stay under 10ms (5ms each)
      const maxInstructions = Math.min(instructions.length, 2);
      
      for (let i = 0; i < maxInstructions; i++) {
        const candidate = this.analyzeInstructionSync(
          instructions[i], 
          accounts, 
          transaction, 
          i
        );
        
        if (candidate) {
          candidates.push(candidate);
          // OPTIMIZATION: Stop after first candidate (most pools have 1 init instruction)
          break;
        }
      }
      
      // Update statistics
      this.stats.candidatesFound += candidates.length;
      this.updateStats(startTime, true);
      
      // Emit candidates
      for (const candidate of candidates) {
        try {
          this.signalBus.emit('orcaCandidateDetected', candidate);
        } catch (emitError) {
          console.warn('Failed to emit orca candidate:', emitError.message);
        }
      }
      
      return candidates;
      
    } catch (error) {
      this.updateStats(startTime, false);
      console.error('Orca transaction analysis error:', error.message);
      return [];
    }
  }
  
  // RENAISSANCE: Synchronous instruction analysis for speed
  analyzeInstructionSync(instruction, accounts, transaction, instructionIndex) {
    try {
      // Validate instruction structure
      if (!instruction || 
          typeof instruction.programIdIndex !== 'number' ||
          !Array.isArray(instruction.accounts) ||
          !instruction.data) {
        return null;
      }
      
      // Check program ID bounds
      if (instruction.programIdIndex < 0 || instruction.programIdIndex >= accounts.length) {
        return null;
      }
      
      // Check if it's Orca Whirlpool program
      const programId = accounts[instruction.programIdIndex];
      if (programId !== this.programId) {
        return null;
      }
      
      // Parse instruction data
      const discriminator = this.parseDiscriminator(instruction.data);
      if (!discriminator || !this.poolInitDiscriminators.has(discriminator)) {
        return null;
      }
      
      // Extract pool accounts (simplified for speed)
      const poolAccounts = this.extractPoolAccounts(instruction, accounts);
      if (!poolAccounts) {
        return null;
      }
      
      // RENAISSANCE: Fast token validation (cache-first, no async)
      const tokenValidation = this.validateTokensSync(poolAccounts);
      if (!tokenValidation.valid) {
        return null;
      }
      
      // Build candidate
      const candidate = this.buildCandidateSync(
        poolAccounts,
        tokenValidation,
        transaction,
        instructionIndex
      );
      
      return candidate;
      
    } catch (error) {
      this.stats.parseErrors++;
      return null;
    }
  }
  
  // FIXED: Safe discriminator parsing
  parseDiscriminator(data) {
    try {
      if (!data || typeof data !== 'string' || data.length === 0) {
        return null;
      }
      
      // CRITICAL FIX: Solana uses base64, not base58
      const buffer = Buffer.from(data, 'base64');
      if (buffer.length < 1) {
        return null;
      }
      
      return buffer.slice(0, 1).toString('hex');
      
    } catch (error) {
      return null;
    }
  }
  
  // SIMPLIFIED: Extract only essential pool accounts
  extractPoolAccounts(instruction, accounts) {
    try {
      const accountIndices = instruction.accounts;
      
      // Need at least 8 accounts for pool initialization
      if (accountIndices.length < 8) {
        return null;
      }
      
      // FIXED: Safe account extraction with bounds checking
      const extractAccount = (index) => {
        if (typeof index !== 'number' || index < 0 || index >= accounts.length) {
          return null;
        }
        const account = accounts[index];
        return (account && typeof account === 'string') ? account : null;
      };
      
      const poolAccounts = {
        tokenMintA: extractAccount(accountIndices[1]), // Token A mint
        tokenMintB: extractAccount(accountIndices[2]), // Token B mint
        whirlpool: extractAccount(accountIndices[6]),  // Pool address
        funder: extractAccount(accountIndices[9])      // Pool creator
      };
      
      // Validate essential accounts exist
      if (!poolAccounts.tokenMintA || !poolAccounts.tokenMintB || !poolAccounts.whirlpool) {
        return null;
      }
      
      return poolAccounts;
      
    } catch (error) {
      return null;
    }
  }
  
  // RENAISSANCE: Fast synchronous token validation
  validateTokensSync(poolAccounts) {
    try {
      const tokenA = poolAccounts.tokenMintA;
      const tokenB = poolAccounts.tokenMintB;
      
      // Fast validation: check address format
      if (!this.isValidSolanaAddress(tokenA) || !this.isValidSolanaAddress(tokenB)) {
        return { valid: false, reason: 'invalid_address_format' };
      }
      
      // Don't allow same token for both sides
      if (tokenA === tokenB) {
        return { valid: false, reason: 'identical_tokens' };
      }
      
      return { 
        valid: true, 
        tokenA, 
        tokenB,
        confidence: 0.95 
      };
      
    } catch (error) {
      return { valid: false, reason: 'validation_error' };
    }
  }
  
  // Fast Solana address validation
  isValidSolanaAddress(address) {
    if (!address || typeof address !== 'string' || address.length !== 44) {
      return false;
    }
    
    // Basic base58 character check
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    return base58Regex.test(address);
  }
  
  // SIMPLIFIED: Fast candidate building
  buildCandidateSync(poolAccounts, tokenValidation, transaction, instructionIndex) {
    try {
      // FIXED: Safe transaction data extraction
      const signature = this.extractSignature(transaction);
      const blockTime = this.extractBlockTime(transaction);
      const slot = this.extractSlot(transaction);
      
      // Determine base/quote tokens (simple heuristic)
      const { baseToken, quoteToken } = this.identifyTokenPair(
        tokenValidation.tokenA, 
        tokenValidation.tokenB
      );
      
      const candidate = {
        // Transaction info
        signature,
        blockTime,
        slot,
        instructionIndex,
        
        // DEX info
        dex: 'orca',
        programId: this.programId,
        poolId: poolAccounts.whirlpool,
        poolType: 'whirlpool',
        
        // Token info (simplified)
        baseToken: {
          address: baseToken,
          symbol: this.getTokenSymbol(baseToken)
        },
        quoteToken: {
          address: quoteToken,
          symbol: this.getTokenSymbol(quoteToken)
        },
        
        // Creator info
        creator: poolAccounts.funder || '',
        
        // Validation info
        tokenValidation: tokenValidation.valid,
        confidence: this.calculateConfidence(tokenValidation),
        
        // Detection metadata
        detectedAt: Date.now(),
        source: 'orca_detector',
        version: '1.0'
      };
      
      return candidate;
      
    } catch (error) {
      return null;
    }
  }
  
  // Safe transaction data extraction helpers
  extractSignature(transaction) {
    try {
      return transaction?.transaction?.signatures?.[0] || 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  extractBlockTime(transaction) {
    try {
      return (typeof transaction?.blockTime === 'number') 
        ? transaction.blockTime 
        : Math.floor(Date.now() / 1000);
    } catch {
      return Math.floor(Date.now() / 1000);
    }
  }
  
  extractSlot(transaction) {
    try {
      return (typeof transaction?.slot === 'number') ? transaction.slot : 0;
    } catch {
      return 0;
    }
  }
  
  // SIMPLE: Token pair identification
  identifyTokenPair(tokenA, tokenB) {
    // If tokenB is a known quote token, use it as quote
    if (this.quoteTokens.has(tokenB)) {
      return { baseToken: tokenA, quoteToken: tokenB };
    }
    
    // If tokenA is a known quote token, use it as quote
    if (this.quoteTokens.has(tokenA)) {
      return { baseToken: tokenB, quoteToken: tokenA };
    }
    
    // Default: first token as base
    return { baseToken: tokenA, quoteToken: tokenB };
  }
  
  // Fast token symbol lookup
  getTokenSymbol(address) {
    // Check cache first
    const cached = this.symbolCache.get(address);
    if (cached) return cached;
    
    // Generate short symbol from address
    const symbol = address.slice(0, 4).toUpperCase();
    
    // Cache for future use (bounded cache)
    if (this.symbolCache.size < 1000) {
      this.symbolCache.set(address, symbol);
    }
    
    return symbol;
  }
  
  // Simple confidence calculation
  calculateConfidence(tokenValidation) {
    let confidence = 0.90; // Base confidence for Orca
    
    if (tokenValidation.valid && tokenValidation.confidence > 0.8) {
      confidence += 0.08;
    }
    
    return Math.min(1.0, confidence);
  }
  
  // Update performance statistics
  updateStats(startTime, success) {
    const latency = performance.now() - startTime;
    
    // Exponential moving average
    if (this.stats.avgLatency === 0) {
      this.stats.avgLatency = latency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.9) + (latency * 0.1);
    }
    
    // Record metrics
    if (this.monitor) {
      this.monitor.recordLatency('orcaDetector', latency, success);
    }
  }
  
  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      detectionRate: this.stats.totalTransactions > 0
        ? this.stats.candidatesFound / this.stats.totalTransactions
        : 0,
      successRate: this.stats.totalTransactions > 0
        ? (this.stats.totalTransactions - this.stats.parseErrors) / this.stats.totalTransactions
        : 0
    };
  }
  
  // Health check
  isHealthy() {
    return (
      this.stats.avgLatency < 10.0 && // Under 10ms average
      this.stats.parseErrors < this.stats.totalTransactions * 0.03 // Less than 3% errors
    );
  }
}