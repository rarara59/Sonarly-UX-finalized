// src/tests/reclassification-scheduler.test.ts

import { ReclassificationSchedulerService, ReclassificationEvent } from '../services/reclassification-scheduler.service';
import { ClassificationHistoryService } from '../services/classification-history.service';

/**
 * Unit tests for ReclassificationSchedulerService
 * Tests the core scheduling logic, queue management, and edge cases
 */
describe('ReclassificationSchedulerService', () => {
  let scheduler: ReclassificationSchedulerService;
  let mockClassificationService: jest.Mocked<ClassificationHistoryService>;
  let mockEdgeScoreRefresh: jest.Mock;

  beforeEach(() => {
    // Mock the classification service
    mockClassificationService = {
      getClassification: jest.fn(),
      updateClassification: jest.fn(),
      applyReclassificationLogic: jest.fn()
    } as any;

    // Mock edge score refresh function
    mockEdgeScoreRefresh = jest.fn().mockResolvedValue(85);

    // Create scheduler with mocked dependencies
    scheduler = new ReclassificationSchedulerService(mockEdgeScoreRefresh);
    (scheduler as any).classificationService = mockClassificationService;
  });

  afterEach(async () => {
    if (scheduler.getStatus().isRunning) {
      await scheduler.stop();
    }
  });

  describe('Event Queue Management', () => {
    
    test('should add events to queue with deduplication', () => {
      const event: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(),
        data: {}
      };

      scheduler.addEvent(event);
      scheduler.addEvent(event); // Duplicate - should be ignored

      const status = scheduler.getStatus();
      expect(status.queueLength).toBe(1);
    });

    test('should handle queue overflow', () => {
      const maxQueue = (scheduler as any).MAX_QUEUE_LENGTH;
      
      // Fill queue beyond capacity
      for (let i = 0; i < maxQueue + 50; i++) {
        scheduler.addEvent({
          type: 'volume_spike',
          token_address: `TOKEN_${i}`,
          timestamp: new Date(),
          data: {}
        });
      }

      const status = scheduler.getStatus();
      expect(status.queueLength).toBeLessThan(maxQueue);
      expect(status.queueCapacity).toBeLessThan(100);
    });

    test('should deduplicate events within time window', () => {
      const baseTime = Date.now();
      
      const event1: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(baseTime),
        data: {}
      };

      const event2: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN', 
        timestamp: new Date(baseTime + 30000), // 30 seconds later - within window
        data: {}
      };

      scheduler.addEvent(event1);
      scheduler.addEvent(event2);

      expect(scheduler.getStatus().queueLength).toBe(1);
    });

    test('should allow events outside deduplication window', () => {
      const baseTime = Date.now();
      
      const event1: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(baseTime),
        data: {}
      };

      const event2: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(baseTime + 120000), // 2 minutes later - outside window
        data: {}
      };

      scheduler.addEvent(event1);
      scheduler.addEvent(event2);

      expect(scheduler.getStatus().queueLength).toBe(2);
    });
  });

  describe('Flag Validation and Application', () => {
    
    test('should validate and sanitize flags correctly', () => {
      const validFlags = {
        is_late_blooming: true,
        is_echo: false,
        invalid_flag: 'should_be_ignored',
        another_invalid: 123
      };

      const sanitized = (scheduler as any).validateAndSanitizeFlags(validFlags);
      
      expect(sanitized).toEqual({
        is_late_blooming: true,
        is_echo: false
      });
      expect(sanitized.invalid_flag).toBeUndefined();
      expect(sanitized.another_invalid).toBeUndefined();
    });

    test('should handle invalid flags input', () => {
      const testCases = [null, undefined, 'string', 123, []];
      
      testCases.forEach(testCase => {
        const sanitized = (scheduler as any).validateAndSanitizeFlags(testCase);
        expect(sanitized).toEqual({});
      });
    });

    test('should apply flags without corrupting token data', async () => {
      const mockRecord = {
        current_status: 'fresh',
        edge_score: 87,
        tx_count: 50,
        holder_count: 25,
        metadata_verified: true,
        volume_24h: 100000,
        first_detected_at: new Date(Date.now() - 10000)
      };

      mockClassificationService.getClassification.mockResolvedValue(mockRecord as any);
      mockClassificationService.updateClassification.mockResolvedValue({} as any);

      await (scheduler as any).applyReclassificationFlags('TEST_TOKEN', {
        is_late_blooming: true
      });

      expect(mockClassificationService.updateClassification).toHaveBeenCalledWith(
        expect.objectContaining({
          new_status: 'fresh', // Should preserve original status
          edge_score: 87, // Should preserve original score
          tx_count: 50, // Should preserve original count
          holder_count: 25, // Should preserve original count
          is_late_blooming: true // Should apply the flag
        })
      );
    });
  });

  describe('Edge Score Refresh', () => {
    
    test('should refresh edge score when function provided', async () => {
      const mockRecord = {
        current_status: 'watchlist',
        edge_score: 70,
        first_detected_at: new Date(Date.now() - 600000), // 10 minutes ago
        last_reevaluated_at: new Date(Date.now() - 600000)
      };

      const mockResult = {
        shouldReclassify: true,
        newStatus: 'fresh',
        reason: 'Score improved'
      };

      mockClassificationService.getClassification.mockResolvedValue(mockRecord as any);
      mockClassificationService.applyReclassificationLogic.mockResolvedValue(mockResult as any);
      mockClassificationService.updateClassification.mockResolvedValue({} as any);
      mockEdgeScoreRefresh.mockResolvedValue(88);

      const event: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(),
        data: {}
      };

      await (scheduler as any).processEvent(event);

      expect(mockEdgeScoreRefresh).toHaveBeenCalledWith('TEST_TOKEN');
      expect(mockClassificationService.updateClassification).toHaveBeenCalledWith(
        expect.objectContaining({
          edge_score: 88 // Should use refreshed score
        })
      );
    });

    test('should use original score when refresh returns null', async () => {
      const mockRecord = {
        current_status: 'watchlist',
        edge_score: 70,
        first_detected_at: new Date(Date.now() - 600000),
        last_reevaluated_at: new Date(Date.now() - 600000)
      };

      mockClassificationService.getClassification.mockResolvedValue(mockRecord as any);
      mockClassificationService.applyReclassificationLogic.mockResolvedValue({
        shouldReclassify: true,
        newStatus: 'fresh',
        reason: 'Test'
      } as any);
      mockEdgeScoreRefresh.mockResolvedValue(null);

      const event: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(),
        data: {}
      };

      await (scheduler as any).processEvent(event);

      expect(mockClassificationService.updateClassification).toHaveBeenCalledWith(
        expect.objectContaining({
          edge_score: 70 // Should use original score
        })
      );
    });
  });

  describe('Cooldown Logic', () => {
    
    test('should respect cooldown period', async () => {
      const recentTime = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
      const mockRecord = {
        current_status: 'watchlist',
        last_reevaluated_at: recentTime
      };

      mockClassificationService.getClassification.mockResolvedValue(mockRecord as any);

      const event: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(),
        data: {}
      };

      await (scheduler as any).processEvent(event);

      // Should not proceed with reclassification due to cooldown
      expect(mockClassificationService.applyReclassificationLogic).not.toHaveBeenCalled();
    });

    test('should allow reclassification after cooldown period', async () => {
      const oldTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
      const mockRecord = {
        current_status: 'watchlist',
        edge_score: 70,
        first_detected_at: new Date(Date.now() - 3600000),
        last_reevaluated_at: oldTime
      };

      mockClassificationService.getClassification.mockResolvedValue(mockRecord as any);
      mockClassificationService.applyReclassificationLogic.mockResolvedValue({
        shouldReclassify: false
      } as any);

      const event: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'TEST_TOKEN',
        timestamp: new Date(),
        data: {}
      };

      await (scheduler as any).processEvent(event);

      // Should proceed with reclassification logic
      expect(mockClassificationService.applyReclassificationLogic).toHaveBeenCalled();
    });
  });

  describe('Missing Record Handling', () => {
    
    test('should warn when processing event for missing token', async () => {
      mockClassificationService.getClassification.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const event: ReclassificationEvent = {
        type: 'smart_wallet_entry',
        token_address: 'MISSING_TOKEN',
        timestamp: new Date(),
        data: {}
      };

      await (scheduler as any).processEvent(event);

      // Should not proceed with reclassification
      expect(mockClassificationService.applyReclassificationLogic).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    test('should warn when reevaluating missing token', async () => {
      mockClassificationService.getClassification.mockResolvedValue(null);

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await (scheduler as any).reevaluateToken('MISSING_TOKEN', 'fast');

      // Should not proceed with reclassification
      expect(mockClassificationService.applyReclassificationLogic).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Status and Health Monitoring', () => {
    
    test('should provide comprehensive status information', () => {
      scheduler.addEvent({
        type: 'volume_spike',
        token_address: 'TEST',
        timestamp: new Date(),
        data: {}
      });

      const status = scheduler.getStatus();

      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('queueLength');
      expect(status).toHaveProperty('queueCapacity');
      expect(status).toHaveProperty('deduplicationSize');
      expect(status).toHaveProperty('jobHeartbeats');
      expect(status).toHaveProperty('configuration');
      
      expect(status.queueLength).toBe(1);
      expect(typeof status.queueCapacity).toBe('number');
      expect(typeof status.configuration.maxQueueLength).toBe('number');
    });

    test('should track job heartbeats', async () => {
      // Start scheduler to initialize jobs
      await scheduler.start();
      
      // Wait a bit for jobs to be scheduled
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = scheduler.getStatus();
      
      expect(Object.keys(status.jobHeartbeats).length).toBeGreaterThan(0);
      
      // Each job should have heartbeat info
      Object.values(status.jobHeartbeats).forEach(heartbeat => {
        expect(heartbeat).toHaveProperty('lastSeen');
        expect(heartbeat).toHaveProperty('healthy');
        expect(typeof heartbeat.healthy).toBe('boolean');
      });
    });

    test('should allow forced cleanup', () => {
      // Fill queue with some events
      for (let i = 0; i < 100; i++) {
        scheduler.addEvent({
          type: 'volume_spike',
          token_address: `TOKEN_${i}`,
          timestamp: new Date(),
          data: {}
        });
      }

      const statusBefore = scheduler.getStatus();
      expect(statusBefore.queueLength).toBe(100);

      scheduler.forceCleanup();

      const statusAfter = scheduler.getStatus();
      expect(statusAfter.queueLength).toBeLessThan(statusBefore.queueLength);
      expect(statusAfter.deduplicationSize).toBe(0);
    });
  });
});

/**
 * Integration test examples for scheduler service
 */
export const schedulerIntegrationTests = {
  
  testEventProcessingFlow: async (scheduler: ReclassificationSchedulerService) => {
    console.log('Testing complete event processing flow...');
    
    const events: ReclassificationEvent[] = [
      {
        type: 'smart_wallet_entry',
        token_address: 'INTEGRATION_TEST_1',
        timestamp: new Date(),
        data: { smart_wallet_count: 3 }
      },
      {
        type: 'volume_spike',
        token_address: 'INTEGRATION_TEST_2', 
        timestamp: new Date(),
        data: { volume_increase: 250 }
      },
      {
        type: 'metadata_change',
        token_address: 'INTEGRATION_TEST_3',
        timestamp: new Date(),
        data: { metadata_verified: true }
      }
    ];

    // Add events
    events.forEach(event => scheduler.addEvent(event));
    
    // Check status
    const status = scheduler.getStatus();
    console.log('Event queue status:', {
      queueLength: status.queueLength,
      queueCapacity: status.queueCapacity,
      deduplicationSize: status.deduplicationSize
    });

    return status;
  },

  testSchedulerResilience: async (scheduler: ReclassificationSchedulerService) => {
    console.log('Testing scheduler resilience...');

    // Test queue overflow
    for (let i = 0; i < 1500; i++) {
      scheduler.addEvent({
        type: 'tx_surge',
        token_address: `STRESS_TEST_${i}`,
        timestamp: new Date(),
        data: {}
      });
    }

    // Test forced cleanup
    scheduler.forceCleanup();

    const status = scheduler.getStatus();
    console.log('Resilience test results:', {
      queueLength: status.queueLength,
      isHealthy: status.queueLength < status.configuration.maxQueueLength
    });

    return status;
  }
};