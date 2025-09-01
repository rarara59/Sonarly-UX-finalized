/**
 * Integration Test: TokenBucket + ConnectionPoolCore Chain
 * Tests rate limiting and connection pooling with real Solana RPC calls
 */

import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { RealSolanaHelper } from '../../scripts/real-solana-helper.js';

class IntegrationChain {
  constructor() {
    // Initialize TokenBucket with 50 rps limit
    this.rateLimiter = new TokenBucket({
      rateLimit: 50,
      windowMs: 1000,
      maxBurst: 75
    });
    
    // Initialize ConnectionPoolCore with 20 max sockets
    this.connectionPool = new ConnectionPoolCore({
      maxSockets: 20,
      maxSocketsPerHost: 10,
      keepAlive: true,
      keepAliveMsecs: 3000,
      timeout: 10000
    });
    
    // Initialize Solana helper
    this.solanaHelper = new RealSolanaHelper();
    
    // Metrics tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      rateLimitedRequests: 0,
      connectionPoolRejections: 0,
      validResponses: 0,
      invalidResponses: 0,
      errors: [],
      socketReuse: 0,
      uniqueSockets: new Set(),
      responseTimes: []
    };
  }
  
  async makeRequest(method, params) {
    const startTime = Date.now();
    this.metrics.totalRequests++;
    
    try {
      // Step 1: Check rate limiter
      if (!await this.rateLimiter.tryConsume(1)) {
        this.metrics.rateLimitedRequests++;
        return { 
          success: false, 
          reason: 'rate_limited',
          latency: Date.now() - startTime
        };
      }
      
      // Step 2: Get connection from pool
      const agent = this.connectionPool.getAgent('https');
      if (!agent) {
        this.metrics.connectionPoolRejections++;
        return { 
          success: false, 
          reason: 'no_connection',
          latency: Date.now() - startTime
        };
      }
      
      // Track socket usage
      const sockets = agent.sockets;
      Object.keys(sockets).forEach(key => {
        const socketList = sockets[key];
        socketList.forEach(socket => {
          if (socket._handle && socket._handle.fd) {
            this.metrics.uniqueSockets.add(socket._handle.fd);
          }
        });
      });
      
      // Step 3: Make real Solana RPC call
      const response = await this.solanaHelper.executeRpcCall(method, params, {
        agent,
        timeout: 5000
      });
      
      const latency = Date.now() - startTime;
      this.metrics.responseTimes.push(latency);
      
      // Validate response
      if (response && response.result) {
        this.metrics.successfulRequests++;
        
        // Check for valid Solana data
        if (response.result.value !== undefined) {
          this.metrics.validResponses++;
          
          // Check for lamports in balance requests
          if (method === 'getBalance' && typeof response.result.value === 'number') {
            return {
              success: true,
              lamports: response.result.value,
              latency
            };
          }
          
          // Check for token supply data
          if (method === 'getTokenSupply' && response.result.value.uiAmount !== undefined) {
            return {
              success: true,
              supply: response.result.value,
              latency
            };
          }
          
          return {
            success: true,
            data: response.result.value,
            latency
          };
        } else {
          this.metrics.invalidResponses++;
        }
      }
      
      return {
        success: false,
        reason: 'invalid_response',
        latency
      };
      
    } catch (error) {
      this.metrics.errors.push({
        method,
        error: error.message,
        time: new Date().toISOString()
      });
      
      return {
        success: false,
        reason: 'error',
        error: error.message,
        latency: Date.now() - startTime
      };
    }
  }
  
  async runLoadTest(requestCount, concurrency) {
    console.log(`\\n🚀 Starting load test: ${requestCount} requests, ${concurrency} concurrent`);
    
    const tokens = ['BONK', 'WIF', 'PEPE', 'SAMO', 'POPCAT'];
    const methods = [
      { method: 'getTokenSupply', weight: 0.4 },
      { method: 'getBalance', weight: 0.3 },
      { method: 'getSlot', weight: 0.2 },
      { method: 'getHealth', weight: 0.1 }
    ];
    
    const requests = [];
    for (let i = 0; i < requestCount; i++) {
      // Select method based on weight
      const rand = Math.random();
      let selectedMethod = methods[0].method;
      let cumWeight = 0;
      for (const m of methods) {
        cumWeight += m.weight;
        if (rand < cumWeight) {
          selectedMethod = m.method;
          break;
        }
      }
      
      // Prepare params based on method
      let params = [];
      if (selectedMethod === 'getTokenSupply') {
        const token = tokens[Math.floor(Math.random() * tokens.length)];
        params = [this.solanaHelper.tokens[token].mint];
      } else if (selectedMethod === 'getBalance') {
        params = [this.solanaHelper.getRandomWalletAddress()];
      }
      
      requests.push({ method: selectedMethod, params });
    }
    
    // Execute requests with controlled concurrency
    const startTime = Date.now();
    const results = [];
    
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);
      const batchPromises = batch.map(req => 
        this.makeRequest(req.method, req.params)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to allow rate limiter to refill
      if (i + concurrency < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    // Calculate socket reuse efficiency
    const poolStats = this.connectionPool.getStats();
    const socketReuseRate = poolStats.activeConnections > 0 
      ? (this.metrics.successfulRequests - this.metrics.uniqueSockets.size) / this.metrics.successfulRequests * 100
      : 0;
    
    // Calculate success metrics
    const successRate = (this.metrics.successfulResponses / this.metrics.totalRequests * 100).toFixed(1);
    const rateLimitRate = (this.metrics.rateLimitedRequests / this.metrics.totalRequests * 100).toFixed(1);
    const validResponseRate = (this.metrics.validResponses / Math.max(1, this.metrics.successfulRequests) * 100).toFixed(1);
    
    // Calculate latency percentiles
    const sortedLatencies = this.metrics.responseTimes.sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;
    
    return {
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      rateLimitedRequests: this.metrics.rateLimitedRequests,
      successRate,
      rateLimitRate,
      validResponseRate,
      socketReuseRate: socketReuseRate.toFixed(1),
      uniqueSockets: this.metrics.uniqueSockets.size,
      totalTime,
      throughput: (this.metrics.totalRequests / (totalTime / 1000)).toFixed(1),
      latencyP50: p50,
      latencyP95: p95,
      latencyP99: p99,
      errors: this.metrics.errors.length,
      poolStats
    };
  }
  
  getMetrics() {
    return this.metrics;
  }
}

// Test suite
async function runIntegrationTest() {
  console.log('=' .repeat(60));
  console.log('TokenBucket + ConnectionPoolCore Integration Test');
  console.log('Testing rate limiting and connection pooling with real Solana RPC');
  console.log('=' .repeat(60));
  
  const chain = new IntegrationChain();
  
  // Test 1: Basic functionality test
  console.log('\\n📝 Test 1: Basic Request Chain');
  const basicResult = await chain.makeRequest('getHealth', []);
  console.log(`Health check: ${basicResult.success ? '✅ Success' : '❌ Failed'}`);
  if (basicResult.latency) {
    console.log(`Latency: ${basicResult.latency}ms`);
  }
  
  // Test 2: Token supply request
  console.log('\\n📝 Test 2: Token Supply Request');
  const tokenResult = await chain.makeRequest(
    'getTokenSupply', 
    [chain.solanaHelper.tokens.BONK.mint]
  );
  console.log(`BONK supply: ${tokenResult.success ? '✅ Success' : '❌ Failed'}`);
  if (tokenResult.supply) {
    console.log(`Supply: ${tokenResult.supply.uiAmount}`);
  }
  
  // Test 3: Load test with rate limiting
  console.log('\\n📝 Test 3: Load Test (200 requests, 10 concurrent)');
  const loadResults = await chain.runLoadTest(200, 10);
  
  console.log('\\n📊 Results Summary:');
  console.log('-' .repeat(40));
  console.log(`Total Requests: ${loadResults.totalRequests}`);
  console.log(`Successful: ${loadResults.successfulRequests}`);
  console.log(`Rate Limited: ${loadResults.rateLimitedRequests}`);
  console.log(`Success Rate: ${loadResults.successRate}%`);
  console.log(`Rate Limit Rate: ${loadResults.rateLimitRate}%`);
  console.log(`Valid Responses: ${loadResults.validResponseRate}%`);
  console.log(`\\nConnection Pool:`);
  console.log(`Socket Reuse: ${loadResults.socketReuseRate}%`);
  console.log(`Unique Sockets: ${loadResults.uniqueSockets}`);
  console.log(`Active Connections: ${loadResults.poolStats.activeConnections}`);
  console.log(`\\nPerformance:`);
  console.log(`Throughput: ${loadResults.throughput} rps`);
  console.log(`P50 Latency: ${loadResults.latencyP50}ms`);
  console.log(`P95 Latency: ${loadResults.latencyP95}ms`);
  console.log(`P99 Latency: ${loadResults.latencyP99}ms`);
  console.log(`Errors: ${loadResults.errors}`);
  
  // Validate success criteria
  console.log('\\n✅ Success Criteria Validation:');
  const criteria = {
    'Success Rate > 60%': parseFloat(loadResults.successRate) > 60,
    'Rate Limiting Active (>20% rejected)': parseFloat(loadResults.rateLimitRate) > 20,
    'Socket Reuse > 80%': parseFloat(loadResults.socketReuseRate) > 80,
    'Valid Solana Responses': parseFloat(loadResults.validResponseRate) > 90
  };
  
  let allPassed = true;
  for (const [criterion, passed] of Object.entries(criteria)) {
    console.log(`${passed ? '✅' : '❌'} ${criterion}`);
    if (!passed) allPassed = false;
  }
  
  // Test 4: Burst test
  console.log('\\n📝 Test 4: Burst Test (100 simultaneous requests)');
  const burstStartTime = Date.now();
  const burstPromises = [];
  
  for (let i = 0; i < 100; i++) {
    burstPromises.push(
      chain.makeRequest('getSlot', [])
    );
  }
  
  const burstResults = await Promise.all(burstPromises);
  const burstTime = Date.now() - burstStartTime;
  
  const burstSuccess = burstResults.filter(r => r.success).length;
  const burstRateLimited = burstResults.filter(r => r.reason === 'rate_limited').length;
  
  console.log(`Burst completed in ${burstTime}ms`);
  console.log(`Successful: ${burstSuccess}/100`);
  console.log(`Rate Limited: ${burstRateLimited}/100`);
  console.log(`Connection Pool prevented exhaustion: ${burstRateLimited > 0 ? '✅' : '⚠️'}`);
  
  // Final summary
  console.log('\\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 All integration tests passed!');
    console.log('TokenBucket successfully prevents ConnectionPoolCore exhaustion');
    console.log('Real Solana RPC calls validated with proper rate limiting');
  } else {
    console.log('⚠️ Some criteria not met - review results above');
  }
  console.log('=' .repeat(60));
  
  return allPassed;
}

// Run the test
runIntegrationTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });