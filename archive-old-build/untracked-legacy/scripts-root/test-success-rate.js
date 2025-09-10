#!/usr/bin/env node

/**
 * RPC Success Rate Tester
 * Validates that optimizations achieve 95%+ success rate
 */

import { RpcConnectionPoolV2 } from '../src/detection/transport/rpc-connection-pool.js';
import dotenv from 'dotenv';

dotenv.config();

class SuccessRateTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      timeouts: 0,
      connectionErrors: 0,
      otherErrors: 0,
      latencies: [],
      errorTypes: new Map(),
      endpointStats: new Map()
    };
    
    this.testConfig = {
      totalRequests: 1000,
      concurrentRequests: 20,
      testDuration: 60000, // 1 minute
      methods: [
        'getAccountInfo',
        'getBalance',
        'getLatestBlockhash',
        'getSlot',
        'getBlockHeight'
      ]
    };
  }

  async run() {
    console.log('🎯 RPC Success Rate Tester');
    console.log('=' .repeat(60));
    console.log('Testing optimized configuration for 95%+ success rate\n');
    
    console.log('📋 Test Configuration:');
    console.log(`  Total requests: ${this.testConfig.totalRequests}`);
    console.log(`  Concurrent requests: ${this.testConfig.concurrentRequests}`);
    console.log(`  Test methods: ${this.testConfig.methods.join(', ')}\n`);
    
    // Initialize RPC pool with optimized configuration
    const pool = new RpcConnectionPoolV2({
      endpoints: [
        process.env.CHAINSTACK_RPC_URL,
        process.env.HELIUS_RPC_URL,
        process.env.PUBLIC_RPC_URL
      ].filter(Boolean)
    });
    
    if (pool.endpoints.length === 0) {
      console.log('❌ No RPC endpoints configured in .env file');
      console.log('   Please set CHAINSTACK_RPC_URL, HELIUS_RPC_URL, or PUBLIC_RPC_URL');
      return;
    }
    
    console.log('🌐 Configured Endpoints:');
    pool.endpoints.forEach(ep => {
      console.log(`  - ${ep.type}: ${ep.config.maxConcurrent} concurrent, ${ep.config.timeout}ms timeout`);
    });
    console.log('');
    
    // Run the test
    await this.runLoadTest(pool);
    
    // Display results
    this.displayResults();
    
    // Cleanup
    pool.destroy();
  }

  async runLoadTest(pool) {
    console.log('🚀 Starting load test...\n');
    
    const startTime = Date.now();
    const requests = [];
    let completedRequests = 0;
    
    // Generate test addresses
    const testAddresses = [
      'So11111111111111111111111111111111111111112', // Wrapped SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So'    // mSOL
    ];
    
    // Create batch of requests
    for (let i = 0; i < this.testConfig.totalRequests; i++) {
      const method = this.testConfig.methods[i % this.testConfig.methods.length];
      const address = testAddresses[i % testAddresses.length];
      
      // Build request based on method
      let rpcMethod, params;
      switch (method) {
        case 'getAccountInfo':
          rpcMethod = 'getAccountInfo';
          params = [address, { encoding: 'base64' }];
          break;
        case 'getBalance':
          rpcMethod = 'getBalance';
          params = [address];
          break;
        case 'getLatestBlockhash':
          rpcMethod = 'getLatestBlockhash';
          params = [];
          break;
        case 'getSlot':
          rpcMethod = 'getSlot';
          params = [];
          break;
        case 'getBlockHeight':
          rpcMethod = 'getBlockHeight';
          params = [];
          break;
      }
      
      // Schedule request with concurrency control
      const delay = Math.floor(i / this.testConfig.concurrentRequests) * 100;
      
      const requestPromise = new Promise(async (resolve) => {
        await this.sleep(delay);
        
        const requestStart = Date.now();
        try {
          const result = await pool.request(rpcMethod, params);
          const latency = Date.now() - requestStart;
          
          this.results.successfulRequests++;
          this.results.latencies.push(latency);
          
          // Track endpoint stats
          const endpoint = result._endpoint || 'unknown';
          if (!this.results.endpointStats.has(endpoint)) {
            this.results.endpointStats.set(endpoint, { success: 0, failure: 0 });
          }
          this.results.endpointStats.get(endpoint).success++;
          
          resolve({ success: true, latency });
        } catch (error) {
          const latency = Date.now() - requestStart;
          
          this.results.failedRequests++;
          
          // Categorize error
          if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
            this.results.timeouts++;
          } else if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
            this.results.connectionErrors++;
          } else {
            this.results.otherErrors++;
          }
          
          // Track error type
          const errorType = error.code || error.message?.substring(0, 50) || 'Unknown';
          this.results.errorTypes.set(errorType, 
            (this.results.errorTypes.get(errorType) || 0) + 1);
          
          resolve({ success: false, error: errorType, latency });
        }
        
        this.results.totalRequests++;
        completedRequests++;
        
        // Progress update
        if (completedRequests % 50 === 0) {
          const successRate = (this.results.successfulRequests / completedRequests * 100).toFixed(1);
          process.stdout.write(`\r  Progress: ${completedRequests}/${this.testConfig.totalRequests} | Success rate: ${successRate}%`);
        }
      });
      
      requests.push(requestPromise);
    }
    
    // Wait for all requests to complete
    await Promise.all(requests);
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n\n✅ Completed ${this.testConfig.totalRequests} requests in ${totalTime}s\n`);
  }

  displayResults() {
    console.log('=' .repeat(60));
    console.log('📊 SUCCESS RATE TEST RESULTS');
    console.log('=' .repeat(60));
    
    // Calculate success rate
    const successRate = (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2);
    const targetMet = parseFloat(successRate) >= 95.0;
    
    console.log('\n🎯 Success Rate:');
    console.log(`  Achieved: ${successRate}% ${targetMet ? '✅' : '❌'}`);
    console.log(`  Target: 95.0%`);
    console.log(`  ${targetMet ? 'SUCCESS: Target achieved!' : `Gap: ${(95 - parseFloat(successRate)).toFixed(2)} percentage points`}`);
    
    console.log('\n📈 Request Statistics:');
    console.log(`  Total requests: ${this.results.totalRequests}`);
    console.log(`  Successful: ${this.results.successfulRequests}`);
    console.log(`  Failed: ${this.results.failedRequests}`);
    
    if (this.results.failedRequests > 0) {
      console.log('\n❌ Failure Breakdown:');
      console.log(`  Timeouts: ${this.results.timeouts} (${(this.results.timeouts / this.results.failedRequests * 100).toFixed(1)}%)`);
      console.log(`  Connection errors: ${this.results.connectionErrors} (${(this.results.connectionErrors / this.results.failedRequests * 100).toFixed(1)}%)`);
      console.log(`  Other errors: ${this.results.otherErrors} (${(this.results.otherErrors / this.results.failedRequests * 100).toFixed(1)}%)`);
      
      if (this.results.errorTypes.size > 0) {
        console.log('\n🔝 Top Error Types:');
        const sortedErrors = Array.from(this.results.errorTypes.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        sortedErrors.forEach(([type, count], index) => {
          console.log(`  ${index + 1}. ${type}: ${count} occurrences`);
        });
      }
    }
    
    // Latency statistics
    if (this.results.latencies.length > 0) {
      this.results.latencies.sort((a, b) => a - b);
      const p50 = this.results.latencies[Math.floor(this.results.latencies.length * 0.5)];
      const p95 = this.results.latencies[Math.floor(this.results.latencies.length * 0.95)];
      const p99 = this.results.latencies[Math.floor(this.results.latencies.length * 0.99)];
      const avg = this.results.latencies.reduce((a, b) => a + b, 0) / this.results.latencies.length;
      
      const p95Target = p95 < 200;
      
      console.log('\n⚡ Latency Distribution:');
      console.log(`  Average: ${avg.toFixed(0)}ms`);
      console.log(`  P50: ${p50.toFixed(0)}ms`);
      console.log(`  P95: ${p95.toFixed(0)}ms ${p95Target ? '✅' : '❌'} (target: <200ms)`);
      console.log(`  P99: ${p99.toFixed(0)}ms`);
    }
    
    // Endpoint performance
    if (this.results.endpointStats.size > 0) {
      console.log('\n🌐 Endpoint Performance:');
      for (const [endpoint, stats] of this.results.endpointStats.entries()) {
        const total = stats.success + stats.failure;
        const rate = (stats.success / total * 100).toFixed(1);
        console.log(`  ${endpoint}: ${rate}% success (${stats.success}/${total})`);
      }
    }
    
    // Final assessment
    console.log('\n' + '=' .repeat(60));
    console.log('📋 FINAL ASSESSMENT:');
    console.log('=' .repeat(60));
    
    const successTarget = parseFloat(successRate) >= 95.0;
    const latencyTarget = this.results.latencies.length > 0 && 
      this.results.latencies[Math.floor(this.results.latencies.length * 0.95)] < 200;
    
    if (successTarget && latencyTarget) {
      console.log('\n✅ ALL TARGETS MET!');
      console.log('  - Success rate ≥95%: ACHIEVED');
      console.log('  - P95 latency <200ms: ACHIEVED');
      console.log('\n🎉 System ready for production deployment!');
    } else {
      console.log('\n⚠️  Some targets not met:');
      if (!successTarget) {
        console.log(`  - Success rate: ${successRate}% (need 95%)`);
      }
      if (!latencyTarget) {
        const p95 = this.results.latencies[Math.floor(this.results.latencies.length * 0.95)];
        console.log(`  - P95 latency: ${p95}ms (need <200ms)`);
      }
      console.log('\nFurther optimization needed.');
    }
    
    // Save detailed report
    this.saveReport();
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      configuration: {
        totalRequests: this.testConfig.totalRequests,
        concurrentRequests: this.testConfig.concurrentRequests,
        methods: this.testConfig.methods
      },
      results: {
        successRate: (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2) + '%',
        totalRequests: this.results.totalRequests,
        successful: this.results.successfulRequests,
        failed: this.results.failedRequests
      },
      failures: {
        timeouts: this.results.timeouts,
        connectionErrors: this.results.connectionErrors,
        otherErrors: this.results.otherErrors
      },
      latency: {
        p50: this.results.latencies[Math.floor(this.results.latencies.length * 0.5)],
        p95: this.results.latencies[Math.floor(this.results.latencies.length * 0.95)],
        p99: this.results.latencies[Math.floor(this.results.latencies.length * 0.99)]
      },
      errorTypes: Object.fromEntries(this.results.errorTypes),
      endpointStats: Object.fromEntries(this.results.endpointStats),
      targetsMet: {
        successRate: this.results.successfulRequests / this.results.totalRequests >= 0.95,
        p95Latency: this.results.latencies[Math.floor(this.results.latencies.length * 0.95)] < 200
      }
    };
    
    const fs = (await import('fs')).default;
    fs.writeFileSync('success-rate-test-results.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to success-rate-test-results.json');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const tester = new SuccessRateTester();
  await tester.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { SuccessRateTester };