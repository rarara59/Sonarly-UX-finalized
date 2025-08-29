// File: tests/system-integration.test.js
// System-level validation tests

import { SystemOrchestrator } from '../system/orchestrator.js';
import { componentFactory } from '../system/component-factory.js';
import { RpcConnectionPoolAdapter } from '../src/adapters/rpc-connection-pool.adapter.js';

export class SystemIntegrationTests {
  constructor() {
    this.logger = createStructuredLogger('SystemIntegrationTests');
    this.results = [];
  }

  /**
   * Run all system integration tests
   */
  async runAllTests() {
    const tests = [
      this.testComponentFactory,
      this.testSystemOrchestrator,
      this.testRealFakeSwitching,
      this.testHealthMonitoring,
      this.testGracefulShutdown
    ];

    this.logger.info('Starting system integration tests...');

    for (const test of tests) {
      try {
        await test.call(this);
        this.results.push({ test: test.name, status: 'PASS' });
      } catch (error) {
        this.results.push({ test: test.name, status: 'FAIL', error: error.message });
        this.logger.error(`Test failed: ${test.name}`, { error: error.message });
      }
    }

    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;

    this.logger.info('System integration tests complete', {
      total: this.results.length,
      passed: passCount,
      failed: failCount,
      results: this.results
    });

    return {
      success: failCount === 0,
      results: this.results
    };
  }

  /**
   * Test component factory creates components correctly
   */
  async testComponentFactory() {
    // Test fake component creation
    const fakeComponent = await componentFactory.create('rpc-connection-pool', { useFakes: true });
    const fakeResult = await fakeComponent.call('getSlot', []);
    
    if (!fakeResult || typeof fakeResult !== 'number') {
      throw new Error('Fake component does not return expected result');
    }

    // Test adapter interface
    const adapterComponent = await RpcConnectionPoolAdapter.createFake();
    const adapterResult = await adapterComponent.call('getSlot', []);
    
    if (!adapterResult || typeof adapterResult !== 'number') {
      throw new Error('Adapter component does not return expected result');
    }

    componentFactory.clear();
  }

  /**
   * Test system orchestrator lifecycle
   */
  async testSystemOrchestrator() {
    // Force fake mode for testing
    process.env.USE_FAKES = 'true';
    
    const orchestrator = new SystemOrchestrator();
    
    // Test startup
    const system = await orchestrator.startSystem();
    
    if (!system.components['rpc-connection-pool']) {
      throw new Error('RPC connection pool not started');
    }

    // Test status check
    const status = await orchestrator.getStatus();
    if (!status.started) {
      throw new Error('System reports as not started');
    }

    // Test component works through orchestrator
    const rpcPool = system.components['rpc-connection-pool'];
    const result = await rpcPool.call('getSlot', []);
    if (!result) {
      throw new Error('Component not working through orchestrator');
    }

    // Test shutdown
    await orchestrator.shutdown();
    
    const statusAfterShutdown = await orchestrator.getStatus();
    if (statusAfterShutdown.started) {
      throw new Error('System still reports as started after shutdown');
    }
  }

  /**
   * Test real/fake switching
   */
  async testRealFakeSwitching() {
    // Test fake creation
    const fakeComponent = await RpcConnectionPoolAdapter.createFake();
    const fakeStats = fakeComponent.getStats();
    
    if (fakeStats.type !== 'fake') {
      throw new Error('Fake component not properly identified');
    }

    // Test environment-based creation
    process.env.USE_FAKES = 'true';
    const envComponent = await RpcConnectionPoolAdapter.create();
    const envStats = envComponent.getStats();
    
    if (envStats.type !== 'fake') {
      throw new Error('Environment-based creation not working');
    }

    await fakeComponent.shutdown();
    await envComponent.shutdown();
  }

  /**
   * Test health monitoring system
   */
  async testHealthMonitoring() {
    process.env.USE_FAKES = 'true';
    
    const orchestrator = new SystemOrchestrator();
    const system = await orchestrator.startSystem();
    
    // Test health check
    const health = await orchestrator.healthMonitor.checkAll();
    
    if (!health['rpc-connection-pool'] || !health['rpc-connection-pool'].healthy) {
      throw new Error('Health monitoring not working correctly');
    }

    await orchestrator.shutdown();
  }

  /**
   * Test graceful shutdown
   */
  async testGracefulShutdown() {
    process.env.USE_FAKES = 'true';
    
    const orchestrator = new SystemOrchestrator();
    await orchestrator.startSystem();
    
    // Test multiple shutdown calls don't cause issues
    const shutdownPromise1 = orchestrator.shutdown();
    const shutdownPromise2 = orchestrator.shutdown();
    
    await Promise.all([shutdownPromise1, shutdownPromise2]);
    
    const status = await orchestrator.getStatus();
    if (status.started) {
      throw new Error('System not properly shut down');
    }
  }
}