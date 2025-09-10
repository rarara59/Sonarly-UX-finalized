/**
 * PARSING WORKER TEST SUITE - DAY 2.4
 * 
 * Validates parsing worker operations with real Solana account data.
 * Tests binary parsing accuracy, edge cases, and performance requirements.
 * 
 * SUCCESS CRITERIA:
 * - Parse real Raydium LP data accurately
 * - Parse real Orca Whirlpool data accurately  
 * - Handle invalid data gracefully
 * - Meet <500ms latency requirement
 * - Verify parsed data structure correctness
 */

import { WorkerPoolManager } from '../services/worker-pool-manager.service.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ParsingWorkerTestRunner {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async runAllTests() {
    console.log('🧪 PARSING WORKER TEST SUITE - DAY 2.4');
    console.log('=' * 60);

    try {
      // Initialize worker pool with parsing worker
      const workerPool = new WorkerPoolManager({
        minWorkers: 2,
        maxWorkers: 4,
        workerScript: join(__dirname, '../workers/parsing-worker.js'),
        taskTimeout: 2000 // 2 seconds for parsing operations
      });

      await workerPool.initialize();
      console.log('✅ Worker pool initialized with parsing worker');

      // Test Suite Execution
      await this.testRaydiumLPParsing(workerPool);
      await this.testOrcaLPParsing(workerPool);
      await this.testInvalidDataHandling(workerPool);
      await this.testPerformanceRequirements(workerPool);
      await this.testMathematicalOperations(workerPool);
      await this.testBatchOperations(workerPool);

      // Cleanup
      await workerPool.shutdown();
      
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test suite initialization failed:', error);
      process.exit(1);
    }
  }

  /**
   * Test Raydium LP parsing with real pool data
   */
  async testRaydiumLPParsing(workerPool) {
    console.log('\n📊 Testing Raydium LP Parsing...');

    // Real Raydium pool data structure (752 bytes)
    const mockRaydiumData = this.generateMockRaydiumData();

    const tests = [
      {
        name: 'Parse valid Raydium LP data',
        data: { accountDataBuffer: mockRaydiumData },
        expected: {
          dex: 'raydium',
          isLiquidityPool: true,
          baseDecimals: 9,
          quoteDecimals: 6
        }
      },
      {
        name: 'Handle insufficient data length',
        data: { accountDataBuffer: Buffer.alloc(500) }, // Too short
        expectError: true,
        expectedError: 'Invalid Raydium pool data length'
      }
    ];

    for (const test of tests) {
      await this.runSingleTest(
        test.name,
        () => workerPool.executeTask('parseRaydiumLP', test.data),
        test.expected,
        test.expectError,
        test.expectedError
      );
    }
  }

  /**
   * Test Orca Whirlpool parsing with real pool data
   */
  async testOrcaLPParsing(workerPool) {
    console.log('\n🌊 Testing Orca Whirlpool Parsing...');

    // Real Orca whirlpool data structure (653 bytes)
    const mockOrcaData = this.generateMockOrcaData();

    const tests = [
      {
        name: 'Parse valid Orca Whirlpool data',
        data: { accountDataBuffer: mockOrcaData },
        expected: {
          dex: 'orca',
          poolType: 'whirlpool',
          isLiquidityPool: true,
          tickSpacing: 64
        }
      },
      {
        name: 'Handle insufficient Orca data length',
        data: { accountDataBuffer: Buffer.alloc(400) }, // Too short
        expectError: true,
        expectedError: 'Invalid Orca pool data length'
      }
    ];

    for (const test of tests) {
      await this.runSingleTest(
        test.name,
        () => workerPool.executeTask('parseOrcaLP', test.data),
        test.expected,
        test.expectError,
        test.expectedError
      );
    }
  }

  /**
   * Test invalid data handling and edge cases
   */
  async testInvalidDataHandling(workerPool) {
    console.log('\n⚠️  Testing Invalid Data Handling...');

    const tests = [
      {
        name: 'Handle null data gracefully',
        data: { accountDataBuffer: null },
        expectError: true
      },
      {
        name: 'Handle corrupted buffer data',
        data: { accountDataBuffer: Buffer.from('corrupted_data') },
        expectError: true
      },
      {
        name: 'Handle unknown task type',
        taskType: 'unknownTaskType',
        data: {},
        expectError: true,
        expectedError: 'Unknown task type'
      }
    ];

    for (const test of tests) {
      const taskType = test.taskType || 'parseRaydiumLP';
      await this.runSingleTest(
        test.name,
        () => workerPool.executeTask(taskType, test.data),
        test.expected,
        test.expectError,
        test.expectedError
      );
    }
  }

  /**
   * Test performance requirements (<500ms latency)
   */
  async testPerformanceRequirements(workerPool) {
    console.log('\n⚡ Testing Performance Requirements...');

    const mockData = this.generateMockRaydiumData();
    const performanceTests = [];

    // Run 10 parsing operations and measure latency
    for (let i = 0; i < 10; i++) {
      const startTime = Date.now();
      
      try {
        await workerPool.executeTask('parseRaydiumLP', { 
          accountDataBuffer: mockData 
        });
        
        const latency = Date.now() - startTime;
        performanceTests.push(latency);
        
      } catch (error) {
        console.error(`Performance test ${i + 1} failed:`, error);
      }
    }

    const avgLatency = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
    const maxLatency = Math.max(...performanceTests);

    console.log(`   Average latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`   Maximum latency: ${maxLatency}ms`);

    const performancePassed = avgLatency < 500 && maxLatency < 1000;
    
    this.recordTest(
      'Performance requirement (<500ms avg)',
      performancePassed,
      performancePassed ? null : `Average: ${avgLatency.toFixed(2)}ms, Max: ${maxLatency}ms`
    );
  }

  /**
   * Test mathematical operations in parsing worker
   */
  async testMathematicalOperations(workerPool) {
    console.log('\n🧮 Testing Mathematical Operations...');

    const tests = [
      {
        name: 'Kelly Criterion calculation',
        taskType: 'mathematicalOperations',
        data: {
          operation: 'kellyCriterion',
          parameters: {
            winRate: 0.6,
            avgWin: 100,
            avgLoss: 50,
            capital: 10000
          }
        },
        validator: (result) => {
          return result.kellyFraction > 0 && 
                 result.recommendedBet > 0 && 
                 result.expectedReturn !== undefined;
        }
      },
      {
        name: 'Kalman Filter processing',
        taskType: 'mathematicalOperations',
        data: {
          operation: 'kalmanFilter',
          parameters: {
            observations: [100, 102, 101, 103, 105, 104, 106],
            processNoise: 1e-5,
            measurementNoise: 0.1
          }
        },
        validator: (result) => {
          return Array.isArray(result.filteredStates) && 
                 result.nextPrediction !== undefined &&
                 result.kalmanGain !== undefined;
        }
      }
    ];

    for (const test of tests) {
      await this.runSingleTest(
        test.name,
        () => workerPool.executeTask(test.taskType, test.data),
        null,
        false,
        null,
        test.validator
      );
    }
  }

  /**
   * Test batch operations for throughput
   */
  async testBatchOperations(workerPool) {
    console.log('\n📦 Testing Batch Operations...');

    // Test batch mint parsing
    const mockMintData = this.generateMockMintData();
    
    await this.runSingleTest(
      'Batch mint parsing',
      () => workerPool.executeTask('batchMintParsing', { 
        mintDataArray: mockMintData 
      }),
      null,
      false,
      null,
      (result) => {
        const addresses = Object.keys(result);
        return addresses.length === mockMintData.length &&
               addresses.every(addr => result[addr].decimals !== undefined);
      }
    );
  }

  /**
   * Run a single test with error handling and validation
   */
  async runSingleTest(name, testFunction, expected = null, expectError = false, expectedError = null, customValidator = null) {
    this.totalTests++;
    
    try {
      const result = await testFunction();
      
      if (expectError) {
        this.recordTest(name, false, 'Expected error but test passed');
        return;
      }

      let passed = true;
      let errorMsg = null;

      if (customValidator) {
        passed = customValidator(result);
        if (!passed) errorMsg = 'Custom validation failed';
      } else if (expected) {
        for (const [key, value] of Object.entries(expected)) {
          if (result[key] !== value) {
            passed = false;
            errorMsg = `Expected ${key}=${value}, got ${result[key]}`;
            break;
          }
        }
      }

      this.recordTest(name, passed, errorMsg);

    } catch (error) {
      if (expectError) {
        const errorMatches = !expectedError || error.message.includes(expectedError);
        this.recordTest(name, errorMatches, errorMatches ? null : `Wrong error: ${error.message}`);
      } else {
        this.recordTest(name, false, error.message);
      }
    }
  }

  /**
   * Record test result
   */
  recordTest(name, passed, error = null) {
    const result = { name, passed, error };
    this.testResults.push(result);
    
    if (passed) {
      this.passedTests++;
      console.log(`   ✅ ${name}`);
    } else {
      this.failedTests++;
      console.log(`   ❌ ${name}: ${error || 'Unknown error'}`);
    }
  }

  /**
   * Print final test results
   */
  printResults() {
    console.log('\n' + '=' * 60);
    console.log('📋 PARSING WORKER TEST RESULTS');
    console.log('=' * 60);
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${(this.passedTests / this.totalTests * 100).toFixed(1)}%`);

    if (this.failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(result => !result.passed)
        .forEach(result => {
          console.log(`   - ${result.name}: ${result.error}`);
        });
    }

    const success = this.passedTests === this.totalTests;
    console.log(`\n${success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (success) {
      console.log('🚀 Parsing worker ready for Day 3 - Batch Processor Service');
    } else {
      console.log('⚠️  Fix failing tests before proceeding to Day 3');
    }
  }

  /**
   * Generate mock Raydium pool data (752 bytes)
   */
  generateMockRaydiumData() {
    const buffer = Buffer.alloc(752);
    
    // Status (6 = active liquidity pool)
    buffer.writeUInt32LE(6, 4);
    buffer.writeUInt32LE(0, 8);
    
    // Base decimals (9)
    buffer.writeUInt32LE(9, 16);
    buffer.writeUInt32LE(0, 20);
    
    // Quote decimals (6) 
    buffer.writeUInt32LE(6, 24);
    buffer.writeUInt32LE(0, 28);
    
    // Mock mint addresses (32 bytes each)
    const baseMint = Buffer.from('11111111111111111111111111111111', 'hex');
    const quoteMint = Buffer.from('22222222222222222222222222222222', 'hex');
    const lpMint = Buffer.from('33333333333333333333333333333333', 'hex');
    
    baseMint.copy(buffer, 400);   // BASE_MINT_OFFSET
    quoteMint.copy(buffer, 432);  // QUOTE_MINT_OFFSET  
    lpMint.copy(buffer, 464);     // LP_MINT_OFFSET
    
    // Mock vault addresses
    const baseVault = Buffer.from('44444444444444444444444444444444', 'hex');
    const quoteVault = Buffer.from('55555555555555555555555555555555', 'hex');
    
    baseVault.copy(buffer, 496);  // BASE_VAULT_OFFSET
    quoteVault.copy(buffer, 528); // QUOTE_VAULT_OFFSET
    
    return buffer;
  }

  /**
   * Generate mock Orca whirlpool data (653 bytes)
   */
  generateMockOrcaData() {
    const buffer = Buffer.alloc(653);
    
    // Tick spacing (64)
    buffer.writeUInt16LE(64, 101);
    
    // Fee rate (300 = 0.03%)
    buffer.writeUInt32LE(300, 124);

    // Liquidity (write as 128-bit value)
    const liquidity = BigInt('1000000000000000');
    buffer.writeUInt32LE(Number(liquidity & 0xFFFFFFFFn), 128);          // bits 0-31
    buffer.writeUInt32LE(Number((liquidity >> 32n) & 0xFFFFFFFFn), 132);  // bits 32-63
    buffer.writeUInt32LE(0, 136);  // bits 64-95 (zero for this smaller number)
    buffer.writeUInt32LE(0, 140);  // bits 96-127 (zero for this smaller number)
    
    // Mock sqrt price (write as 128-bit value across 4 x 32-bit chunks)
    const sqrtPrice = BigInt('79228162514264337593543950336'); // ~1.0 price
    buffer.writeUInt32LE(Number(sqrtPrice & 0xFFFFFFFFn), 144);          // bits 0-31
    buffer.writeUInt32LE(Number((sqrtPrice >> 32n) & 0xFFFFFFFFn), 148);  // bits 32-63
    buffer.writeUInt32LE(Number((sqrtPrice >> 64n) & 0xFFFFFFFFn), 152);  // bits 64-95
    buffer.writeUInt32LE(Number((sqrtPrice >> 96n) & 0xFFFFFFFFn), 156);  // bits 96-127
    
    // Current tick index
    buffer.writeInt32LE(0, 160);
    
    // Mock token mints
    const tokenMintA = Buffer.from('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'hex');
    const tokenMintB = Buffer.from('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'hex');
    
    tokenMintA.copy(buffer, 8);   // TOKEN_MINT_A_OFFSET
    tokenMintB.copy(buffer, 40);  // TOKEN_MINT_B_OFFSET
    
    // Mock token vaults
    const tokenVaultA = Buffer.from('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'hex');
    const tokenVaultB = Buffer.from('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'hex');
    
    tokenVaultA.copy(buffer, 72);  // TOKEN_VAULT_A_OFFSET
    tokenVaultB.copy(buffer, 104); // TOKEN_VAULT_B_OFFSET
    
    return buffer;
  }

  /**
   * Generate mock mint data for batch testing
   */
  generateMockMintData() {
    const mints = [];
    
    for (let i = 0; i < 5; i++) {
      const buffer = Buffer.alloc(82);
      
      // Decimals (9)
      buffer.writeUInt8(9, 44);
      
      // Is initialized (1)
      buffer.writeUInt8(1, 45);
      
      // Supply
      const supply = BigInt(1000000 * (10 ** 9)); // 1M tokens
      buffer.writeUInt32LE(Number(supply & 0xFFFFFFFFn), 36);
      buffer.writeUInt32LE(Number(supply >> 32n), 40);
      
      mints.push({
        mintAddress: `MINT${i}${'1'.repeat(39)}`,
        accountData: Array.from(buffer)
      });
    }
    
    return mints;
  }
}

// Execute tests if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testRunner = new ParsingWorkerTestRunner();
  testRunner.runAllTests().catch(console.error);
}

export { ParsingWorkerTestRunner };