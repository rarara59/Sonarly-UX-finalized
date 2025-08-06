/**
 * Binary Data Extraction and Instruction Parser
 * Target: <5ms per instruction, comprehensive data extraction
 * 220 lines - High-performance binary instruction parsing
 */

export class InstructionParser {
  constructor(performanceMonitor = null) {
    this.monitor = performanceMonitor;
    
    // Known program IDs for optimized parsing
    this.programParsers = {
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'raydium',  // Raydium AMM
      '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P': 'pumpfun',   // Pump.fun
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'orca',      // Orca Whirlpools
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'spl_token', // SPL Token
      '11111111111111111111111111111111': 'system'                 // System Program
    };
    
    // Instruction discriminator mappings
    this.discriminators = {
      raydium: {
        '01': 'initialize',
        'e7': 'initialize2', 
        'e8': 'initialize3',
        'e9': 'initialize_with_config',
        '09': 'swap_base_in',
        '0b': 'swap_base_out'
      },
      pumpfun: {
        '18': 'create',
        '33': 'buy',
        '34': 'sell',
        'b1': 'create_and_buy'
      },
      orca: {
        '87': 'initialize_pool',
        'f4': 'initialize_pool_v2',
        '2e': 'open_position',
        '46': 'increase_liquidity',
        'a7': 'decrease_liquidity'
      }
    };
    
    // Performance tracking
    this.stats = {
      totalInstructions: 0,
      successfulParses: 0,
      parseErrors: 0,
      avgLatency: 0,
      parserBreakdown: {
        raydium: { count: 0, avgLatency: 0 },
        pumpfun: { count: 0, avgLatency: 0 },
        orca: { count: 0, avgLatency: 0 },
        spl_token: { count: 0, avgLatency: 0 },
        unknown: { count: 0, avgLatency: 0 }
      }
    };
  }
  
  // Primary method: Parse instruction with binary data extraction
  parseInstruction(instruction, accounts, transactionContext = {}) {
    const startTime = performance.now();
    this.stats.totalInstructions++;
    
    try {
      // Get program ID
      const programId = accounts[instruction.programIdIndex];
      const parserType = this.programParsers[programId] || 'unknown';
      
      // Parse instruction data
      const instructionData = this.parseInstructionData(instruction.data);
      if (!instructionData) {
        throw new Error('Failed to parse instruction data');
      }
      
      // Extract accounts
      const instructionAccounts = this.extractInstructionAccounts(instruction, accounts);
      
      // Program-specific parsing
      const parsedData = this.parseByProgram(
        parserType,
        instructionData,
        instructionAccounts,
        transactionContext
      );
      
      // Build comprehensive instruction object
      const result = {
        programId,
        parserType,
        discriminator: instructionData.discriminator,
        instructionType: parsedData.instructionType,
        accounts: instructionAccounts,
        data: parsedData,
        raw: {
          data: instruction.data,
          accounts: instruction.accounts,
          programIdIndex: instruction.programIdIndex
        },
        parsing: {
          success: true,
          latency: performance.now() - startTime,
          parser: parserType
        }
      };
      
      this.recordSuccess(startTime, parserType);
      return result;
      
    } catch (error) {
      this.recordError(startTime, error);
      return {
        programId: accounts[instruction.programIdIndex] || 'unknown',
        parserType: 'error',
        error: error.message,
        raw: {
          data: instruction.data,
          accounts: instruction.accounts,
          programIdIndex: instruction.programIdIndex
        },
        parsing: {
          success: false,
          latency: performance.now() - startTime,
          parser: 'error'
        }
      };
    }
  }
  
  // Parse instruction data buffer
  parseInstructionData(data) {
    try {
      if (!data || data.length === 0) {
        return null;
      }
      
      // Convert base64 data to buffer
      const buffer = Buffer.from(data, 'base64');
      if (buffer.length < 1) {
        return null;
      }
      
      // Extract discriminator
      const discriminator = buffer.slice(0, 1).toString('hex');
      const fullDiscriminator = buffer.slice(0, 8).toString('hex');
      
      return {
        discriminator,
        fullDiscriminator,
        buffer,
        length: buffer.length,
        hex: buffer.toString('hex')
      };
      
    } catch (error) {
      return null;
    }
  }
  
  // Extract instruction accounts with metadata
  extractInstructionAccounts(instruction, allAccounts) {
    const accounts = [];
    
    if (!instruction.accounts || !Array.isArray(instruction.accounts)) {
      return accounts;
    }
    
    instruction.accounts.forEach((accountIndex, position) => {
      accounts.push({
        position,
        index: accountIndex,
        address: allAccounts[accountIndex] || null,
        isSigner: false, // Would need to check transaction signers
        isWritable: false // Would need to check account meta
      });
    });
    
    return accounts;
  }
  
  // Program-specific parsing dispatch
  parseByProgram(parserType, instructionData, accounts, context) {
    switch (parserType) {
      case 'raydium':
        return this.parseRaydiumInstruction(instructionData, accounts, context);
      case 'pumpfun':
        return this.parsePumpfunInstruction(instructionData, accounts, context);
      case 'orca':
        return this.parseOrcaInstruction(instructionData, accounts, context);
      case 'spl_token':
        return this.parseSPLTokenInstruction(instructionData, accounts, context);
      default:
        return this.parseUnknownInstruction(instructionData, accounts, context);
    }
  }
  
  // Parse Raydium-specific instructions
  parseRaydiumInstruction(instructionData, accounts, context) {
    const discriminator = instructionData.discriminator;
    const instructionType = this.discriminators.raydium[discriminator] || 'unknown';
    
    const parsed = {
      instructionType,
      discriminator,
      program: 'raydium'
    };
    
    switch (instructionType) {
      case 'initialize2':
      case 'initialize3':
        parsed.poolCreation = this.parseRaydiumPoolCreation(instructionData, accounts);
        break;
      case 'swap_base_in':
      case 'swap_base_out':
        parsed.swap = this.parseRaydiumSwap(instructionData, accounts);
        break;
      default:
        parsed.rawData = instructionData.hex;
    }
    
    return parsed;
  }
  
  // Parse Pump.fun-specific instructions
  parsePumpfunInstruction(instructionData, accounts, context) {
    const discriminator = instructionData.discriminator;
    const instructionType = this.discriminators.pumpfun[discriminator] || 'unknown';
    
    const parsed = {
      instructionType,
      discriminator,
      program: 'pumpfun'
    };
    
    switch (instructionType) {
      case 'create':
      case 'create_and_buy':
        parsed.tokenCreation = this.parsePumpfunTokenCreation(instructionData, accounts);
        break;
      case 'buy':
      case 'sell':
        parsed.trade = this.parsePumpfunTrade(instructionData, accounts);
        break;
      default:
        parsed.rawData = instructionData.hex;
    }
    
    return parsed;
  }
  
  // Parse Orca-specific instructions
  parseOrcaInstruction(instructionData, accounts, context) {
    const discriminator = instructionData.discriminator;
    const instructionType = this.discriminators.orca[discriminator] || 'unknown';
    
    const parsed = {
      instructionType,
      discriminator,
      program: 'orca'
    };
    
    switch (instructionType) {
      case 'initialize_pool':
      case 'initialize_pool_v2':
        parsed.poolCreation = this.parseOrcaPoolCreation(instructionData, accounts);
        break;
      case 'open_position':
        parsed.position = this.parseOrcaPositionOpen(instructionData, accounts);
        break;
      default:
        parsed.rawData = instructionData.hex;
    }
    
    return parsed;
  }
  
  // Parse SPL Token instructions
  parseSPLTokenInstruction(instructionData, accounts, context) {
    return {
      instructionType: 'spl_token_operation',
      discriminator: instructionData.discriminator,
      program: 'spl_token',
      rawData: instructionData.hex
    };
  }
  
  // Parse unknown program instructions
  parseUnknownInstruction(instructionData, accounts, context) {
    return {
      instructionType: 'unknown',
      discriminator: instructionData.discriminator,
      program: 'unknown',
      rawData: instructionData.hex,
      accountCount: accounts.length
    };
  }
  
  // Parse Raydium pool creation data
  parseRaydiumPoolCreation(instructionData, accounts) {
    // Simplified parsing - would be more detailed in production
    return {
      type: 'pool_creation',
      ammId: accounts[3]?.address || null,
      coinMint: accounts[7]?.address || null,
      pcMint: accounts[8]?.address || null,
      lpMint: accounts[6]?.address || null,
      dataLength: instructionData.length
    };
  }
  
  // Parse Raydium swap data
  parseRaydiumSwap(instructionData, accounts) {
    const buffer = instructionData.buffer;
    
    try {
      // Parse swap amounts (simplified)
      const amountIn = buffer.length >= 16 ? buffer.readBigUInt64LE(8) : 0n;
      const minAmountOut = buffer.length >= 24 ? buffer.readBigUInt64LE(16) : 0n;
      
      return {
        type: 'swap',
        amountIn: amountIn.toString(),
        minAmountOut: minAmountOut.toString(),
        userWallet: accounts[16]?.address || null
      };
    } catch (error) {
      return { type: 'swap', parseError: error.message };
    }
  }
  
  // Parse Pump.fun token creation data
  parsePumpfunTokenCreation(instructionData, accounts) {
    return {
      type: 'token_creation',
      mint: accounts[0]?.address || null,
      bondingCurve: accounts[2]?.address || null,
      creator: accounts[7]?.address || null,
      dataLength: instructionData.length
    };
  }
  
  // Parse Pump.fun trade data
  parsePumpfunTrade(instructionData, accounts) {
    const buffer = instructionData.buffer;
    
    try {
      // Parse trade amounts (simplified)
      const amount = buffer.length >= 16 ? buffer.readBigUInt64LE(8) : 0n;
      
      return {
        type: 'trade',
        amount: amount.toString(),
        trader: accounts[4]?.address || null
      };
    } catch (error) {
      return { type: 'trade', parseError: error.message };
    }
  }
  
  // Parse Orca pool creation data
  parseOrcaPoolCreation(instructionData, accounts) {
    return {
      type: 'pool_creation',
      whirlpool: accounts[6]?.address || null,
      tokenMintA: accounts[1]?.address || null,
      tokenMintB: accounts[2]?.address || null,
      funder: accounts[9]?.address || null,
      dataLength: instructionData.length
    };
  }
  
  // Parse Orca position opening data
  parseOrcaPositionOpen(instructionData, accounts) {
    return {
      type: 'position_open',
      position: accounts[3]?.address || null,
      whirlpool: accounts[2]?.address || null,
      owner: accounts[5]?.address || null,
      dataLength: instructionData.length
    };
  }
  
  // Record successful parse
  recordSuccess(startTime, parserType) {
    const latency = performance.now() - startTime;
    this.stats.successfulParses++;
    this.updateLatencyStats(latency, parserType);
    
    if (this.monitor) {
      this.monitor.recordLatency('instructionParser', latency, true);
    }
  }
  
  // Record parse error
  recordError(startTime, error) {
    const latency = performance.now() - startTime;
    this.stats.parseErrors++;
    this.updateLatencyStats(latency, 'error');
    
    if (this.monitor) {
      this.monitor.recordLatency('instructionParser', latency, false);
    }
    
    console.warn('Instruction parsing error:', error.message);
  }
  
  // Update latency statistics
  updateLatencyStats(latency, parserType) {
    // Update overall average
    if (this.stats.avgLatency === 0) {
      this.stats.avgLatency = latency;
    } else {
      this.stats.avgLatency = (this.stats.avgLatency * 0.9) + (latency * 0.1);
    }
    
    // Update parser-specific stats
    const parserStats = this.stats.parserBreakdown[parserType];
    if (parserStats) {
      parserStats.count++;
      if (parserStats.avgLatency === 0) {
        parserStats.avgLatency = latency;
      } else {
        parserStats.avgLatency = (parserStats.avgLatency * 0.9) + (latency * 0.1);
      }
    }
  }
  
  // Batch parse multiple instructions
  parseInstructions(instructions, accounts, transactionContext = {}) {
    return instructions.map((instruction, index) => 
      this.parseInstruction(instruction, accounts, { ...transactionContext, index })
    );
  }
  
  // Get current statistics
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalInstructions > 0 
        ? this.stats.successfulParses / this.stats.totalInstructions 
        : 0
    };
  }
  
  // Health check
  isHealthy() {
    return (
      this.stats.avgLatency < 5.0 && // Under 5ms average
      this.stats.successRate > 0.95 && // Over 95% success rate
      this.stats.parseErrors < this.stats.totalInstructions * 0.05 // Less than 5% errors
    );
  }
}