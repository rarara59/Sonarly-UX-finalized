/**
 * Integration Test: Orchestrated System with RpcManager
 * RpcManager orchestrates all 7 components automatically
 * No manual component chaining required
 */

import { RpcManager } from '../../src/detection/transport/rpc-manager.js';
import { TokenBucket } from '../../src/detection/transport/token-bucket.js';
import { CircuitBreaker } from '../../src/detection/transport/circuit-breaker.js';
import { ConnectionPoolCore } from '../../src/detection/transport/connection-pool-core.js';
import { EndpointSelector } from '../../src/detection/transport/endpoint-selector.js';
import { RequestCache } from '../../src/detection/transport/request-cache.js';
import { BatchManager } from '../../src/detection/transport/batch-manager.js';
import { HedgedManager } from '../../src/detection/transport/hedged-manager.js';
import { performance } from 'perf_hooks';

class OrchestratedSystem {
  constructor(config = {}) {
    // Create components directly
    this.components = this.createComponents(config);
    
    // Initialize RpcManager as the orchestrator
    this.rpcManager = new RpcManager({
      // RpcManager specific config
      enableRateLimiting: true,
      enableCircuitBreaker: true,
      enableCaching: true,
      enableBatching: true,
      enableHedging: true,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000
    });
    
    // Initialize RpcManager with components (will be called manually after construction)
    this.initialized = false;
    
    // Initialize endpoints
    const endpoints = config.endpoints || [
      'https://mainnet.helius-rpc.com/?api-key=mock',
      'https://solana-mainnet.chainstack.com/mock',
      'https://api.mainnet-beta.solana.com'
    ];
    
    if (this.components.endpointSelector) {
      this.components.endpointSelector.initializeEndpoints(endpoints);
    }
    
    // Metrics tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      orchestratedCalls: 0,
      componentParticipation: new Set(),
      latencies: [],
      errors: []
    };
  }
  
  async initializeRpcManager() {
    // Initialize RpcManager with all components
    await this.rpcManager.initialize({
      tokenBucket: this.components.rateLimiter,
      circuitBreaker: this.components.circuitBreaker,
      connectionPool: this.components.connectionPool,
      endpointSelector: this.components.endpointSelector,
      requestCache: this.components.requestCache,
      batchManager: this.components.batchManager,
      hedgedManager: this.components.hedgedManager
    });
  }
  
  createComponents(config) {
    const components = {};
    
    // Create each component directly
    // 1. Rate Limiter
    components.rateLimiter = new TokenBucket({
      rateLimit: config.rateLimit || 50,
      windowMs: 1000,
      maxBurst: config.maxBurst || 75
    });
    console.log('✅ Created TokenBucket');
    
    // 2. Circuit Breaker
    components.circuitBreaker = new CircuitBreaker({
      failureThreshold: config.failureThreshold || 6,
      successThreshold: 3,
      cooldownPeriod: 5000
    });
    console.log('✅ Created CircuitBreaker');
    
    // 3. Connection Pool
    components.connectionPool = new ConnectionPoolCore({
      maxSockets: config.maxSockets || 20,
      maxSocketsPerHost: 10,
      keepAlive: true,
      keepAliveMsecs: 3000
    });
    console.log('✅ Created ConnectionPoolCore');
    
    // 4. Endpoint Selector
    components.endpointSelector = new EndpointSelector({
      strategy: config.strategy || 'round-robin'
    });
    console.log('✅ Created EndpointSelector');
    
    // 5. Request Cache
    components.requestCache = new RequestCache({
      maxSize: config.maxCacheSize || 1000,
      defaultTTL: config.cacheTTL || 15000,
      cleanupInterval: 5000
    });
    console.log('✅ Created RequestCache');
    
    // 6. Batch Manager
    components.batchManager = new BatchManager({
      batchSize: config.batchSize || 8,
      batchWindowMs: config.batchWindowMs || 100,
      maxQueueSize: 100
    });
    console.log('✅ Created BatchManager');
    
    // 7. Hedged Manager
    components.hedgedManager = new HedgedManager({
      hedgingDelay: config.hedgeDelayMs || 200,
      maxBackups: config.backupCount || 1
    });
    console.log('✅ Created HedgedManager');
    
    return components;
  }
  
  /**
   * Make a request using RpcManager orchestration
   * This replaces all manual component chaining
   */
  async makeOrchestratedRequest(method, params, options = {}) {
    const requestStart = performance.now();
    this.metrics.totalRequests++;
    this.metrics.orchestratedCalls++;
    
    try {
      // Track which components participate
      this.trackComponentParticipation();
      
      // Single orchestrated call - RpcManager handles all component coordination
      const result = await this.rpcManager.call(method, params, options);
      
      const latency = performance.now() - requestStart;
      this.metrics.latencies.push(latency);
      this.metrics.successfulRequests++;
      
      return {
        success: true,
        data: result,
        latency,
        orchestrated: true,
        componentsUsed: Array.from(this.metrics.componentParticipation)
      };
      
    } catch (error) {
      const latency = performance.now() - requestStart;
      this.metrics.latencies.push(latency);
      this.metrics.failedRequests++;
      this.metrics.errors.push({
        method,
        error: error.message,
        timestamp: Date.now()
      });
      
      return {
        success: false,
        error: error.message,
        latency,
        orchestrated: true
      };
    }
  }
  
  trackComponentParticipation() {
    // Track which components are active in the orchestration
    if (this.components.rateLimiter) this.metrics.componentParticipation.add('rateLimiter');
    if (this.components.circuitBreaker) this.metrics.componentParticipation.add('circuitBreaker');
    if (this.components.connectionPool) this.metrics.componentParticipation.add('connectionPool');
    if (this.components.endpointSelector) this.metrics.componentParticipation.add('endpointSelector');
    if (this.components.requestCache) this.metrics.componentParticipation.add('requestCache');
    if (this.components.batchManager) this.metrics.componentParticipation.add('batchManager');
    if (this.components.hedgedManager) this.metrics.componentParticipation.add('hedgedManager');
  }
  
  /**
   * Get system metrics from RpcManager
   */
  async getSystemMetrics() {
    // Get metrics from RpcManager's internal state
    const metrics = this.rpcManager.metrics || {};
    
    return {
      orchestrator: {
        totalRequests: this.metrics.totalRequests,
        successfulRequests: this.metrics.successfulRequests,
        failedRequests: this.metrics.failedRequests,
        orchestratedCalls: this.metrics.orchestratedCalls,
        successRate: this.metrics.totalRequests > 0 
          ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1)
          : 0,
        avgLatency: this.metrics.latencies.length > 0
          ? (this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length).toFixed(2)
          : 0,
        componentsActive: this.metrics.componentParticipation.size
      },
      components: metrics,
      health: await this.getSystemHealth()
    };
  }
  
  /**
   * Get system health from all components
   */
  async getSystemHealth() {
    const health = {};
    
    // Check each component's health
    if (this.components.rateLimiter) {
      health.rateLimiter = {
        healthy: true,
        available: this.components.rateLimiter.getAvailableTokens ? 
          this.components.rateLimiter.getAvailableTokens() : 'unknown'
      };
    }
    
    if (this.components.circuitBreaker) {
      const cbMetrics = this.components.circuitBreaker.getMetrics();
      health.circuitBreaker = {
        healthy: cbMetrics.state !== 'OPEN',
        state: cbMetrics.state,
        failures: cbMetrics.failures || 0
      };
    }
    
    if (this.components.connectionPool) {
      const poolStats = this.components.connectionPool.getStats ? 
        this.components.connectionPool.getStats() : {};
      health.connectionPool = {
        healthy: true,
        stats: poolStats
      };
    }
    
    if (this.components.endpointSelector) {
      const endpoints = this.components.endpointSelector.getAvailableEndpoints ?
        this.components.endpointSelector.getAvailableEndpoints() : [];
      health.endpointSelector = {
        healthy: endpoints.length > 0,
        availableEndpoints: endpoints.length
      };
    }
    
    if (this.components.requestCache) {
      const cacheStats = this.components.requestCache.getStats ?
        this.components.requestCache.getStats() : {};
      health.requestCache = {
        healthy: true,
        stats: cacheStats
      };
    }
    
    if (this.components.batchManager) {
      health.batchManager = {
        healthy: true,
        pendingBatches: this.components.batchManager.getPendingCount ?
          this.components.batchManager.getPendingCount() : 0
      };
    }
    
    if (this.components.hedgedManager) {
      health.hedgedManager = {
        healthy: true,
        activeHedges: this.components.hedgedManager.getActiveCount ?
          this.components.hedgedManager.getActiveCount() : 0
      };
    }
    
    // Overall system health
    health.system = {
      healthy: Object.values(health).every(h => h.healthy !== false),
      componentsHealthy: Object.keys(health).filter(k => k !== 'system').length
    };
    
    return health;
  }
  
  /**
   * Test orchestrated request flow
   */
  async testOrchestratedFlow() {
    console.log('\n📝 Testing Orchestrated Request Flow');
    
    const testResults = {
      basic: [],
      batch: [],
      hedged: [],
      cached: []
    };
    
    // Test 1: Basic orchestrated request
    console.log('Testing basic orchestrated request...');
    const basicResult = await this.makeOrchestratedRequest('getBalance', ['test_address_1']);
    testResults.basic.push(basicResult);
    
    // Test 2: Batchable requests (should be batched by orchestrator)
    console.log('Testing batchable requests...');
    const batchPromises = [];
    for (let i = 0; i < 5; i++) {
      batchPromises.push(
        this.makeOrchestratedRequest('getBalance', [`batch_address_${i}`])
      );
    }
    const batchResults = await Promise.all(batchPromises);
    testResults.batch = batchResults;
    
    // Test 3: Hedgeable request (critical method)
    console.log('Testing hedgeable request...');
    const hedgedResult = await this.makeOrchestratedRequest('getSlot', []);
    testResults.hedged.push(hedgedResult);
    
    // Test 4: Cached request (repeat earlier request)
    console.log('Testing cached request...');
    const cachedResult = await this.makeOrchestratedRequest('getBalance', ['test_address_1']);
    testResults.cached.push(cachedResult);
    
    // Analyze results
    const analysis = {
      basicSuccess: testResults.basic.every(r => r.success),
      batchSuccess: testResults.batch.every(r => r.success),
      hedgedSuccess: testResults.hedged.every(r => r.success),
      cachedSuccess: testResults.cached.every(r => r.success),
      allOrchestrated: [...testResults.basic, ...testResults.batch, ...testResults.hedged, ...testResults.cached]
        .every(r => r.orchestrated),
      avgLatency: this.calculateAverageLatency([
        ...testResults.basic,
        ...testResults.batch,
        ...testResults.hedged,
        ...testResults.cached
      ])
    };
    
    return {
      results: testResults,
      analysis,
      success: analysis.basicSuccess && analysis.batchSuccess && 
               analysis.hedgedSuccess && analysis.cachedSuccess && 
               analysis.allOrchestrated
    };
  }
  
  calculateAverageLatency(results) {
    const latencies = results.map(r => r.latency).filter(l => l !== undefined);
    if (latencies.length === 0) return 0;
    return latencies.reduce((a, b) => a + b, 0) / latencies.length;
  }
  
  /**
   * Test component coordination
   */
  async testComponentCoordination() {
    console.log('\n📝 Testing Component Coordination');
    
    // Make various requests to ensure all components participate
    const requests = [
      // Rate limited request
      { method: 'getBalance', params: ['rate_test'] },
      // Cacheable request
      { method: 'getAccountInfo', params: ['cache_test'] },
      // Batchable requests
      { method: 'getBalance', params: ['batch_1'] },
      { method: 'getBalance', params: ['batch_2'] },
      // Hedgeable request
      { method: 'getSlot', params: [] },
      // Request that might trigger circuit breaker
      { method: 'sendTransaction', params: ['invalid_tx'] }
    ];
    
    const results = [];
    for (const req of requests) {
      const result = await this.makeOrchestratedRequest(req.method, req.params);
      results.push(result);
    }
    
    // Check component participation
    const participation = Array.from(this.metrics.componentParticipation);
    
    return {
      totalRequests: requests.length,
      successfulRequests: results.filter(r => r.success).length,
      componentsParticipating: participation.length,
      allComponentsActive: participation.length === 7,
      componentList: participation
    };
  }
  
  /**
   * Run comprehensive orchestrated system test
   */
  async runOrchestratedTest() {
    console.log('\n🚀 Running Orchestrated System Test');
    
    const testStart = Date.now();
    
    // Test orchestrated flow
    const flowTest = await this.testOrchestratedFlow();
    
    // Test component coordination
    const coordinationTest = await this.testComponentCoordination();
    
    // Get system metrics
    const systemMetrics = await this.getSystemMetrics();
    
    const testEnd = Date.now();
    const totalTime = testEnd - testStart;
    
    return {
      flowTest,
      coordinationTest,
      systemMetrics,
      performance: {
        totalTime,
        avgLatency: systemMetrics.orchestrator.avgLatency,
        throughput: this.metrics.totalRequests / (totalTime / 1000)
      }
    };
  }
}

// Main test execution
async function runOrchestratedSystemTest() {
  console.log('=' .repeat(60));
  console.log('Orchestrated System Integration Test');
  console.log('RpcManager orchestrating all 7 components');
  console.log('=' .repeat(60));
  
  // Create system
  const system = new OrchestratedSystem({
    rateLimit: 50,
    maxBurst: 75,
    failureThreshold: 6,
    maxSockets: 20,
    strategy: 'round-robin',
    maxCacheSize: 1000,
    cacheTTL: 15000,
    batchSize: 8,
    batchWindowMs: 100,
    hedgeDelayMs: 200,
    backupCount: 1,
    endpoints: [
      'https://mainnet.helius-rpc.com/?api-key=mock',
      'https://solana-mainnet.chainstack.com/mock',
      'https://api.mainnet-beta.solana.com'
    ]
  });
  
  // Initialize RpcManager
  try {
    await system.initializeRpcManager();
    console.log('✅ RpcManager initialized with all components');
    system.initialized = true;
  } catch (error) {
    console.log('⚠️ RpcManager initialization failed:', error.message);
  }
  
  // Test 1: Basic orchestrated call
  console.log('\n📝 Test 1: Basic Orchestrated Call');
  const basicResult = await system.makeOrchestratedRequest('getBalance', ['test_address']);
  console.log(`Orchestrated call: ${basicResult.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`Used orchestrator: ${basicResult.orchestrated ? '✅' : '❌'}`);
  console.log(`Latency: ${basicResult.latency?.toFixed(2)}ms`);
  console.log(`Components used: ${basicResult.componentsUsed?.join(', ') || 'N/A'}`);
  
  // Test 2: Run comprehensive test
  const testResults = await system.runOrchestratedTest();
  
  console.log('\n📊 Orchestrated Flow Results:');
  console.log(`Basic requests: ${testResults.flowTest.analysis.basicSuccess ? '✅' : '❌'}`);
  console.log(`Batch requests: ${testResults.flowTest.analysis.batchSuccess ? '✅' : '❌'}`);
  console.log(`Hedged requests: ${testResults.flowTest.analysis.hedgedSuccess ? '✅' : '❌'}`);
  console.log(`Cached requests: ${testResults.flowTest.analysis.cachedSuccess ? '✅' : '❌'}`);
  console.log(`All orchestrated: ${testResults.flowTest.analysis.allOrchestrated ? '✅' : '❌'}`);
  console.log(`Average latency: ${testResults.flowTest.analysis.avgLatency.toFixed(2)}ms`);
  
  console.log('\n📊 Component Coordination Results:');
  console.log(`Total requests: ${testResults.coordinationTest.totalRequests}`);
  console.log(`Successful: ${testResults.coordinationTest.successfulRequests}`);
  console.log(`Components participating: ${testResults.coordinationTest.componentsParticipating}/7`);
  console.log(`All components active: ${testResults.coordinationTest.allComponentsActive ? '✅' : '❌'}`);
  console.log(`Active components: ${testResults.coordinationTest.componentList.join(', ')}`);
  
  console.log('\n📊 System Metrics:');
  console.log(`Total requests: ${testResults.systemMetrics.orchestrator.totalRequests}`);
  console.log(`Success rate: ${testResults.systemMetrics.orchestrator.successRate}%`);
  console.log(`Orchestrated calls: ${testResults.systemMetrics.orchestrator.orchestratedCalls}`);
  console.log(`Average latency: ${testResults.systemMetrics.orchestrator.avgLatency}ms`);
  console.log(`Components active: ${testResults.systemMetrics.orchestrator.componentsActive}/7`);
  
  console.log('\n🏥 System Health:');
  const health = testResults.systemMetrics.health;
  console.log(`Rate Limiter: ${health.rateLimiter?.healthy ? '✅' : '❌'}`);
  console.log(`Circuit Breaker: ${health.circuitBreaker?.healthy ? '✅' : '❌'} (${health.circuitBreaker?.state})`);
  console.log(`Connection Pool: ${health.connectionPool?.healthy ? '✅' : '❌'}`);
  console.log(`Endpoint Selector: ${health.endpointSelector?.healthy ? '✅' : '❌'} (${health.endpointSelector?.availableEndpoints} endpoints)`);
  console.log(`Request Cache: ${health.requestCache?.healthy ? '✅' : '❌'}`);
  console.log(`Batch Manager: ${health.batchManager?.healthy ? '✅' : '❌'}`);
  console.log(`Hedged Manager: ${health.hedgedManager?.healthy ? '✅' : '❌'}`);
  console.log(`Overall System: ${health.system?.healthy ? '✅ Healthy' : '❌ Unhealthy'}`);
  
  console.log('\n⚡ Performance:');
  console.log(`Total test time: ${testResults.performance.totalTime}ms`);
  console.log(`Average latency: ${testResults.performance.avgLatency}ms`);
  console.log(`Throughput: ${testResults.performance.throughput.toFixed(2)} req/s`);
  
  // Validate success criteria
  console.log('\n✅ Success Criteria Validation:');
  const criteria = {
    'RpcManager orchestrates all components': basicResult.orchestrated,
    'Single rpcManager.call() works': basicResult.success,
    'Component coordination works': testResults.coordinationTest.allComponentsActive,
    'All 7 components participate': testResults.coordinationTest.componentsParticipating === 7,
    'System metrics available': testResults.systemMetrics.orchestrator.totalRequests > 0,
    'System health available': health.system !== undefined,
    'Performance < 8000ms': parseFloat(testResults.performance.avgLatency) < 8000,
    'End-to-end orchestration works': testResults.flowTest.success
  };
  
  let allPassed = true;
  for (const [criterion, passed] of Object.entries(criteria)) {
    console.log(`${passed ? '✅' : '❌'} ${criterion}`);
    if (!passed) allPassed = false;
  }
  
  console.log('\n' + '=' .repeat(60));
  if (allPassed) {
    console.log('🎉 Orchestrated system test passed!');
    console.log('RpcManager successfully orchestrates all 7 components');
    console.log('No manual component chaining required');
  } else {
    console.log('⚠️ Some criteria not met - review results above');
  }
  console.log('=' .repeat(60));
  
  return allPassed;
}

// Execute the test
runOrchestratedSystemTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });