// src/services/smart-money-integration.ts

import { logger } from '../utils/logger';
import ExternalWallet, { IExternalWallet } from '../models/externalWallet';
import { getRiskManagerModule } from './risk-manager-module';
import riskManagementService from './risk-management-service';
import EnhancedRiskManagementService from './enhanced-risk-management';
import { getAlphaStreamScraper } from '../legacy/alpha-stream-scraper';

interface SmartMoneySignal {
  tokenAddress: string;
  network: string;
  symbol: string;
  confidence: number;
  walletCategory: string;
  timeframe: 'fast' | 'slow' | 'both'; 
  signalStrength: number;
  detectTime: Date;
  activeSince: Date;
  walletCount: number;
  topWallets: string[];
  averageMultiplier: number;
  predictedMultiplier: number;
  expectedSuccess: number;
}

interface TokenActivitySummary {
  tokenAddress: string;
  network: string;
  symbol: string;
  totalWallets: number;
  activeWallets: number;
  sniperWallets: number;
  gemSpotterWallets: number;
  earlyMoverWallets: number;
  avgEntryPrice: number;
  latestActivity: Date;
  is4xCandidate: boolean;
  predictedSuccessRate: number;
}

/**
 * Smart Money Integration Service
 * 
 * This service integrates the Alpha Stream wallet data with the risk management system
 * to improve edge detection and success rates for meme coins
 */
export class SmartMoneyIntegrationService {
  private riskManager: any;
  private enhancedRiskService: EnhancedRiskManagementService;
  private activeSignals: Map<string, SmartMoneySignal> = new Map();
  
  constructor() {
    this.enhancedRiskService = new EnhancedRiskManagementService(riskManagementService);
    this.riskManager = getRiskManagerModule(riskManagementService, this.enhancedRiskService);
  }
  
  /**
   * Initialize the service
   */
  async init(): Promise<boolean> {
    try {
      await this.enhancedRiskService.init();
      logger.info('Smart Money Integration Service initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Smart Money Integration Service:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  
  /**
   * Get activity data for a specific token
   * This is used by the edge calculator to factor in smart money movements
   */
  async getActivityForToken(tokenAddress: string, network: string): Promise<TokenActivitySummary | null> {
    try {
      // Find wallets that have transacted with this token
      const wallets = await ExternalWallet.find({
        'transactions.tokenAddress': tokenAddress,
        network: network
      });
      
      if (!wallets || wallets.length === 0) {
        return null;
      }
      
      // Calculate wallet category counts
      const sniperWallets = wallets.filter(w => w.category === 'Sniper').length;
      const gemSpotterWallets = wallets.filter(w => w.category === 'Gem Spotter').length;
      const earlyMoverWallets = wallets.filter(w => w.category === 'Early Mover').length;
      
      // Find transactions for this token
      const transactions = wallets.flatMap(wallet => 
        wallet.transactions.filter(tx => tx.tokenAddress === tokenAddress)
      );
      
      if (transactions.length === 0) {
        return null;
      }
      
      // Get the token symbol from transactions
      const symbol = transactions[0].tokenSymbol;
      
      // Calculate average entry price
      const totalEntryValue = transactions.reduce((sum, tx) => sum + tx.buyPrice, 0);
      const avgEntryPrice = totalEntryValue / transactions.length;
      
      // Determine latest activity
      const latestActivityTime = Math.max(...transactions.map(tx => 
        tx.sellTimestamp ? new Date(tx.sellTimestamp).getTime() : new Date(tx.buyTimestamp).getTime()
      ));
      
      // Calculate active wallets (traded in the last 48 hours)
      const now = Date.now();
      const activeThreshold = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
      const activeWallets = wallets.filter(wallet => {
        // Check if wallet has recent transactions for this token
        return wallet.transactions.some(tx => 
          tx.tokenAddress === tokenAddress && 
          (now - new Date(tx.buyTimestamp).getTime() <= activeThreshold || 
           (tx.sellTimestamp && now - new Date(tx.sellTimestamp).getTime() <= activeThreshold))
        );
      }).length;
      
      // Calculate predicted success rate based on wallet quality
      const highQualityCount = wallets.filter(w => w.reputationScore >= 70).length;
      const mediumQualityCount = wallets.filter(w => w.reputationScore >= 50 && w.reputationScore < 70).length;
      
      // Weight-based prediction (high quality wallets have more influence)
      const predictedSuccessRate = wallets.length > 0 ? 
        ((highQualityCount * 0.8) + (mediumQualityCount * 0.5) + ((wallets.length - highQualityCount - mediumQualityCount) * 0.3)) / wallets.length * 100 : 0;
      
      // Check if this is a good 4x candidate
      // This is key for meeting our 4x minimum return target
      const is4xCandidate = this.assess4xPotential(wallets, transactions);
      
      return {
        tokenAddress,
        network,
        symbol,
        totalWallets: wallets.length,
        activeWallets,
        sniperWallets,
        gemSpotterWallets,
        earlyMoverWallets,
        avgEntryPrice,
        latestActivity: new Date(latestActivityTime),
        is4xCandidate,
        predictedSuccessRate
      };
    } catch (error) {
      logger.error(`Error getting activity for token ${tokenAddress}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }
  
  /**
   * Assess if a token has 4x potential based on wallet data
   * This is critical for achieving our target 4x minimum return
   */
  private assess4xPotential(wallets: IExternalWallet[], transactions: any[]): boolean {
    // Check if high-quality wallets with good 4x history are involved
    const highQualityWallets = wallets.filter(wallet => {
      // Check if this wallet has a history of achieving 4x returns
      return wallet.metadata?.achieves4xScore >= 40 && wallet.reputationScore >= 75;
    });
    
    // If we have at least 2 high quality wallets, that's a good sign
    if (highQualityWallets.length >= 2) {
      return true;
    }
    
    // Check if we have any wallets with extremely good 4x history
    const superWallets = wallets.filter(wallet => wallet.metadata?.achieves4xScore >= 60);
    if (superWallets.length > 0) {
      return true;
    }
    
    // Check transaction metrics for signs of 4x potential
    const recentTransactions = transactions.filter(tx => {
      const txTime = new Date(tx.buyTimestamp).getTime();
      const now = Date.now();
      return now - txTime < 7 * 24 * 60 * 60 * 1000; // Last 7 days
    });
    
    if (recentTransactions.length >= 5) {
      // If we have multiple recent transactions, this token is actively being traded
      // Check if any of them are already showing good gains
      const highGainTxs = recentTransactions.filter(tx => tx.pnlPercentage >= 100);
      if (highGainTxs.length >= 2) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Detect new smart money signals by analyzing wallet activity
   * This is the core function that identifies promising meme coin opportunities
   */
  async detectNewSignals(): Promise<SmartMoneySignal[]> {
    try {
      // Get high quality wallets with good meme coin performance
      const highQualityWallets = await ExternalWallet.find({
        winRate: { $gte: 70 },
        reputationScore: { $gte: 75 },
        'metadata.memeTokenStats.successRate': { $gte: 60 },
        'metadata.achieves4xScore': { $gte: 30 } // At least 30% of trades achieve 4x
      }).limit(50);
      
      // Extract recent transactions (last 48 hours)
      const now = Date.now();
      const recentThreshold = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
      
      const recentTransactions = highQualityWallets.flatMap(wallet => 
        wallet.transactions
          .filter(tx => now - new Date(tx.buyTimestamp).getTime() <= recentThreshold)
          .map(tx => ({
            ...tx,
            walletAddress: wallet.address,
            walletCategory: wallet.category,
            walletReputation: wallet.reputationScore,
            wallet4xScore: wallet.metadata?.achieves4xScore || 0
          }))
      );
      
      // Group by token address to identify clusters of smart money activity
      const tokenGroups = this.groupByToken(recentTransactions);
      
      // Process each token group to identify signals
      const signals: SmartMoneySignal[] = [];
      
      for (const [tokenKey, transactions] of Object.entries(tokenGroups)) {
        // Skip if not enough wallets are involved
        if (transactions.length < 3) continue;
        
        // Get unique wallets involved
        const uniqueWallets = [...new Set(transactions.map(tx => tx.walletAddress))];
        if (uniqueWallets.length < 2) continue;
        
        // Extract token info from first transaction
        const [tokenAddress, network] = tokenKey.split('|');
        const symbol = transactions[0].tokenSymbol;
        
        // Determine timeframe classification based on transaction patterns
        const fastTimeframeTxs = transactions.filter(tx => tx.timeframe === 'fast');
        const slowTimeframeTxs = transactions.filter(tx => tx.timeframe === 'slow');
        
        let timeframe: 'fast' | 'slow' | 'both' = 'both';
        if (fastTimeframeTxs.length >= 3 && slowTimeframeTxs.length < 2) {
          timeframe = 'fast';
        } else if (slowTimeframeTxs.length >= 3 && fastTimeframeTxs.length < 2) {
          timeframe = 'slow';
        }
        
        // Calculate signal confidence
        const confidence = this.calculateSignalConfidence(
          transactions, 
          uniqueWallets.length, 
          highQualityWallets.filter(w => uniqueWallets.includes(w.address))
        );
        
        // Calculate signal strength
        const signalStrength = this.calculateSignalStrength(transactions, uniqueWallets);
        
        // Determine earliest and latest activity
        const earliestTime = Math.min(...transactions.map(tx => new Date(tx.buyTimestamp).getTime()));
        const latestTime = Math.max(...transactions.map(tx => new Date(tx.buyTimestamp).getTime()));
        
        // Calculate average multiplier from successful transactions of these wallets
        const sucessTxs = highQualityWallets
          .filter(w => uniqueWallets.includes(w.address))
          .flatMap(w => w.transactions.filter(tx => tx.isSuccessful && tx.multiplier > 0));
        
        const avgMultiplier = sucessTxs.length > 0 
          ? sucessTxs.reduce((sum, tx) => sum + tx.multiplier, 0) / sucessTxs.length
          : 0;
        
        // Calculate predicted multiplier based on historical performance
        // This is key for targeting our 4x minimum return goal
        const predictedMultiplier = this.calculatePredictedMultiplier(
          transactions,
          highQualityWallets.filter(w => uniqueWallets.includes(w.address))
        );
        
        // Calculate expected success rate
        const expectedSuccess = this.calculateExpectedSuccessRate(
          transactions,
          highQualityWallets.filter(w => uniqueWallets.includes(w.address))
        );
        
        // Create signal
        const signal: SmartMoneySignal = {
          tokenAddress,
          network,
          symbol,
          confidence,
          walletCategory: this.determineTopCategory(transactions),
          timeframe,
          signalStrength,
          detectTime: new Date(),
          activeSince: new Date(earliestTime),
          walletCount: uniqueWallets.length,
          topWallets: uniqueWallets,
          averageMultiplier: avgMultiplier,
          predictedMultiplier,
          expectedSuccess
        };
        
        // Add to signals if it meets our threshold
        if (confidence >= 70 && predictedMultiplier >= 3.5) {
          signals.push(signal);
          
          // Update active signals map
          this.activeSignals.set(`${tokenAddress}|${network}`, signal);
        }
      }
      
      return signals;
    } catch (error) {
      logger.error('Error detecting smart money signals:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
  
  /**
   * Group transactions by token
   */
  private groupByToken(transactions: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    for (const tx of transactions) {
      const key = `${tx.tokenAddress}|${tx.chain || 'solana'}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(tx);
    }
    
    return groups;
  }
  
  /**
   * Calculate signal confidence based on wallet quality and transaction patterns
   */
  private calculateSignalConfidence(
    transactions: any[], 
    walletCount: number,
    qualityWallets: IExternalWallet[]
  ): number {
    // Base confidence from wallet count (more wallets = higher confidence)
    let confidence = Math.min(100, walletCount * 10);
    
    // Adjust based on wallet quality
    const avgReputation = qualityWallets.reduce((sum, w) => sum + w.reputationScore, 0) / qualityWallets.length;
    confidence = (confidence + avgReputation) / 2;
    
    // Adjust based on 4x achievement scores
    const avg4xScore = qualityWallets.reduce((sum, w) => sum + (w.metadata?.achieves4xScore || 0), 0) / qualityWallets.length;
    confidence = (confidence * 0.7) + (avg4xScore * 0.3);
    
    // Adjust based on transaction recency (more recent = higher confidence)
    const now = Date.now();
    const avgTimeDiff = transactions.reduce((sum, tx) => sum + (now - new Date(tx.buyTimestamp).getTime()), 0) / transactions.length;
    const recencyFactor = Math.max(0.8, 1 - (avgTimeDiff / (48 * 60 * 60 * 1000))); // 48 hour scale
    
    confidence *= recencyFactor;
    
    return Math.min(100, Math.round(confidence));
  }
  
  /**
   * Calculate signal strength (1-10 scale)
   */
  private calculateSignalStrength(transactions: any[], uniqueWallets: string[]): number {
    // Base strength on wallet count
    const walletCountStrength = Math.min(5, uniqueWallets.length / 2);
    
    // Adjust based on transaction volume
    const txCountStrength = Math.min(3, transactions.length / 5);
    
    // Adjust based on transaction timing
    // If transactions are clustered closely, that's a stronger signal
    const buyTimes = transactions.map(tx => new Date(tx.buyTimestamp).getTime());
    const timeSpan = Math.max(...buyTimes) - Math.min(...buyTimes);
    
    // Stronger if happened in a short time window
    const timeStrength = timeSpan < 6 * 60 * 60 * 1000 ? 2 : // 6 hours
                         timeSpan < 12 * 60 * 60 * 1000 ? 1.5 : // 12 hours
                         1;
    
    return Math.min(10, Math.round(walletCountStrength + txCountStrength + timeStrength));
  }
  
  /**
   * Calculate predicted multiplier based on wallet history
   * This is critical for achieving our 4x minimum return target
   */
  private calculatePredictedMultiplier(transactions: any[], qualityWallets: IExternalWallet[]): number {
    // Base multiplier prediction on wallet's historical performance
    const walletMultipliers = qualityWallets.map(wallet => {
      // Get wallet's average multiplier from meme token stats
      const memeMultiplier = wallet.metadata?.memeTokenStats?.avgMultiplier || 0;
      
      // Use specific timeframe metrics if available
      const fastMultiplier = wallet.metadata?.fastTimeframeStats?.avgMultiplier || 0;
      const slowMultiplier = wallet.metadata?.slowTimeframeStats?.avgMultiplier || 0;
      
      // Determine which one to use based on most transactions
      const fastTxsCount = transactions.filter(tx => tx.timeframe === 'fast' && tx.walletAddress === wallet.address).length;
      const slowTxsCount = transactions.filter(tx => tx.timeframe === 'slow' && tx.walletAddress === wallet.address).length;
      
      if (fastTxsCount > slowTxsCount && fastMultiplier > 0) {
        return fastMultiplier;
      } else if (slowTxsCount > fastTxsCount && slowMultiplier > 0) {
        return slowMultiplier;
      } else {
        return memeMultiplier;
      }
    });
    
    // Calculate weighted average based on reputation score
    const totalWeight = qualityWallets.reduce((sum, w) => sum + w.reputationScore, 0);
    const weightedMultiplier = qualityWallets.reduce((sum, wallet, index) => 
      sum + (walletMultipliers[index] * wallet.reputationScore), 0) / totalWeight;
    
    // Round to 1 decimal place
    return Math.round(weightedMultiplier * 10) / 10;
  }
  
  /**
   * Calculate expected success rate for a signal
   */
  private calculateExpectedSuccessRate(transactions: any[], qualityWallets: IExternalWallet[]): number {
    // Base success rate on wallet win rates
    const avgWinRate = qualityWallets.reduce((sum, w) => sum + w.winRate, 0) / qualityWallets.length;
    
    // Adjust based on wallet reputation and 4x scores
    const avgReputation = qualityWallets.reduce((sum, w) => sum + w.reputationScore, 0) / qualityWallets.length;
    const avg4xScore = qualityWallets.reduce((sum, w) => sum + (w.metadata?.achieves4xScore || 0), 0) / qualityWallets.length;
    
    // Calculate weighted success rate, giving more weight to reputation and 4x scores
    const expectedSuccess = (avgWinRate * 0.4) + (avgReputation * 0.3) + (avg4xScore * 0.3);
    
    return Math.min(100, Math.round(expectedSuccess));
  }
  
  /**
   * Determine most common wallet category for a signal
   */
  private determineTopCategory(transactions: any[]): string {
    const categories: Record<string, number> = {
      'Sniper': 0,
      'Gem Spotter': 0,
      'Early Mover': 0
    };
    
    for (const tx of transactions) {
      if (tx.walletCategory && categories[tx.walletCategory] !== undefined) {
        categories[tx.walletCategory]++;
      }
    }
    
    // Find category with most transactions
    let topCategory = 'Unknown';
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(categories)) {
      if (count > maxCount) {
        maxCount = count;
        topCategory = category;
      }
    }
    
    return topCategory;
  }
  
  /**
   * Get all active signals
   */
  getActiveSignals(): SmartMoneySignal[] {
    return Array.from(this.activeSignals.values());
  }
  
  /**
   * Get signal for a specific token
   */
  getSignalForToken(tokenAddress: string, network: string): SmartMoneySignal | null {
    const key = `${tokenAddress}|${network}`;
    return this.activeSignals.get(key) || null;
  }
  
  /**
   * Integrate with edge calculator to boost signals matching our criteria
   * This helps achieve the 74-76% success rate target
   */
  adjustEdgeScore(tokenAddress: string, network: string, baseEdgeScore: number): number {
    try {
      // Get signal for this token if it exists
      const signal = this.getSignalForToken(tokenAddress, network);
      
      if (!signal) {
        return baseEdgeScore; // No adjustment if no signal
      }
      
      // Apply adjustments based on signal quality
      
      // 1. Confidence adjustment
      const confidenceBoost = (signal.confidence - 70) * 0.2; // +0.2 for each point above 70
      
      // 2. Multiplier adjustment - critical for our 4x target
      const multiplierBoost = signal.predictedMultiplier >= 4 ? 10 : // +10 if predicted 4x or more
                             signal.predictedMultiplier >= 3 ? 5 : // +5 if predicted 3x or more
                             0;
      
      // 3. Expected success adjustment
      const successBoost = signal.expectedSuccess >= 75 ? 5 : // +5 if expected success meets our target
                          signal.expectedSuccess >= 70 ? 2 : // +2 if close to target
                          0;
      
      // 4. Signal strength adjustment
      const strengthBoost = signal.signalStrength * 0.5;
      
      // Calculate total adjustment
      const totalAdjustment = confidenceBoost + multiplierBoost + successBoost + strengthBoost;
      
      // Apply adjustment to base edge score
      let adjustedEdgeScore = baseEdgeScore + totalAdjustment;
      
      // Ensure score is within 0-100 range
      adjustedEdgeScore = Math.max(0, Math.min(100, adjustedEdgeScore));
      
      logger.info(`Adjusted edge score for ${tokenAddress} from ${baseEdgeScore} to ${adjustedEdgeScore}`);
      
      return adjustedEdgeScore;
    } catch (error) {
      logger.error(`Error adjusting edge score for ${tokenAddress}:`, error instanceof Error ? error.message : String(error));
      return baseEdgeScore; // Return base score on error
    }
  }
  
  /**
   * Run a scan to update signals
   */
  async runSignalScan(): Promise<SmartMoneySignal[]> {
    try {
      logger.info('Running smart money signal scan');
      
      // Detect new signals
      const signals = await this.detectNewSignals();
      
      logger.info(`Signal scan completed. Found ${signals.length} new signals`);
      
      return signals;
    } catch (error) {
      logger.error('Error running signal scan:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }
}

// Create singleton instance
const smartMoneyIntegrationService = new SmartMoneyIntegrationService();

export default smartMoneyIntegrationService;