// src/tests/classification-integration.test.ts

import { ClassificationIntegrationService, TokenProcessingResult, AlertThresholdsConfig } from '../services/classification-integration.service';
import { TokenStatus } from '../services/classification-history.service';

/**
 * Unit tests for ClassificationIntegrationService
 * Tests the core classification logic and edge cases
 */
describe('ClassificationIntegrationService', () => {
  let service: ClassificationIntegrationService;
  let customThresholds: AlertThresholdsConfig;

  beforeEach(() => {
    customThresholds = {
      ultraPremium: 92,
      highConfidence: 85,
      smartMoney: 75,
      watchlistMinimum: 50
    };
    service = new ClassificationIntegrationService(customThresholds);
  });

  describe('determineInitialClassification', () => {
    
    test('should classify high confidence young token as fresh', () => {
      const result: TokenProcessingResult = createTestToken({
        edge_score: 87,
        age_minutes: 15
      });
      
      const classification = (service as any).determineInitialClassification(result);
      expect(classification).toBe('fresh');
    });

    test('should classify high confidence older token as established', () => {
      const result: TokenProcessingResult = createTestToken({
        edge_score: 87,
        age_minutes: 120 // 2 hours
      });
      
      const classification = (service as any).determineInitialClassification(result);
      expect(classification).toBe('established');
    });

    test('should classify high confidence very old token as watchlist', () => {
      const result: TokenProcessingResult = createTestToken({
        edge_score: 87,
        age_minutes: 1500 // > 24 hours
      });
      
      const classification = (service as any).determineInitialClassification(result);
      expect(classification).toBe('watchlist');
    });

    test('should classify medium confidence token as watchlist', () => {
      const result: TokenProcessingResult = createTestToken({
        edge_score: 78, // Between 75-84
        age_minutes: 60
      });
      
      const classification = (service as any).determineInitialClassification(result);
      expect(classification).toBe('watchlist');
    });

    test('should classify lower-medium confidence token as watchlist (FIX for 50-74 gap)', () => {
      const result: TokenProcessingResult = createTestToken({
        edge_score: 65, // Between 50-74 - this was the missing case
        age_minutes: 60
      });
      
      const classification = (service as any).determineInitialClassification(result);
      expect(classification).toBe('watchlist');
    });

    test('should classify very low confidence token as rejected', () => {
      const result: TokenProcessingResult = createTestToken({
        edge_score: 25, // < 30
        age_minutes: 60
      });
      
      const classification = (service as any).determineInitialClassification(result);
      expect(classification).toBe('rejected');
    });

    test('should classify low confidence token as unqualified', () => {
      const result: TokenProcessingResult = createTestToken({
        edge_score: 45, // 30-49 range
        age_minutes: 60
      });
      
      const classification = (service as any).determineInitialClassification(result);
      expect(classification).toBe('unqualified');
    });

    test('should handle edge case exactly at threshold boundaries', () => {
      // Test exact threshold values
      expect((service as any).determineInitialClassification(createTestToken({ edge_score: 85, age_minutes: 15 }))).toBe('fresh');
      expect((service as any).determineInitialClassification(createTestToken({ edge_score: 75, age_minutes: 15 }))).toBe('watchlist');
      expect((service as any).determineInitialClassification(createTestToken({ edge_score: 50, age_minutes: 15 }))).toBe('watchlist');
      expect((service as any).determineInitialClassification(createTestToken({ edge_score: 30, age_minutes: 15 }))).toBe('unqualified');
    });
  });

  describe('shouldSendAlert', () => {
    
    test('should send ultra-premium alert for high score fresh token', () => {
      const shouldAlert = (service as any).shouldSendAlert('fresh', 95, false);
      expect(shouldAlert).toBe(true);
    });

    test('should send high-confidence alert for established token', () => {
      const shouldAlert = (service as any).shouldSendAlert('established', 87, false);
      expect(shouldAlert).toBe(true);
    });

    test('should send smart-money alert for watchlist token', () => {
      const shouldAlert = (service as any).shouldSendAlert('watchlist', 78, false);
      expect(shouldAlert).toBe(true);
    });

    test('should not send alert if suppressed', () => {
      const shouldAlert = (service as any).shouldSendAlert('fresh', 95, true);
      expect(shouldAlert).toBe(false);
    });

    test('should not send alert for rejected tokens regardless of score', () => {
      const shouldAlert = (service as any).shouldSendAlert('rejected', 95, false);
      expect(shouldAlert).toBe(false);
    });

    test('should not send alert for low score watchlist token', () => {
      const shouldAlert = (service as any).shouldSendAlert('watchlist', 65, false);
      expect(shouldAlert).toBe(false);
    });
  });

  describe('validateTokenInput', () => {
    
    test('should pass validation for valid token', () => {
      const result = createTestToken({});
      const validation = (service as any).validateTokenInput(result);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should fail validation for missing token_address', () => {
      const result = createTestToken({ token_address: '' });
      const validation = (service as any).validateTokenInput(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('token_address is required');
    });

    test('should fail validation for invalid edge_score', () => {
      const result = createTestToken({ edge_score: NaN });
      const validation = (service as any).validateTokenInput(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('edge_score must be a valid number');
    });

    test('should fail validation for out-of-range edge_score', () => {
      const result = createTestToken({ edge_score: 150 });
      const validation = (service as any).validateTokenInput(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('edge_score must be between 0-100');
    });

    test('should fail validation for negative metrics', () => {
      const result = createTestToken({ 
        metrics: { 
          age_minutes: -5, 
          tx_count: -10, 
          holder_count: 5, 
          metadata_verified: true 
        } 
      });
      const validation = (service as any).validateTokenInput(result);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('age_minutes cannot be negative');
      expect(validation.errors).toContain('tx_count cannot be negative');
    });
  });

  describe('shouldUpdateClassification', () => {
    
    test('should update for initial classification', () => {
      const result = createTestToken({});
      const changeResult = (service as any).shouldUpdateClassification(null, result);
      
      expect(changeResult.hasChanged).toBe(true);
      expect(changeResult.reason).toBe('Initial classification');
    });

    test('should update for status change', () => {
      const existing = { current_status: 'watchlist', edge_score: 70 };
      const result = createTestToken({ edge_score: 87 }); // Would become 'fresh'
      
      const changeResult = (service as any).shouldUpdateClassification(existing, result);
      
      expect(changeResult.hasChanged).toBe(true);
      expect(changeResult.reason).toBe('Status change');
    });

    test('should update for significant score change', () => {
      const existing = { current_status: 'watchlist', edge_score: 70 };
      const result = createTestToken({ edge_score: 78 }); // 8 point increase, >5 threshold
      
      const changeResult = (service as any).shouldUpdateClassification(existing, result);
      
      expect(changeResult.hasChanged).toBe(true);
      expect(changeResult.reason).toBe('Significant score change');
    });

    test('should not update for minor score change', () => {
      const existing = { current_status: 'watchlist', edge_score: 70 };
      const result = createTestToken({ edge_score: 73 }); // 3 point increase, <5 threshold
      
      const changeResult = (service as any).shouldUpdateClassification(existing, result);
      
      expect(changeResult.hasChanged).toBe(false);
      expect(changeResult.reason).toBe('No material changes');
    });
  });

  describe('detectDataInconsistency', () => {
    
    test('should detect age regression', () => {
      const existing = { age_minutes: 120, tx_count: 50 };
      const result = createTestToken({ 
        metrics: { age_minutes: 60, tx_count: 55, holder_count: 20, metadata_verified: true } 
      });
      
      const inconsistent = (service as any).detectDataInconsistency(existing, result);
      expect(inconsistent).toBe(true);
    });

    test('should detect transaction count regression', () => {
      const existing = { age_minutes: 60, tx_count: 100 };
      const result = createTestToken({ 
        metrics: { age_minutes: 65, tx_count: 80, holder_count: 20, metadata_verified: true } 
      });
      
      const inconsistent = (service as any).detectDataInconsistency(existing, result);
      expect(inconsistent).toBe(true);
    });

    test('should allow minor variations within tolerance', () => {
      const existing = { age_minutes: 60, tx_count: 50 };
      const result = createTestToken({ 
        metrics: { age_minutes: 58, tx_count: 48, holder_count: 20, metadata_verified: true } 
      });
      
      const inconsistent = (service as any).detectDataInconsistency(existing, result);
      expect(inconsistent).toBe(false);
    });
  });

  describe('alert threshold configuration', () => {
    
    test('should use custom thresholds', () => {
      const customService = new ClassificationIntegrationService({
        ultraPremium: 95,
        highConfidence: 88,
        smartMoney: 80,
        watchlistMinimum: 60
      });
      
      const thresholds = customService.getAlertThresholds();
      expect(thresholds.ultraPremium).toBe(95);
      expect(thresholds.highConfidence).toBe(88);
      expect(thresholds.smartMoney).toBe(80);
      expect(thresholds.watchlistMinimum).toBe(60);
    });

    test('should update thresholds at runtime', () => {
      service.updateAlertThresholds({ ultraPremium: 94 });
      
      const thresholds = service.getAlertThresholds();
      expect(thresholds.ultraPremium).toBe(94);
      expect(thresholds.highConfidence).toBe(85); // Should remain unchanged
    });
  });
});

/**
 * Helper function to create test tokens with sensible defaults
 */
function createTestToken(overrides: Partial<TokenProcessingResult> = {}): TokenProcessingResult {
  return {
    token_address: 'TEST_TOKEN_123',
    edge_score: 75,
    classification: 'watchlist',
    reason: 'Test token',
    metrics: {
      age_minutes: 60,
      tx_count: 25,
      holder_count: 15,
      metadata_verified: true,
      volume_24h: 10000,
      liquidity_usd: 5000,
      smart_wallet_entries: 2
    },
    signals: {
      smart_wallet_activity: false,
      volume_spike: false,
      pattern_signal_spike: false
    },
    ...overrides,
    ...(overrides.metrics && {
      metrics: {
        age_minutes: 60,
        tx_count: 25,
        holder_count: 15,
        metadata_verified: true,
        volume_24h: 10000,
        liquidity_usd: 5000,
        smart_wallet_entries: 2,
        ...overrides.metrics
      }
    })
  };
}

/**
 * Integration test examples for manual verification
 */
export const integrationTestExamples = {
  
  freshGemExample: (): TokenProcessingResult => createTestToken({
    token_address: 'FRESH_GEM_TEST',
    edge_score: 89,
    reason: 'High confidence fresh gem',
    metrics: {
      age_minutes: 12,
      tx_count: 45,
      holder_count: 23,
      metadata_verified: true,
      volume_24h: 50000,
      smart_wallet_entries: 4
    },
    signals: {
      smart_wallet_activity: true,
      volume_spike: true,
      pattern_signal_spike: true
    }
  }),

  establishedTokenExample: (): TokenProcessingResult => createTestToken({
    token_address: 'ESTABLISHED_TEST',
    edge_score: 86,
    reason: 'Solid established token',
    metrics: {
      age_minutes: 240, // 4 hours
      tx_count: 180,
      holder_count: 67,
      metadata_verified: true,
      volume_24h: 150000,
      smart_wallet_entries: 6
    }
  }),

  lowConfidenceExample: (): TokenProcessingResult => createTestToken({
    token_address: 'LOW_CONFIDENCE_TEST',
    edge_score: 35,
    reason: 'Low confidence token',
    metrics: {
      age_minutes: 90,
      tx_count: 12,
      holder_count: 8,
      metadata_verified: false,
      volume_24h: 2000
    }
  })
};