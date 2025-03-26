// src/services/thorp-integration-service.ts

import patternRecognitionService from './pattern-recognition-service';
import riskManagementService from './risk-management-service';
import edgeCalculatorService from './edge-calculator-service';
import smartMoneyService from './smart-money-detection';
import marketDataService from './market-data-service';

// Import enhanced services
import EnhancedPatternRecognitionService from './enhanced-pattern-recognition';
import EnhancedRiskManagementService from './enhanced-risk-management';
import { getRiskManagerModule } from './risk-manager-module';

// Import types
import { PatternType, PatternStatus, TimeframeType } from '../types/pattern-types';
import { TradeStatus, PositionSizeStrategy } from '../types/trade-types';
import { EdgeStatus, ConfidenceLevel } from '../types/edge-types';

// Import logging utilities
import winston from 'winston';
import config from '../config';

/**
 * Thorp V1 Integration Service
 * 
 * This service orchestrates the flow between:
 * 1. Smart Money Detection
 * 2. Enhanced Pattern Recognition (with manipulation detection)
 * 3. Edge Calculation
 * 4. Risk Management Module (with volatility-based position sizing)
 * 5. Execution Planning
 */
class ThorpV1IntegrationService {
  private logger: winston.Logger;
  private enhancedPatternRecognition: any;
  private enhancedRiskManagement: any;
  private riskManagerModule: any;
  
  constructor() {
    // Initialize logger
    this.logger = winston.createLogger({
      level: config.logging.level || 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'thorp-v1-integration' },
      transports: [
        new winston.transports.File({ filename: config.logging.file.error, level: 'error' }),
        new winston.transports.File({ filename: config.logging.file.combined }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
    
    // Initialize enhanced services
    this.enhancedPatternRecognition = new EnhancedPatternRecognitionService(patternRecognitionService);
    this.enhancedRiskManagement = new EnhancedRiskManagementService(riskManagementService);
    
    // Initialize the risk manager module
    this.riskManagerModule = getRiskManagerModule(
      riskManagementService,
      this.enhancedRiskManagement
    );
  }
  
  /**
   * Initialize the integration service
   */
  async init(): Promise<boolean> {
    try {
      // Initialize all dependent services
      await patternRecognitionService.init();
      await riskManagementService.init();
      await this.enhancedPatternRecognition.init();
      await this.enhancedRiskManagement.init();
      
      this.logger.info('Thorp V1 Integration service initialized');
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize Thorp V1 Integration service:', error);
      return false;
    }
  }
  
  /**
   * Process token for pattern detection, edge calculation, and risk management
   * This is the main workflow for Thorp V1
   */
  async processToken(
    token: { address: string; network: string; symbol: string }
  ): Promise<{
    patterns: any;
    edge: any;
    trade: any;
    manipulationDetected: boolean;
    smartMoneyActive: boolean;
  }> {
    try {
      this.logger.info(`Processing token: ${token.symbol} (${token.address}) on ${token.network}`);
      
      // Step 1: Check for smart money activity
      const smartMoneyActivity = await smartMoneyService.getActivityForToken(token.address, token.network);
      const smartMoneyActive = smartMoneyActivity?.active || false;
      
      this.logger.info(`Smart money active for ${token.symbol}: ${smartMoneyActive}`);
      
      // Step 2: Run enhanced pattern detection with manipulation checks
      const fastPatternsResult = await this.enhancedPatternRecognition.detectPatternsWithManipulationCheck(
        token,
        TimeframeType.FAST
      );
      
      const slowPatternsResult = await this.enhancedPatternRecognition.detectPatternsWithManipulationCheck(
        token,
        TimeframeType.SLOW
      );
      
      // Step 3: Correlate patterns across timeframes for higher confidence
      const correlations = await this.enhancedPatternRecognition.correlateTimeframePatterns(token);
      
      // Step 4: Get aggregated pattern statistics
      const patternStats = await this.enhancedPatternRecognition.getAggregatedPatternStats(
        token.address,
        token.network
      );
      
      // Check if there's significant manipulation detected
      const manipulationDetected = fastPatternsResult.manipulationDetected || slowPatternsResult.manipulationDetected;
      
      if (manipulationDetected) {
        this.logger.warn(`Manipulation detected in ${token.symbol}: ${patternStats.manipulationType} (${patternStats.manipulationConfidence?.toFixed(1)}%)`);
      }
      
      // If we have patterns and no severe manipulation, proceed with edge calculation
      let edge = null;
      let trade = null;
      
      if (patternStats.patternCount > 0 && 
          (!manipulationDetected || patternStats.manipulationConfidence! < 90)) {
        
        // Step 5: Calculate edge based on patterns and smart money
        edge = await edgeCalculatorService.calculateEdge(
          token.address,
          token.network,
          {
            patternConfidence: patternStats.aggregatedConfidence || 0,
            smartMoneyActivity: smartMoneyActive ? 1 : 0,
            manipulationRisk: manipulationDetected ? patternStats.manipulationConfidence! / 100 : 0
          }
        );
        
        // Step 6: If edge is positive, evaluate trade with risk manager module
        if (edge && edge.status === EdgeStatus.CALCULATED && edge.confidenceScore >= 60) {
          // Use the risk manager module which integrates both basic and enhanced risk management
          trade = await this.riskManagerModule.evaluateEdgeWithRiskManagement(
            edge._id, 
            manipulationDetected ? { 
              detected: true,
              type: patternStats.manipulationType,
              confidence: patternStats.manipulationConfidence
            } : null
          );
          
          if (trade) {
            this.logger.info(`Generated trade for ${token.symbol} with position size $${trade.positionSizeUSD.toFixed(2)}`);
          } else {
            this.logger.info(`No trade generated for ${token.symbol} after risk evaluation`);
          }
        } else {
          this.logger.info(`No edge or insufficient confidence for ${token.symbol}`);
        }
      } else {
        this.logger.info(`No patterns or severe manipulation detected for ${token.symbol}`);
      }
      
      return {
        patterns: {
          fast: fastPatternsResult.patterns,
          slow: slowPatternsResult.patterns,
          correlations,
          stats: patternStats
        },
        edge,
        trade,
        manipulationDetected,
        smartMoneyActive
      };
    } catch (error) {
      this.logger.error(`Error processing token ${token.symbol}:`, error);
      return {
        patterns: null,
        edge: null,
        trade: null,
        manipulationDetected: false,
        smartMoneyActive: false
      };
    }
  }
  
  /**
   * Run a scan for all tokens in watchlist
   */
  async runTokenScan(): Promise<{
    tokensProcessed: number;
    patternsDetected: number;
    edgesCalculated: number;
    tradesGenerated: number;
    manipulationDetected: number;
  }> {
    try {
      // Get list of tokens to scan
      const tokens = await this.getTokensToScan();
      
      let stats = {
        tokensProcessed: 0,
        patternsDetected: 0,
        edgesCalculated: 0,
        tradesGenerated: 0,
        manipulationDetected: 0
      };
      
      for (const token of tokens) {
        try {
          const result = await this.processToken(token);
          
          // Update statistics
          stats.tokensProcessed++;
          
          if (result.patterns.stats.patternCount > 0) {
            stats.patternsDetected++;
          }
          
          if (result.edge) {
            stats.edgesCalculated++;
          }
          
          if (result.trade) {
            stats.tradesGenerated++;
          }
          
          if (result.manipulationDetected) {
            stats.manipulationDetected++;
          }
        } catch (error) {
          this.logger.error(`Error processing token ${token.symbol}:`, error);
        }
      }
      
      this.logger.info(`Scan completed: Processed ${stats.tokensProcessed} tokens, found ${stats.patternsDetected} patterns, calculated ${stats.edgesCalculated} edges, generated ${stats.tradesGenerated} trades`);
      
      return stats;
    } catch (error) {
      this.logger.error('Error running token scan:', error);
      return {
        tokensProcessed: 0,
        patternsDetected: 0,
        edgesCalculated: 0,
        tradesGenerated: 0,
        manipulationDetected: 0
      };
    }
  }
  
  // Get tokens to scan - in production this would connect to your discovery or watchlist system
  private async getTokensToScan(): Promise<{ address: string; network: string; symbol: string }[]> {
    // Mock implementation - in production, get from database or API
    return [
      { address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', network: 'ethereum', symbol: 'UNI' },
      { address: '0x514910771af9ca656af840dff83e8264ecf986ca', network: 'ethereum', symbol: 'LINK' },
      { address: '0x6b175474e89094c44da98b954eedeac495271d0f', network: 'ethereum', symbol: 'DAI' }
    ];
  }
}

// Export a singleton instance
export default new ThorpV1IntegrationService();