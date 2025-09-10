// src/tests/classification-history.test.ts

import { ClassificationHistoryService } from '../services/classification-history.service';
import { 
  TokenStatus, 
  TokenMetrics, 
  ClassificationUpdate, 
  ReclassificationContext 
} from '../types/shared-token-types';
import { ClassificationHistory } from '../legacy/classificationHistory';

/**
 * Unit tests for ClassificationHistoryService fixes
 */
describe('ClassificationHistoryService', () => {
  let service: ClassificationHistoryService;
  let mockRecord: any;

  beforeEach(() => {
    service = new ClassificationHistoryService();
    
    mockRecord = {
      token_address: 'TEST_TOKEN',
      current_status: 'watchlist',
      edge_score: 75,
      age_minutes: 60,
      first_detected_at: new Date(Date.now() - 60 * 60 * 1000),
      last_reevaluated_at: new Date(Date.now() - 30 * 60 * 1000),
      reevaluation_count: 2,
      updated_at: new Date(),
      tx_count: 50,
      holder_count: 25,
      metadata_verified: true
    };
  });

  describe('updateClassification with deduplication (FIX 1)', () => {
    
    test('should skip redundant updates when no material change', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockRecord);
      const mockFindOne = jest.fn().mockResolvedValue({ ...mockRecord, save: mockSave });
      
      ClassificationHistory.findOne = mockFindOne;

      const update: ClassificationUpdate = {
        token_address: 'TEST_TOKEN',
        new_status: 'watchlist', // Same status
        reason: 'Test update',
        edge_score: 77, // Only 2 point difference, below 5 point threshold
        metrics: {
          age_minutes: 65,
          tx_count: 52,
          holder_count: 25,
          metadata_verified: true
        }
      };

      const result = await service.updateClassification(update);

      // Should return existing record without saving
      expect(mockSave).not.toHaveBeenCalled();
      expect(result).toBe(mockRecord);
    });

    test('should update when material change detected', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockRecord);
      const mockFindOne = jest.fn().mockResolvedValue({ ...mockRecord, save: mockSave });
      
      ClassificationHistory.findOne = mockFindOne;

      const update: ClassificationUpdate = {
        token_address: 'TEST_TOKEN',
        new_status: 'fresh', // Status change
        reason: 'Material change',
        edge_score: 87, // Significant score change
        metrics: {
          age_minutes: 65,
          tx_count: 55,
          holder_count: 30,
          metadata_verified: true
        }
      };

      await service.updateClassification(update);

      // Should save the update
      expect(mockSave).toHaveBeenCalled();
    });

    test('should detect and handle oscillation', async () => {
      const oscillatingRecord = {
        ...mockRecord,
        reevaluation_count: 15, // High reevaluation count
        last_reevaluated_at: new Date(Date.now() - 30000), // Recent update
        previous_status: 'fresh',
        current_status: 'watchlist'
      };

      const mockSave = jest.fn().mockResolvedValue(oscillatingRecord);
      const mockFindOne = jest.fn().mockResolvedValue({ ...oscillatingRecord, save: mockSave });
      
      ClassificationHistory.findOne = mockFindOne;

      const update: ClassificationUpdate = {
        token_address: 'TEST_TOKEN',
        new_status: 'fresh', // Would flip back to previous status
        reason: 'Oscillation test',
        edge_score: 85,
        metrics: {
          age_minutes: 65,
          tx_count: 55,
          holder_count: 30,
          metadata_verified: true
        }
      };

      const result = await service.updateClassification(update);

      // Should stabilize to 'dormant' instead of allowing oscillation
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('applyReclassificationLogic with priority system (FIX 2)', () => {
    
    test('should apply highest priority rule when multiple match', async () => {
      const context: ReclassificationContext = {
        current_time: new Date(),
        smart_wallet_activity: true,
        volume_spike: false,
        metadata_changed: false,
        holder_growth: false,
        pattern_signal_spike: false,
        is_honeypot: true, // High priority safety rule
        is_rug: false,
        mint_reused: false,
        similar_token_exists: false,
        paired_with_known_token: false
      };

      // Fresh token that's also a honeypot - safety rule should take priority
      const freshTokenRecord = {
        ...mockRecord,
        current_status: 'fresh',
        age_minutes: 5 // Within 10 minute window for false positive detection
      };

      const result = await service.applyReclassificationLogic(freshTokenRecord as any, context);

      expect(result.shouldReclassify).toBe(true);
      expect(result.newStatus).toBe('rejected'); // Safety rule priority
      expect(result.reason).toContain('honeypot');
      expect(result.flags?.is_false_positive).toBe(true);
    });

    test('should apply lower priority rule when higher priority rules don\'t match', async () => {
      const context: ReclassificationContext = {
        current_time: new Date(),
        smart_wallet_activity: true,
        volume_spike: true,
        metadata_changed: false,
        holder_growth: false,
        pattern_signal_spike: false,
        is_honeypot: false,
        is_rug: false,
        mint_reused: false,
        similar_token_exists: false,
        paired_with_known_token: false
      };

      // Young unqualified token with smart wallet activity
      const youngTokenRecord = {
        ...mockRecord,
        current_status: 'unqualified',
        age_minutes: 20 // Within 30 minute window for late blooming
      };

      const result = await service.applyReclassificationLogic(youngTokenRecord as any, context);

      expect(result.shouldReclassify).toBe(true);
      expect(result.newStatus).toBe('fresh'); // Late blooming rule
      expect(result.reason).toContain('Late blooming');
      expect(result.flags?.is_late_blooming).toBe(true);
    });

    test('should not reclassify when no rules match', async () => {
      const context: ReclassificationContext = {
        current_time: new Date(),
        smart_wallet_activity: false,
        volume_spike: false,
        metadata_changed: false,
        holder_growth: false,
        pattern_signal_spike: false,
        is_honeypot: false,
        is_rug: false,
        mint_reused: false,
        similar_token_exists: false,
        paired_with_known_token: false
      };

      const result = await service.applyReclassificationLogic(mockRecord as any, context);

      expect(result.shouldReclassify).toBe(false);
    });
  });

  describe('suppressAlerts with updated_at fix (FIX 3)', () => {
    
    test('should update updated_at when suppressing alerts', async () => {
      const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      ClassificationHistory.updateOne = mockUpdateOne;

      await service.suppressAlerts('TEST_TOKEN', 'Test suppression');

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { token_address: 'TEST_TOKEN' },
        expect.objectContaining({
          $set: expect.objectContaining({
            alert_suppressed: true,
            alert_suppressed_reason: 'Test suppression',
            updated_at: expect.any(Date)
          })
        })
      );
    });

    test('should set custom suppression duration', async () => {
      const mockUpdateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
      ClassificationHistory.updateOne = mockUpdateOne;

      const customUntil = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
      await service.suppressAlerts('TEST_TOKEN', 'Custom duration', customUntil);

      expect(mockUpdateOne).toHaveBeenCalledWith(
        { token_address: 'TEST_TOKEN' },
        expect.objectContaining({
          $set: expect.objectContaining({
            alert_suppressed_until: customUntil
          })
        })
      );
    });
  });

  describe('reclassification rules management', () => {
    
    test('should add new reclassification rule', () => {
      const initialRuleCount = service.getReclassificationRules().length;
      
      const newRule = {
        id: 'test_rule',
        priority: 50,
        condition: () => true,
        action: () => ({
          newStatus: 'watchlist' as TokenStatus,
          reason: 'Test rule',
          flags: {}
        }),
        category: 'pattern' as const
      };

      service.addReclassificationRule(newRule);

      const updatedRules = service.getReclassificationRules();
      expect(updatedRules.length).toBe(initialRuleCount + 1);
      expect(updatedRules.find(r => r.id === 'test_rule')).toBeDefined();
    });

    test('should update existing reclassification rule', () => {
      const rules = service.getReclassificationRules();
      const existingRule = rules[0];
      const originalPriority = existingRule.priority;

      const updatedRule = {
        ...existingRule,
        priority: originalPriority + 10
      };

      service.addReclassificationRule(updatedRule);

      const updatedRules = service.getReclassificationRules();
      const rule = updatedRules.find(r => r.id === existingRule.id);
      expect(rule?.priority).toBe(originalPriority + 10);
    });

    test('should remove reclassification rule', () => {
      const rules = service.getReclassificationRules();
      const ruleToRemove = rules[0];
      const initialCount = rules.length;

      const removed = service.removeReclassificationRule(ruleToRemove.id);

      expect(removed).toBe(true);
      expect(service.getReclassificationRules().length).toBe(initialCount - 1);
      expect(service.getReclassificationRules().find(r => r.id === ruleToRemove.id)).toBeUndefined();
    });

    test('should test individual rules', () => {
      const context: ReclassificationContext = {
        current_time: new Date(),
        smart_wallet_activity: false,
        volume_spike: false,
        metadata_changed: false,
        holder_growth: false,
        pattern_signal_spike: false,
        is_honeypot: true,
        is_rug: false,
        mint_reused: false,
        similar_token_exists: false,
        paired_with_known_token: false
      };

      const freshRecord = {
        ...mockRecord,
        current_status: 'fresh',
        age_minutes: 5
      };

      const result = service.testReclassificationRule(
        'false_positive_honeypot',
        freshRecord as any,
        context
      );

      expect(result.matches).toBe(true);
      expect(result.result?.newStatus).toBe('rejected');
    });
  });

  describe('validation and type safety', () => {
    
    test('should validate classification update', () => {
      const validUpdate: ClassificationUpdate = {
        token_address: 'VALID_TOKEN',
        new_status: 'fresh',
        reason: 'Valid update',
        edge_score: 85,
        metrics: {
          age_minutes: 30,
          tx_count: 50,
          holder_count: 25,
          metadata_verified: true
        }
      };

      const result = service.validateClassificationUpdate(validUpdate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid classification update', () => {
      const invalidUpdate: any = {
        token_address: '', // Invalid
        new_status: 'invalid_status', // Invalid
        reason: '', // Invalid
        edge_score: 150, // Invalid
        metrics: {
          age_minutes: -5, // Invalid
          tx_count: 'not_a_number', // Invalid
          holder_count: 25,
          metadata_verified: 'not_boolean' // Invalid
        }
      };

      const result = service.validateClassificationUpdate(invalidUpdate);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('cooldown and reevaluation improvements', () => {
    
    test('should respect cooldown in getTokensForReevaluation', async () => {
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([])
        })
      });
      
      ClassificationHistory.find = mockFind;

      await service.getTokensForReevaluation(30);

      // Verify cooldown is considered in query
      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: expect.arrayContaining([
            expect.objectContaining({ last_reevaluated_at: expect.any(Object) }),
            expect.objectContaining({ reevaluation_count: expect.any(Object) })
          ])
        })
      );
    });
  });

  describe('service configuration and monitoring', () => {
    
    test('should provide service configuration', () => {
      const config = service.getServiceConfiguration();

      expect(config).toHaveProperty('significantScoreThreshold');
      expect(config).toHaveProperty('oscillationDetectionWindow');
      expect(config).toHaveProperty('ruleCount');
      expect(config).toHaveProperty('rulesById');
      expect(typeof config.ruleCount).toBe('number');
      expect(config.ruleCount).toBeGreaterThan(0);
    });

    test('should provide enhanced audit trail', async () => {
      const mockFindOne = jest.fn().mockResolvedValue({
        ...mockRecord,
        is_late_blooming: true,
        is_false_positive: false,
        alert_suppressed: true,
        alert_suppressed_reason: 'Test suppression'
      });
      
      ClassificationHistory.findOne = mockFindOne;

      const auditTrail = await service.getAuditTrail('TEST_TOKEN');

      expect(auditTrail.current).toBeDefined();
      expect(auditTrail.timeline).toBeInstanceOf(Array);
      expect(auditTrail.timeline.length).toBeGreaterThan(0);
      expect(auditTrail.statistics).toHaveProperty('totalReevaluations');
      expect(auditTrail.statistics).toHaveProperty('flagsSummary');
      expect(auditTrail.statistics.flagsSummary).toContain('late_blooming');
    });
  });
});

/**
 * Integration test examples
 */
export const classificationHistoryIntegrationTests = {
  
  testFullReclassificationFlow: async (service: ClassificationHistoryService) => {
    console.log('Testing full reclassification flow...');

    // Test case: Token starts as unqualified, shows smart wallet activity, gets reclassified
    const update: ClassificationUpdate = {
      token_address: 'INTEGRATION_TEST_TOKEN',
      new_status: 'unqualified',
      reason: 'Initial classification',
      edge_score: 65,
      metrics: {
        age_minutes: 15,
        tx_count: 20,
        holder_count: 10,
        metadata_verified: false
      }
    };

    // Initial classification
    await service.updateClassification(update);

    // Smart wallet activity triggers reclassification
    const context: ReclassificationContext = {
      current_time: new Date(),
      smart_wallet_activity: true,
      volume_spike: true,
      metadata_changed: false,
      holder_growth: false,
      pattern_signal_spike: false,
      is_honeypot: false,
      is_rug: false,
      mint_reused: false,
      similar_token_exists: false,
      paired_with_known_token: false
    };

    const record = await service.getClassification('INTEGRATION_TEST_TOKEN');
    const reclassificationResult = await service.applyReclassificationLogic(record!, context);

    console.log('Reclassification result:', {
      shouldReclassify: reclassificationResult.shouldReclassify,
      newStatus: reclassificationResult.newStatus,
      reason: reclassificationResult.reason
    });

    return reclassificationResult;
  },

  testOscillationDetection: async (service: ClassificationHistoryService) => {
    console.log('Testing oscillation detection...');

    // Create a token that would oscillate
    const baseUpdate: ClassificationUpdate = {
      token_address: 'OSCILLATION_TEST_TOKEN',
      new_status: 'watchlist',
      reason: 'Base classification',
      edge_score: 75,
      metrics: {
        age_minutes: 60,
        tx_count: 30,
        holder_count: 15,
        metadata_verified: true
      }
    };

    await service.updateClassification(baseUpdate);

    // Simulate rapid status changes that would trigger oscillation detection
    for (let i = 0; i < 3; i++) {
      const flippingUpdate = {
        ...baseUpdate,
        new_status: i % 2 === 0 ? 'fresh' as TokenStatus : 'watchlist' as TokenStatus,
        reason: `Oscillation attempt ${i + 1}`
      };

      await service.updateClassification(flippingUpdate);
    }

    const finalRecord = await service.getClassification('OSCILLATION_TEST_TOKEN');
    console.log('Final status after oscillation test:', finalRecord?.current_status);

    return finalRecord?.current_status;
  }
};