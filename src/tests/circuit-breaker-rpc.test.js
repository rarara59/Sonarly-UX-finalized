/**
 * CIRCUIT BREAKER RPC INTEGRATION TEST
 * 
 * Tests circuit breaker protection of RPC calls with realistic failure scenarios:
 * - Network failures and timeouts
 * - Rate limiting (429 errors)
 * - Server errors (5xx)
 * - Circuit breaker cascade failure prevention
 * 
 * This validates that the circuit breaker works correctly with actual RPC patterns.
 */

import { CircuitBreaker, CircuitBreakerManager } from '../services/circuit-breaker.service.js';

// Mock RPC Client that simulates real Solana RPC behavior
class MockRPCClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'https://mock-rpc.solana.com';
    this.failureMode = config.failureMode || 'none'; // none, network, timeout, rate_limit, server_error
    this.failureRate = config.failureRate || 0; // 0-1, probability of failure
    this.responseDelay = config.responseDelay || 10; // ms
    this.consecutiveFailures = 0;
    this.totalRequests = 0;
    this.isHealthy = true;
  }

  async getMultipleAccounts(addresses) {
    return this.makeRequest('getMultipleAccounts', { addresses });
  }

  async getTokenAccountBalance(address) {
    return this.makeRequest('getTokenAccountBalance', { address });
  }

  async getTransaction(signature) {
    return this.makeRequest('getTransaction', { signature });
  }

  async confirmTransaction(signature) {
    return this.makeRequest('confirmTransaction', { signature });
  }

  async makeRequest(method, params) {
    this.totalRequests++;
    
    // Simulate response delay
    if (this.responseDelay > 0) {
      await this.sleep(this.responseDelay);
    }
    
    // Simulate failures based on configuration
    if (this.shouldFail()) {
      this.consecutiveFailures++;
      return this.generateFailure();
    }
    
    this.consecutiveFailures = 0;
    return this.generateSuccess(method, params);
  }

  shouldFail() {
    // Never fail if explicitly set to 'none' mode (for recovery testing)
    if (this.failureMode === 'none' && this.failureRate === 0) {
      return false;
    }
    
    // Always fail if in failure mode and failure rate is met
    if (this.failureMode !== 'none' && Math.random() < this.failureRate) {
      return true;
    }
    
    // Simulate cascading failures (each failure increases next failure probability)
    // But only if we're not in explicit 'none' mode
    if (this.failureMode !== 'none') {
      const cascadeRate = Math.min(this.consecutiveFailures * 0.1, 0.8);
      return Math.random() < cascadeRate;
    }
    
    return false;
  }

  generateFailure() {
    const error = new Error();
    
    switch (this.failureMode) {
      case 'network':
        error.message = 'Connection refused';
        error.code = 'ECONNREFUSED';
        break;
        
      case 'timeout':
        error.message = 'Request timeout';
        error.code = 'ETIMEDOUT';
        break;
        
      case 'rate_limit':
        error.message = 'Too many requests';
        error.status = 429;
        break;
        
      case 'server_error':
        error.message = 'Internal server error';
        error.status = 500;
        break;
        
      default:
        error.message = 'Unknown RPC error';
        error.code = 'UNKNOWN';
    }
    
    throw error;
  }

  generateSuccess(method, params) {
    const mockData = {
      getMultipleAccounts: {
        value: (params.addresses || []).map(addr => ({
          account: {
            data: Buffer.from('mock-account-data'),
            executable: false,
            lamports: 1000000,
            owner: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
            rentEpoch: 300
          },
          pubkey: addr
        }))
      },
      
      getTokenAccountBalance: {
        value: {
          amount: '1000000',
          decimals: 6,
          uiAmount: 1.0,
          uiAmountString: '1.0'
        }
      },
      
      getTransaction: {
        blockTime: Math.floor(Date.now() / 1000),
        meta: {
          fee: 5000,
          err: null,
          status: { Ok: null }
        },
        transaction: {
          signatures: [params.signature]
        }
      },
      
      confirmTransaction: {
        value: [
          { confirmationStatus: 'confirmed', confirmations: 10, err: null, slot: 123456 }
        ]
      }
    };
    
    return {
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 10000),
      result: mockData[method] || { success: true }
    };
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test utilities
  setFailureMode(mode, rate = 0.8) {
    this.failureMode = mode;
    this.failureRate = rate;
    // Reset cascading failures when explicitly setting mode
    if (mode === 'none' && rate === 0) {
      this.consecutiveFailures = 0;
    }
  }

  reset() {
    this.consecutiveFailures = 0;
    this.totalRequests = 0;
    this.failureMode = 'none';
    this.failureRate = 0;
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      consecutiveFailures: this.consecutiveFailures,
      failureMode: this.failureMode,
      failureRate: this.failureRate
    };
  }
}

// Protected RPC Client using Circuit Breaker
class ProtectedRPCClient {
  constructor(rpcClient, circuitBreakerManager) {
    this.rpcClient = rpcClient;
    this.cbManager = circuitBreakerManager;
    
    // Circuit breaker configurations for different operations
    this.cbConfigs = {
      'getMultipleAccounts': { failureThreshold: 5, timeout: 5000 },
      'getTokenAccountBalance': { failureThreshold: 3, timeout: 2000, maxConcurrent: 5 },
      'getTransaction': { failureThreshold: 5, timeout: 3000 },
      'confirmTransaction': { failureThreshold: 3, timeout: 10000, resetTimeout: 100 }
    };
  }

  async getMultipleAccounts(addresses) {
    return this.cbManager.execute(
      'rpc-getMultipleAccounts',
      () => this.rpcClient.getMultipleAccounts(addresses),
      this.cbConfigs.getMultipleAccounts
    );
  }

  async getTokenAccountBalance(address) {
    return this.cbManager.execute(
      'rpc-getTokenAccountBalance',
      () => this.rpcClient.getTokenAccountBalance(address),
      this.cbConfigs.getTokenAccountBalance
    );
  }

  async getTransaction(signature) {
    return this.cbManager.execute(
      'rpc-getTransaction',
      () => this.rpcClient.getTransaction(signature),
      this.cbConfigs.getTransaction
    );
  }

  async confirmTransaction(signature) {
    return this.cbManager.execute(
      'rpc-confirmTransaction',
      () => this.rpcClient.confirmTransaction(signature),
      this.cbConfigs.confirmTransaction
    );
  }
}

// Test utilities
class IntegrationTestUtils {
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static generateMockAddresses(count) {
    const addresses = [];
    for (let i = 0; i < count; i++) {
      addresses.push(`Address${i.toString().padStart(3, '0')}`);
    }
    return addresses;
  }
  
  static generateMockSignature() {
    return 'signature' + Math.random().toString(36).substring(2, 15);
  }
}

// Test Suite
class RPCIntegrationTestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }
  
  test(name, fn) {
    this.tests.push({ name, fn });
  }
  
  async run() {
    console.log('\n🔗 RUNNING CIRCUIT BREAKER RPC INTEGRATION TESTS\n');
    
    for (const { name, fn } of this.tests) {
      try {
        console.log(`⚡ Testing: ${name}`);
        await fn();
        console.log(`✅ PASS: ${name}\n`);
        this.passed++;
      } catch (error) {
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }
    
    console.log(`\n📊 INTEGRATION TEST RESULTS:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`);
    
    if (this.failed > 0) {
      throw new Error(`${this.failed} integration tests failed`);
    }
  }
}

const suite = new RPCIntegrationTestSuite();

// =============================================================================
// BASIC RPC PROTECTION TESTS
// =============================================================================

suite.test('Circuit breaker protects successful RPC calls', async () => {
  const mockRPC = new MockRPCClient({ responseDelay: 50 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  const addresses = IntegrationTestUtils.generateMockAddresses(5);
  const result = await protectedRPC.getMultipleAccounts(addresses);
  
  if (!result.result || !result.result.value) {
    throw new Error('Invalid RPC response structure');
  }
  
  if (result.result.value.length !== 5) {
    throw new Error(`Expected 5 accounts, got ${result.result.value.length}`);
  }
  
  const metrics = cbManager.getAllMetrics();
  if (metrics.totalCircuits !== 1) {
    throw new Error(`Expected 1 circuit, got ${metrics.totalCircuits}`);
  }
  
  cbManager.shutdown();
});

suite.test('Circuit breaker handles network failures', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'network', failureRate: 1.0 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // Should fail but not crash system
  try {
    await protectedRPC.getTokenAccountBalance('test-address');
    throw new Error('Expected network error');
  } catch (error) {
    if (!error.message.includes('Connection refused')) {
      throw new Error(`Expected connection refused, got: ${error.message}`);
    }
  }
  
  const metrics = cbManager.getAllMetrics();
  if (metrics.circuitBreakers['rpc-getTokenAccountBalance'].failureCount !== 1) {
    throw new Error('Failure count should be 1');
  }
  
  cbManager.shutdown();
});

suite.test('Circuit breaker opens after threshold failures', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'server_error', failureRate: 1.0 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // Trigger enough failures to open circuit (threshold = 5 for getTransaction)
  const signature = IntegrationTestUtils.generateMockSignature();
  
  for (let i = 0; i < 5; i++) {
    try {
      await protectedRPC.getTransaction(signature);
      throw new Error('Expected server error');
    } catch (error) {
      if (!error.message.includes('Internal server error')) {
        throw new Error(`Expected server error, got: ${error.message}`);
      }
    }
  }
  
  const metrics = cbManager.getAllMetrics();
  const circuitState = metrics.circuitBreakers['rpc-getTransaction'].state;
  
  if (circuitState !== 'OPEN') {
    throw new Error(`Expected circuit to be OPEN, was ${circuitState}`);
  }
  
  cbManager.shutdown();
});

suite.test('Open circuit rejects requests immediately', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'timeout', failureRate: 1.0 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  const signature = IntegrationTestUtils.generateMockSignature();
  
  // Open circuit
  for (let i = 0; i < 3; i++) {
    try {
      await protectedRPC.confirmTransaction(signature);
    } catch (error) {
      // Expected
    }
  }
  
  // Next request should be rejected immediately
  const startTime = Date.now();
  try {
    await protectedRPC.confirmTransaction(signature);
    throw new Error('Expected circuit breaker rejection');
  } catch (error) {
    if (!error.message.includes('is OPEN')) {
      throw new Error(`Expected circuit open error, got: ${error.message}`);
    }
  }
  
  const duration = Date.now() - startTime;
  if (duration > 500) {
    throw new Error(`Request should be rejected immediately, took ${duration}ms`);
  }
  
  cbManager.shutdown();
});

// =============================================================================
// RATE LIMITING AND TIMEOUT TESTS
// =============================================================================

suite.test('Circuit breaker handles rate limiting correctly', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'rate_limit', failureRate: 1.0 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // Rate limit errors should trip circuit
  const addresses = IntegrationTestUtils.generateMockAddresses(1);
  
  for (let i = 0; i < 5; i++) {
    try {
      await protectedRPC.getMultipleAccounts(addresses);
      throw new Error('Expected rate limit error');
    } catch (error) {
      if (!error.message.includes('Too many requests')) {
        throw new Error(`Expected rate limit error, got: ${error.message}`);
      }
    }
  }
  
  const metrics = cbManager.getAllMetrics();
  const cbMetrics = metrics.circuitBreakers['rpc-getMultipleAccounts'];
  
  if (cbMetrics.state !== 'OPEN') {
    throw new Error(`Circuit should be OPEN after rate limits, was ${cbMetrics.state}`);
  }
  
  if (!cbMetrics.errorTypeBreakdown.infrastructure) {
    throw new Error('Rate limit errors should be classified as infrastructure');
  }
  
  cbManager.shutdown();
});

suite.test('Circuit breaker enforces request timeouts', async () => {
  const mockRPC = new MockRPCClient({ responseDelay: 3000 }); // 3s delay
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // getTokenAccountBalance has 2s timeout, should timeout
  const startTime = Date.now();
  
  try {
    await protectedRPC.getTokenAccountBalance('slow-address');
    throw new Error('Expected timeout error');
  } catch (error) {
    if (!error.message.includes('timeout')) {
      throw new Error(`Expected timeout error, got: ${error.message}`);
    }
  }
  
  const duration = Date.now() - startTime;
  if (duration > 2500) { // Allow some tolerance
    throw new Error(`Timeout should occur around 2000ms, took ${duration}ms`);
  }
  
  cbManager.shutdown();
});

// =============================================================================
// CASCADE FAILURE PREVENTION TESTS
// =============================================================================

suite.test('Circuit breaker prevents cascade failures', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'network', failureRate: 1.0 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // Simulate high-frequency requests during network outage
  const promises = [];
  
  for (let i = 0; i < 100; i++) {
    promises.push(
      protectedRPC.getTokenAccountBalance(`address-${i}`)
        .catch(error => ({ error: error.message }))
    );
  }
  
  const results = await Promise.all(promises);
  
  // Count how many were rejected by circuit breaker vs actual network calls
  let networkErrors = 0;
  let circuitRejections = 0;
  
  results.forEach(result => {
    if (result.error) {
      if (result.error.includes('is OPEN')) {
        circuitRejections++;
      } else if (result.error.includes('Connection refused')) {
        networkErrors++;
      }
    }
  });
  
  // Circuit should have opened quickly, preventing most network calls
  if (networkErrors > 10) {
    throw new Error(`Too many network calls made: ${networkErrors}. Circuit should prevent cascade.`);
  }
  
  if (circuitRejections < 80) {
    throw new Error(`Expected most requests to be circuit-rejected, only got ${circuitRejections}`);
  }
  
  console.log(`   Cascade Prevention: ${networkErrors} network calls, ${circuitRejections} circuit rejections`);
  
  cbManager.shutdown();
});

suite.test('System remains responsive during outage', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'timeout', failureRate: 1.0, responseDelay: 5000 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // First request will timeout and open circuit
  try {
    await protectedRPC.getTransaction('test-signature');
  } catch (error) {
    // Expected
  }
  
  // Subsequent requests should be rejected immediately
  const fastRequests = [];
  
  for (let i = 0; i < 10; i++) {
    const startTime = Date.now();
    fastRequests.push(
      protectedRPC.getTransaction(`fast-signature-${i}`)
        .catch(() => Date.now() - startTime)
    );
  }
  
  const responseTimes = await Promise.all(fastRequests);
  
  // All should be very fast (circuit rejection, not timeout)
  responseTimes.forEach((responseTime, index) => {
    if (responseTime > 100) {
      throw new Error(`Request ${index} took ${responseTime}ms, should be <100ms when circuit is open`);
    }
  });
  
  console.log(`   Responsiveness: Average response time ${responseTimes.reduce((a, b) => a + b) / responseTimes.length}ms`);
  
  cbManager.shutdown();
});

// =============================================================================
// RECOVERY AND RESILIENCE TESTS
// =============================================================================

suite.test('Circuit recovers after service restoration', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'network', failureRate: 1.0 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // Open circuit with failures
  for (let i = 0; i < 3; i++) {
    try {
      await protectedRPC.confirmTransaction(`fail-signature-${i}`);
    } catch (error) {
      // Expected
    }
  }
  
  let metrics = cbManager.getAllMetrics();
  if (metrics.circuitBreakers['rpc-confirmTransaction'].state !== 'OPEN') {
    throw new Error('Circuit should be OPEN');
  }
  
  // Fix the service
  mockRPC.setFailureMode('none', 0);
  
  // Wait for circuit timeout (confirmTransaction has 10s timeout, wait a bit longer for recovery)
  await IntegrationTestUtils.sleep(150);
  
  // Circuit should transition to half-open and then closed on success
  console.log('🔍 About to call confirmTransaction for recovery...');
  let result;
  try {
    result = await protectedRPC.confirmTransaction('recovery-signature');
    console.log('🔍 Recovery result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('🔍 Recovery call error:', error.message);
    console.error('🔍 Stack trace:', error.stack);
    throw error;
  }
  
  if (!result || !result.result) {
    throw new Error(`Expected successful response after recovery, got: ${JSON.stringify(result)}`);
  }
  
  metrics = cbManager.getAllMetrics();
  const finalState = metrics.circuitBreakers['rpc-confirmTransaction'].state;
  
  if (finalState !== 'CLOSED' && finalState !== 'HALF_OPEN') {
    throw new Error(`Circuit should be recovering, was ${finalState}`);
  }
  
  cbManager.shutdown();
});

suite.test('Multiple RPC methods have independent circuits', async () => {
  const mockRPC = new MockRPCClient({ failureMode: 'server_error', failureRate: 1.0 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // Fail only getTokenAccountBalance method (3 failures to open)
  for (let i = 0; i < 3; i++) {
    try {
      await protectedRPC.getTokenAccountBalance(`fail-address-${i}`);
    } catch (error) {
      // Expected
    }
  }
  
  const metrics = cbManager.getAllMetrics();
  
  if (metrics.circuitBreakers['rpc-getTokenAccountBalance'].state !== 'OPEN') {
    throw new Error('getTokenAccountBalance circuit should be OPEN');
  }
  
  // Other methods should still work (fix service first)
  mockRPC.setFailureMode('none', 0);
  
  const addresses = IntegrationTestUtils.generateMockAddresses(2);
  const result = await protectedRPC.getMultipleAccounts(addresses);
  
  if (!result.result) {
    throw new Error('getMultipleAccounts should still work');
  }
  
  // Confirm independent circuits
  if (metrics.circuitBreakers['rpc-getMultipleAccounts']) {
    const otherCircuitState = metrics.circuitBreakers['rpc-getMultipleAccounts'].state;
    if (otherCircuitState !== 'CLOSED') {
      throw new Error(`Other circuit should be CLOSED, was ${otherCircuitState}`);
    }
  }
  
  cbManager.shutdown();
});

// =============================================================================
// PERFORMANCE UNDER PROTECTION TESTS
// =============================================================================

suite.test('Circuit breaker adds minimal overhead', async () => {
  const mockRPC = new MockRPCClient({ responseDelay: 10 });
  const cbManager = new CircuitBreakerManager();
  const protectedRPC = new ProtectedRPCClient(mockRPC, cbManager);
  
  // Measure overhead
  const iterations = 100;
  const addresses = IntegrationTestUtils.generateMockAddresses(1);
  
  const startTime = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    await protectedRPC.getMultipleAccounts(addresses);
  }
  
  const endTime = process.hrtime.bigint();
  const totalTime = Number(endTime - startTime) / 1000000; // Convert to ms
  const avgTime = totalTime / iterations;
  
  // Should be close to mock delay (10ms) plus minimal overhead
  if (avgTime > 15) {
    throw new Error(`Average time should be ~10ms, was ${avgTime.toFixed(2)}ms`);
  }
  
  console.log(`   Performance: ${avgTime.toFixed(2)}ms average per protected call`);
  
  cbManager.shutdown();
});

// =============================================================================
// RUN INTEGRATION TESTS
// =============================================================================

export { suite as rpcIntegrationTestSuite };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  suite.run()
    .then(() => {
      console.log('🎉 ALL RPC INTEGRATION TESTS PASSED!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 RPC INTEGRATION TESTS FAILED!');
      console.error(error.message);
      process.exit(1);
    });
}