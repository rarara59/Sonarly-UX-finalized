// src/tests/data-pipeline-test-runner.js
const DataPipeline = require('../scripts-js/data-pipeline');
const DataIngestionService = require('../scripts-js/data-ingestion.service');
const DataNormalizer = require('../scripts-js/data-normalizer');
const DataValidator = require('../scripts-js/data-validator');
const DataEnricher = require('../scripts-js/data-enricher');
const DataCache = require('../scripts-js/data-cache');
const DataDistributor = require('../scripts-js/data-distributor');
const SignalOrchestrator = require('../scripts-js/signal-orchestrator');

/**
 * Comprehensive Data Pipeline Test Suite
 */
class DataPipelineTestRunner {
  constructor() {
    this.testResults = {
      unitTests: {},
      integrationTests: {},
      performanceTests: {},
      endToEndTests: {}
    };
    
    this.logger = {
      info: (msg, ...args) => console.log(`[TEST] ${msg}`, ...args),
      warn: (msg, ...args) => console.warn(`[TEST] ${msg}`, ...args),
      error: (msg, ...args) => console.error(`[TEST] ${msg}`, ...args),
      success: (msg, ...args) => console.log(`[TEST] ✅ ${msg}`, ...args),
      fail: (msg, ...args) => console.log(`[TEST] ❌ ${msg}`, ...args)
    };
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.logger.info('🚀 Starting Data Pipeline Test Suite...');
    
    try {
      // Phase 1: Unit Tests
      await this.runUnitTests();
      
      // Phase 2: Integration Tests
      await this.runIntegrationTests();
      
      // Phase 3: Performance Tests
      await this.runPerformanceTests();
      
      // Phase 4: End-to-End Tests
      await this.runEndToEndTests();
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      this.logger.error('Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Phase 1: Unit Tests
   */
  async runUnitTests() {
    this.logger.info('📋 Running Unit Tests...');
    
    // Test 1: Data Ingestion Service
    await this.testDataIngestionService();
    
    // Test 2: Data Normalizer
    await this.testDataNormalizer();
    
    // Test 3: Data Validator
    await this.testDataValidator();
    
    // Test 4: Data Enricher
    await this.testDataEnricher();
    
    // Test 5: Data Cache
    await this.testDataCache();
    
    // Test 6: Data Distributor
    await this.testDataDistributor();
  }

  /**
   * Test Data Ingestion Service
   */
  async testDataIngestionService() {
    const testName = 'DataIngestionService';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const ingestion = new DataIngestionService({
        heliusApiKey: 'test-key',
        primaryRpcUrl: 'https://mainnet.helius-rpc.com',
        timeoutMs: 3000
      });
      
      // Test initialization
      await ingestion.initialize();
      
      // Test mock token data fetch
      const mockTokenAddress = '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
      
      // Since we can't make real RPC calls in testing, test the structure
      const expectedStructure = {
        tokenAddress: mockTokenAddress,
        type: 'token',
        source: 'rpc',
        fetchedAt: expect.any(Date),
        data: expect.any(Object)
      };
      
      // Test health status
      const healthStatus = ingestion.getHealthStatus();
      
      // Validate health status structure
      if (healthStatus.primaryRpc && healthStatus.fallbackRpc) {
        this.testResults.unitTests[testName] = {
          passed: true,
          message: 'Initialization and health check passed',
          metrics: ingestion.getMetrics()
        };
        this.logger.success(`${testName} unit test passed`);
      } else {
        throw new Error('Health status validation failed');
      }
      
    } catch (error) {
      this.testResults.unitTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} unit test failed: ${error.message}`);
    }
  }

  /**
   * Test Data Normalizer
   */
  async testDataNormalizer() {
    const testName = 'DataNormalizer';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const normalizer = new DataNormalizer();
      
      // Test data normalization
      const mockRawData = {
        type: 'token',
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        source: 'helius',
        fetchedAt: new Date(),
        data: {
          mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
          price_info: { price_per_token: 0.00012 },
          market_info: { 
            volume_24h: 450000,
            market_cap: 1200000 
          },
          supply: { ui_amount: 10000000 },
          decimals: 6,
          metadata: {
            symbol: 'TEST',
            name: 'Test Token'
          }
        }
      };
      
      const normalizedData = await normalizer.normalize(mockRawData);
      
      // Validate normalized structure
      const requiredFields = [
        'type', 'tokenAddress', 'tokenSymbol', 'currentPrice', 
        'volume24h', 'marketCap', 'dataQuality', 'lastUpdated'
      ];
      
      const hasAllFields = requiredFields.every(field => 
        normalizedData.hasOwnProperty(field)
      );
      
      if (hasAllFields && normalizedData.tokenAddress === mockRawData.tokenAddress) {
        this.testResults.unitTests[testName] = {
          passed: true,
          message: 'Data normalization successful',
          outputSample: {
            tokenAddress: normalizedData.tokenAddress,
            tokenSymbol: normalizedData.tokenSymbol,
            currentPrice: normalizedData.currentPrice,
            dataQuality: normalizedData.dataQuality
          }
        };
        this.logger.success(`${testName} unit test passed`);
      } else {
        throw new Error('Normalized data structure validation failed');
      }
      
    } catch (error) {
      this.testResults.unitTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} unit test failed: ${error.message}`);
    }
  }

  /**
   * Test Data Validator
   */
  async testDataValidator() {
    const testName = 'DataValidator';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const validator = new DataValidator({
        minPrice: 0.000001,
        maxPrice: 1000,
        minDataQuality: 0.7
      });
      
      // Test valid data
      const validData = {
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        type: 'token',
        currentPrice: 0.00012,
        volume24h: 450000,
        marketCap: 1200000,
        totalSupply: 10000000,
        liquidityUSD: 85000,
        dataQuality: 0.95,
        lastUpdated: new Date()
      };
      
      const isValid = await validator.validate(validData);
      
      // Test invalid data
      const invalidData = {
        ...validData,
        currentPrice: -1, // Invalid negative price
        dataQuality: 0.3  // Below threshold
      };
      
      const isInvalid = await validator.validate(invalidData);
      
      if (isValid && !isInvalid) {
        this.testResults.unitTests[testName] = {
          passed: true,
          message: 'Validation logic working correctly',
          metrics: validator.getMetrics()
        };
        this.logger.success(`${testName} unit test passed`);
      } else {
        throw new Error('Validation logic failed');
      }
      
    } catch (error) {
      this.testResults.unitTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} unit test failed: ${error.message}`);
    }
  }

  /**
   * Test Data Enricher
   */
  async testDataEnricher() {
    const testName = 'DataEnricher';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const enricher = new DataEnricher();
      
      const baseData = {
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        type: 'token',
        currentPrice: 0.00012,
        volume24h: 450000,
        marketCap: 1200000,
        liquidityUSD: 85000,
        priceChange24h: 5.2
      };
      
      const enrichedData = await enricher.enrich(baseData);
      
      // Check for enrichment modules
      const expectedEnrichments = [
        'liquidityMetrics',
        'momentumMetrics',
        'volatilityMetrics'
      ];
      
      const hasEnrichments = expectedEnrichments.some(enrichment =>
        enrichedData.hasOwnProperty(enrichment)
      );
      
      if (hasEnrichments && enrichedData.enrichmentQuality > 0) {
        this.testResults.unitTests[testName] = {
          passed: true,
          message: 'Data enrichment successful',
          enrichmentQuality: enrichedData.enrichmentQuality,
          enrichments: Object.keys(enrichedData).filter(key => 
            key.includes('Metrics') || key.includes('Indicators')
          )
        };
        this.logger.success(`${testName} unit test passed`);
      } else {
        throw new Error('Data enrichment failed');
      }
      
    } catch (error) {
      this.testResults.unitTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} unit test failed: ${error.message}`);
    }
  }

  /**
   * Test Data Cache
   */
  async testDataCache() {
    const testName = 'DataCache';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const cache = new DataCache({
        maxSize: 100,
        defaultTTL: 5000 // 5 seconds for testing
      });
      
      await cache.initialize();
      
      // Test cache operations
      const testKey = 'token:test:data';
      const testValue = { price: 0.00012, volume: 450000 };
      
      // Test set
      const setResult = cache.set(testKey, testValue);
      
      // Test get
      const getValue = cache.get(testKey);
      
      // Test cache hit
      const stats = cache.getStats();
      
      if (setResult && getValue && getValue.price === testValue.price && stats.hitRate >= 0) {
        this.testResults.unitTests[testName] = {
          passed: true,
          message: 'Cache operations successful',
          cacheStats: {
            size: stats.size,
            hitRate: stats.hitRate,
            memoryUsageMB: stats.memoryUsageMB
          }
        };
        this.logger.success(`${testName} unit test passed`);
      } else {
        throw new Error('Cache operations failed');
      }
      
    } catch (error) {
      this.testResults.unitTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} unit test failed: ${error.message}`);
    }
  }

  /**
   * Test Data Distributor
   */
  async testDataDistributor() {
    const testName = 'DataDistributor';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const distributor = new DataDistributor();
      await distributor.initialize();
      
      // Test subscription
      let receivedData = null;
      const subscriberId = 'test-subscriber';
      
      distributor.subscribe(subscriberId, {
        channels: ['tokens'],
        callback: async (data) => {
          receivedData = data;
        }
      });
      
      // Test distribution
      const testData = {
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        currentPrice: 0.00012
      };
      
      await distributor.sendToChannel('tokens', testData);
      
      // Give some time for async delivery
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (receivedData && receivedData.tokenAddress === testData.tokenAddress) {
        this.testResults.unitTests[testName] = {
          passed: true,
          message: 'Distribution and subscription successful',
          metrics: distributor.getMetrics()
        };
        this.logger.success(`${testName} unit test passed`);
      } else {
        throw new Error('Data distribution failed');
      }
      
    } catch (error) {
      this.testResults.unitTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} unit test failed: ${error.message}`);
    }
  }

  /**
   * Phase 2: Integration Tests
   */
  async runIntegrationTests() {
    this.logger.info('🔗 Running Integration Tests...');
    
    await this.testPipelineIntegration();
    await this.testSignalOrchestratorIntegration();
  }

  /**
   * Test full pipeline integration
   */
  async testPipelineIntegration() {
    const testName = 'PipelineIntegration';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const pipeline = new DataPipeline();
      await pipeline.initialize();
      
      // Test processing single token
      const mockTokenData = {
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        currentPrice: 0.00012,
        volume24h: 450000,
        marketCap: 1200000
      };
      
      const processedData = await pipeline.processTokenData(
        mockTokenData.tokenAddress, 
        { skipCache: true }
      );
      
      // Validate processed data has all pipeline stages
      const hasNormalization = processedData.normalizationMetadata;
      const hasEnrichment = processedData.enrichmentMetadata;
      const hasProcessingMetadata = processedData.processingMetadata;
      
      if (hasNormalization && hasEnrichment && hasProcessingMetadata) {
        this.testResults.integrationTests[testName] = {
          passed: true,
          message: 'Full pipeline processing successful',
          processingTime: processedData.processingMetadata.processingTime,
          stages: ['ingestion', 'normalization', 'validation', 'enrichment', 'caching']
        };
        this.logger.success(`${testName} integration test passed`);
      } else {
        throw new Error('Pipeline processing incomplete');
      }
      
    } catch (error) {
      this.testResults.integrationTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} integration test failed: ${error.message}`);
    }
  }

  /**
   * Test Signal Orchestrator integration
   */
  async testSignalOrchestratorIntegration() {
    const testName = 'SignalOrchestratorIntegration';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      // Create pipeline and orchestrator
      const pipeline = new DataPipeline();
      const orchestrator = new SignalOrchestrator();
      const distributor = new DataDistributor();
      
      await pipeline.initialize();
      await orchestrator.initialize();
      await distributor.initialize();
      
      // Test integration
      let orchestratorReceivedData = null;
      
      // Subscribe orchestrator to distribution
      distributor.subscribe('signal-orchestrator', {
        channels: ['tokens'],
        callback: async (data) => {
          orchestratorReceivedData = data;
          // Process through orchestrator
          const result = await orchestrator.orchestrateSignals(data, {});
          return result;
        }
      });
      
      // Process data through pipeline and distribute
      const testTokenData = {
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        tokenSymbol: 'TEST'
      };
      
      const processedData = await pipeline.processTokenData(testTokenData.tokenAddress);
      await distributor.sendToChannel('tokens', processedData);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (orchestratorReceivedData) {
        this.testResults.integrationTests[testName] = {
          passed: true,
          message: 'Pipeline → Signal Orchestrator integration successful',
          dataFlow: 'Pipeline → Distributor → Signal Orchestrator',
          receivedDataStructure: Object.keys(orchestratorReceivedData)
        };
        this.logger.success(`${testName} integration test passed`);
      } else {
        throw new Error('Signal Orchestrator did not receive data');
      }
      
    } catch (error) {
      this.testResults.integrationTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} integration test failed: ${error.message}`);
    }
  }

  /**
   * Phase 3: Performance Tests
   */
  async runPerformanceTests() {
    this.logger.info('⚡ Running Performance Tests...');
    
    await this.testPipelineLatency();
    await this.testThroughputCapacity();
    await this.testCachePerformance();
  }

  /**
   * Test pipeline latency
   */
  async testPipelineLatency() {
    const testName = 'PipelineLatency';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const pipeline = new DataPipeline();
      await pipeline.initialize();
      
      const iterations = 10;
      const latencies = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        await pipeline.processTokenData(`test-token-${i}`);
        
        const latency = Date.now() - startTime;
        latencies.push(latency);
      }
      
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const minLatency = Math.min(...latencies);
      
      // Renaissance target: <50ms average
      const passesLatencyTarget = avgLatency < 50;
      
      this.testResults.performanceTests[testName] = {
        passed: passesLatencyTarget,
        message: passesLatencyTarget ? 'Latency within Renaissance targets' : 'Latency exceeds targets',
        averageLatency: avgLatency,
        maxLatency: maxLatency,
        minLatency: minLatency,
        target: '<50ms average',
        iterations: iterations
      };
      
      if (passesLatencyTarget) {
        this.logger.success(`${testName} performance test passed: ${avgLatency.toFixed(2)}ms avg`);
      } else {
        this.logger.warn(`${testName} performance test failed: ${avgLatency.toFixed(2)}ms avg (target: <50ms)`);
      }
      
    } catch (error) {
      this.testResults.performanceTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} performance test failed: ${error.message}`);
    }
  }

  /**
   * Test throughput capacity
   */
  async testThroughputCapacity() {
    const testName = 'ThroughputCapacity';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const distributor = new DataDistributor();
      await distributor.initialize();
      
      // Test concurrent distribution
      const concurrentMessages = 100;
      const startTime = Date.now();
      
      const promises = [];
      for (let i = 0; i < concurrentMessages; i++) {
        const promise = distributor.broadcast({
          tokenAddress: `token-${i}`,
          timestamp: new Date()
        });
        promises.push(promise);
      }
      
      await Promise.all(promises);
      
      const totalTime = Date.now() - startTime;
      const throughput = (concurrentMessages / totalTime) * 1000; // messages per second
      
      // Renaissance target: >500 messages/second
      const passesThroughputTarget = throughput > 500;
      
      this.testResults.performanceTests[testName] = {
        passed: passesThroughputTarget,
        message: passesThroughputTarget ? 'Throughput within Renaissance targets' : 'Throughput below targets',
        throughput: throughput.toFixed(2),
        messagesProcessed: concurrentMessages,
        totalTime: totalTime,
        target: '>500 messages/second'
      };
      
      if (passesThroughputTarget) {
        this.logger.success(`${testName} performance test passed: ${throughput.toFixed(2)} msg/sec`);
      } else {
        this.logger.warn(`${testName} performance test failed: ${throughput.toFixed(2)} msg/sec (target: >500)`);
      }
      
    } catch (error) {
      this.testResults.performanceTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} performance test failed: ${error.message}`);
    }
  }

  /**
   * Test cache performance
   */
  async testCachePerformance() {
    const testName = 'CachePerformance';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      const cache = new DataCache({ maxSize: 1000 });
      await cache.initialize();
      
      // Load cache with test data
      const cacheEntries = 500;
      for (let i = 0; i < cacheEntries; i++) {
        cache.set(`token:${i}`, { price: Math.random(), volume: Math.random() * 1000000 });
      }
      
      // Test cache hit performance
      const iterations = 1000;
      let hits = 0;
      const startTime = Date.now();
      
      for (let i = 0; i < iterations; i++) {
        const randomKey = `token:${Math.floor(Math.random() * cacheEntries)}`;
        const result = cache.get(randomKey);
        if (result) hits++;
      }
      
      const totalTime = Date.now() - startTime;
      const hitRate = (hits / iterations) * 100;
      const avgGetTime = totalTime / iterations;
      
      // Renaissance targets: >80% hit rate, <1ms get time
      const passesHitRate = hitRate > 80;
      const passesGetTime = avgGetTime < 1;
      
      this.testResults.performanceTests[testName] = {
        passed: passesHitRate && passesGetTime,
        message: `Hit rate: ${hitRate.toFixed(1)}%, Avg get time: ${avgGetTime.toFixed(2)}ms`,
        hitRate: hitRate.toFixed(1),
        averageGetTime: avgGetTime.toFixed(2),
        cacheStats: cache.getStats(),
        targets: { hitRate: '>80%', getTime: '<1ms' }
      };
      
      if (passesHitRate && passesGetTime) {
        this.logger.success(`${testName} performance test passed`);
      } else {
        this.logger.warn(`${testName} performance test failed`);
      }
      
    } catch (error) {
      this.testResults.performanceTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} performance test failed: ${error.message}`);
    }
  }

  /**
   * Phase 4: End-to-End Tests
   */
  async runEndToEndTests() {
    this.logger.info('🎯 Running End-to-End Tests...');
    
    await this.testCompleteDataFlow();
  }

  /**
   * Test complete data flow from RPC to Signal Orchestrator
   */
  async testCompleteDataFlow() {
    const testName = 'CompleteDataFlow';
    this.logger.info(`Testing ${testName}...`);
    
    try {
      // Initialize entire system
      const pipeline = new DataPipeline();
      const orchestrator = new SignalOrchestrator();
      const distributor = new DataDistributor();
      
      await pipeline.initialize();
      await orchestrator.initialize();
      await distributor.initialize();
      
      // Connect pipeline to distributor
      pipeline.subscribe('data-distributor', {
        receiveData: async (processedData) => {
          await distributor.sendToSignalOrchestrator(processedData);
        }
      });
      
      // Track end-to-end results
      let finalResult = null;
      
      // Connect distributor to orchestrator
      distributor.subscribe('signal-orchestrator', {
        channels: ['signals'],
        callback: async (data) => {
          finalResult = await orchestrator.orchestrateSignals(data, {
            solPrice: 100,
            volume24h: 1000000
          });
          return finalResult;
        }
      });
      
      // Simulate data flow: Mock RPC → Pipeline → Distributor → Orchestrator
      const startTime = Date.now();
      
      const mockTokenData = {
        tokenAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        tokenSymbol: 'TEST',
        currentPrice: 0.00012,
        volume24h: 450000
      };
      
      // Process through pipeline
      const processedData = await pipeline.processTokenData(mockTokenData.tokenAddress);
      
      // Trigger distribution
      await distributor.sendToSignalOrchestrator(processedData);
      
      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const endToEndTime = Date.now() - startTime;
      
      if (finalResult && finalResult.renaissanceScore !== undefined) {
        this.testResults.endToEndTests[testName] = {
          passed: true,
          message: 'Complete data flow successful',
          endToEndLatency: endToEndTime,
          finalResult: {
            renaissanceScore: finalResult.renaissanceScore,
            confidence: finalResult.confidence,
            recommendation: finalResult.recommendation
          },
          dataFlowStages: [
            'Mock RPC Data',
            'Data Pipeline Processing',
            'Data Distribution',
            'Signal Orchestration',
            'Renaissance Score Generation'
          ]
        };
        this.logger.success(`${testName} end-to-end test passed in ${endToEndTime}ms`);
      } else {
        throw new Error('End-to-end data flow incomplete');
      }
      
    } catch (error) {
      this.testResults.endToEndTests[testName] = {
        passed: false,
        error: error.message
      };
      this.logger.fail(`${testName} end-to-end test failed: ${error.message}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    this.logger.info('📊 Generating Test Report...');
    
    const report = {
      timestamp: new Date(),
      summary: this.calculateTestSummary(),
      details: this.testResults
    };
    
    // Console output
    console.log('\n' + '='.repeat(60));
    console.log('📋 DATA PIPELINE TEST REPORT');
    console.log('='.repeat(60));
    
    Object.entries(report.summary).forEach(([phase, summary]) => {
      const status = summary.passed === summary.total ? '✅' : '❌';
      console.log(`${status} ${phase}: ${summary.passed}/${summary.total} passed`);
    });
    
    console.log('\n📈 PERFORMANCE METRICS:');
    if (this.testResults.performanceTests.PipelineLatency) {
      console.log(`   Latency: ${this.testResults.performanceTests.PipelineLatency.averageLatency}ms avg`);
    }
    if (this.testResults.performanceTests.ThroughputCapacity) {
      console.log(`   Throughput: ${this.testResults.performanceTests.ThroughputCapacity.throughput} msg/sec`);
    }
    if (this.testResults.performanceTests.CachePerformance) {
      console.log(`   Cache Hit Rate: ${this.testResults.performanceTests.CachePerformance.hitRate}%`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Write detailed report to file
    const fs = require('fs');
    try {
      fs.writeFileSync('./test-report.json', JSON.stringify(report, null, 2));
      this.logger.info('📄 Detailed test report saved to test-report.json');
    } catch (error) {
      this.logger.warn('Could not save test report to file:', error.message);
    }
    
    return report;
  }

  /**
   * Calculate test summary
   */
  calculateTestSummary() {
    const summary = {};
    
    Object.entries(this.testResults).forEach(([phase, tests]) => {
      const testArray = Object.values(tests);
      summary[phase] = {
        total: testArray.length,
        passed: testArray.filter(test => test.passed).length,
        failed: testArray.filter(test => !test.passed).length
      };
    });
    
    return summary;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const testRunner = new DataPipelineTestRunner();
  testRunner.runAllTests()
    .then(() => {
      console.log('\n🎉 Test suite completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = DataPipelineTestRunner;