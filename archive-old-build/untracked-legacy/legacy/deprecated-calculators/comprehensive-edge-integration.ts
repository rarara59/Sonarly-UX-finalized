// LEGACY: archived 2025-06-09 - integration for deprecated comprehensive calculator
// src/services/comprehensive-edge-integration.ts
import ComprehensiveEdgeCalculator, { ComprehensiveEdgeResult } from './comprehensive-edge-calculator.service';
import rpcConnectionManager from './rpc-connection-manager';

/**
 * Integration service for the comprehensive multi-path edge calculator
 * Handles token discovery, evaluation, and result tracking
 */
export class ComprehensiveEdgeIntegration {
  
  /**
   * Main scanning loop - processes tokens from multiple discovery sources
   */
  async runTokenScan(): Promise<ComprehensiveEdgeResult[]> {
    console.log('🔍 Starting comprehensive token scan...');
    
    // STEP 1: Discover tokens from multiple sources
    const [newLPTokens, volumeTokens, socialTokens] = await Promise.all([
      this.discoverNewLPTokens(),      // Fresh LP creation
      this.discoverVolumeTokens(),     // Volume spikes
      this.discoverSocialTokens()      // Social mention spikes
    ]);
    
    // STEP 2: Combine and deduplicate
    const allTokens = this.deduplicateTokens([...newLPTokens, ...volumeTokens, ...socialTokens]);
    console.log(`📊 Found ${allTokens.length} unique tokens to evaluate`);
    
    // STEP 3: Evaluate each token
    const results: ComprehensiveEdgeResult[] = [];
    
    for (const token of allTokens) {
      try {
        const result = await ComprehensiveEdgeCalculator.evaluateToken(
          token.address,
          token.price,
          token.ageMinutes
        );
        
        if (result.isQualified) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Failed to evaluate ${token.address}:`, error);
      }
    }
    
    // STEP 4: Sort by score and track
    const qualifiedTokens = results
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, 20); // Top 20 only
    
    console.log(`✅ Found ${qualifiedTokens.length} qualified tokens`);
    
    // STEP 5: Display results
    this.displayResults(qualifiedTokens);
    
    return qualifiedTokens;
  }

  /**
   * DISCOVERY SOURCE 1: New LP Creation (Fast Track)
   */
  private async discoverNewLPTokens(): Promise<Array<{address: string; price: number; ageMinutes: number}>> {
    try {
      console.log('🆕 Discovering new LP tokens...');
      
      // Use your existing RPC connection manager
      const recentLPs = await rpcConnectionManager.getRecentLPAccounts(50);
      
      const tokens = [];
      for (const lp of recentLPs) {
        try {
          // Get token price and age
          const price = await this.getTokenPrice(lp.mintAddress || lp.tokenMintA);
          const ageMinutes = await this.getTokenAgeMinutes(lp.mintAddress || lp.tokenMintA);
          
          // Only include very recent tokens for fast track
          if (ageMinutes <= 60) { // Within 1 hour
            tokens.push({
              address: lp.mintAddress || lp.tokenMintA,
              price,
              ageMinutes
            });
          }
        } catch (error) {
          console.debug(`Failed to process LP ${lp.pubkey}:`, error);
        }
      }
      
      console.log(`🆕 Found ${tokens.length} new LP tokens`);
      return tokens;
    } catch (error) {
      console.error('New LP discovery failed:', error);
      return [];
    }
  }

  /**
   * DISCOVERY SOURCE 2: Volume Spikes (Slow Track)
   */
  private async discoverVolumeTokens(): Promise<Array<{address: string; price: number; ageMinutes: number}>> {
    try {
      console.log('📈 Discovering volume spike tokens...');
      
      // This would integrate with your market data service
      // For now, mock some established tokens with volume spikes
      const volumeTokens = await this.getVolumeSpikes();
      
      const tokens = [];
      for (const token of volumeTokens) {
        const ageMinutes = await this.getTokenAgeMinutes(token.address);
        
        // These are typically older tokens with renewed interest
        if (ageMinutes > 30) { // Older than 30 minutes = slow track
          tokens.push({
            address: token.address,
            price: token.price,
            ageMinutes
          });
        }
      }
      
      console.log(`📈 Found ${tokens.length} volume spike tokens`);
      return tokens;
    } catch (error) {
      console.error('Volume discovery failed:', error);
      return [];
    }
  }

  /**
   * DISCOVERY SOURCE 3: Social Media Mentions (Slow Track)
   */
  private async discoverSocialTokens(): Promise<Array<{address: string; price: number; ageMinutes: number}>> {
    try {
      console.log('🐦 Discovering social mention tokens...');
      
      // This would integrate with Twitter API, Discord, etc.
      // For now, mock some tokens with social momentum
      const socialTokens = await this.getSocialMentions();
      
      const tokens = [];
      for (const token of socialTokens) {
        const ageMinutes = await this.getTokenAgeMinutes(token.address);
        
        tokens.push({
          address: token.address,
          price: token.price,
          ageMinutes
        });
      }
      
      console.log(`🐦 Found ${tokens.length} social mention tokens`);
      return tokens;
    } catch (error) {
      console.error('Social discovery failed:', error);
      return [];
    }
  }

  /**
   * Remove duplicate tokens from multiple sources
   */
  private deduplicateTokens(tokens: Array<{address: string; price: number; ageMinutes: number}>): Array<{address: string; price: number; ageMinutes: number}> {
    const seen = new Set();
    return tokens.filter(token => {
      if (seen.has(token.address)) {
        return false;
      }
      seen.add(token.address);
      return true;
    });
  }

  /**
   * Display results in a clean format
   */
  private displayResults(results: ComprehensiveEdgeResult[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPREHENSIVE EDGE CALCULATOR RESULTS');
    console.log('='.repeat(80));
    
    if (results.length === 0) {
      console.log('❌ No qualified tokens found');
      return;
    }
    
    results.forEach((result, index) => {
      const trackEmoji = result.track === 'FAST' ? '⚡' : '🐢';
      const scoreColor = result.finalScore >= 0.85 ? '🟢' : result.finalScore >= 0.75 ? '🟡' : '🔴';
      
      console.log(`\n${index + 1}. ${trackEmoji} ${result.tokenAddress}`);
      console.log(`   ${scoreColor} Score: ${(result.finalScore * 100).toFixed(1)}% | Track: ${result.track} | Path: ${result.primaryPath}`);
      console.log(`   🎯 Expected Return: ${result.expectedReturn.toFixed(1)}x | Risk: ${result.riskScore.toFixed(2)} | Kelly: ${(result.kellySizing * 100).toFixed(1)}%`);
      console.log(`   📊 Paths: ${result.detectionPaths.join(', ')}`);
      
      if (result.signals.smartWallet?.detected) {
        console.log(`   🔥 Smart Wallets: T1:${result.signals.smartWallet.tier1Count} T2:${result.signals.smartWallet.tier2Count} T3:${result.signals.smartWallet.tier3Count}`);
      }
      
      // Show top 2 reasons
      if (result.reasons.length > 0) {
        console.log(`   💡 ${result.reasons.slice(0, 2).join(' | ')}`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
  }

  /**
   * Update token outcomes for learning (call this periodically)
   */
  async updateTokenOutcomes(): Promise<void> {
    console.log('📊 Updating token outcomes for learning...');
    
    // Get tokens evaluated in the last 24 hours that don't have outcomes yet
    const recentTokens = await this.getRecentEvaluatedTokens();
    
    for (const token of recentTokens) {
      try {
        const currentPrice = await this.getTokenPrice(token.address);
        const originalPrice = token.originalPrice || currentPrice; // You'd store this
        
        const currentReturn = (currentPrice - originalPrice) / originalPrice;
        const maxReturn = token.maxReturn || currentReturn; // Track max
        const timeElapsed = (Date.now() - token.timestamp.getTime()) / (1000 * 60 * 60); // hours
        
        // Determine if target was hit
        const targetReturn = token.track === 'FAST' ? 4.0 : 3.0; // 5x for fast, 4x for slow
        const targetHit = maxReturn >= (targetReturn - 1); // Convert to decimal
        
        await ComprehensiveEdgeCalculator.updateOutcome(
          token.address,
          token.timestamp,
          {
            maxReturn,
            timeToMax: timeElapsed,
            targetHit,
            finalReturn: currentReturn
          }
        );
      } catch (error) {
        console.error(`Failed to update outcome for ${token.address}:`, error);
      }
    }
  }

  /**
   * Monitor performance and auto-tune
   */
  async monitorPerformance(): Promise<void> {
    console.log('📈 Monitoring system performance...');
    
    const stats = await ComprehensiveEdgeCalculator.getPerformanceStats(30);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 THORP COMPREHENSIVE SYSTEM PERFORMANCE (30 days)');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 OVERALL PERFORMANCE:`);
    console.log(`   Total Evaluations: ${stats.overall.total}`);
    console.log(`   Success Rate: ${(stats.overall.successRate * 100).toFixed(1)}% (Target: 74-76%)`);
    console.log(`   Average Return: ${(stats.overall.avgReturn * 100).toFixed(1)}%`);
    
    console.log(`\n⚡ FAST TRACK (0-30 min):`);
    console.log(`   Evaluations: ${stats.fastTrack.total}`);
    console.log(`   Success Rate: ${(stats.fastTrack.successRate * 100).toFixed(1)}%`);
    console.log(`   Average Return: ${(stats.fastTrack.avgReturn * 100).toFixed(1)}%`);
    
    console.log(`\n🐢 SLOW TRACK (30+ min):`);
    console.log(`   Evaluations: ${stats.slowTrack.total}`);
    console.log(`   Success Rate: ${(stats.slowTrack.successRate * 100).toFixed(1)}%`);
    console.log(`   Average Return: ${(stats.slowTrack.avgReturn * 100).toFixed(1)}%`);
    
    console.log(`\n🔥 SMART WALLET PATH:`);
    console.log(`   Evaluations: ${stats.smartWalletPath.total}`);
    console.log(`   Success Rate: ${(stats.smartWalletPath.successRate * 100).toFixed(1)}%`);
    console.log(`   Average Return: ${(stats.smartWalletPath.avgReturn * 100).toFixed(1)}%`);
    
    console.log(`\n📋 PATH BREAKDOWN:`);
    Object.entries(stats.pathBreakdown).forEach(([path, pathStats]: [string, any]) => {
      console.log(`   ${path}: ${pathStats.total} evaluations, ${(pathStats.successRate * 100).toFixed(1)}% success`);
    });
    
    // Check if we're hitting target
    const hitTarget = stats.overall.successRate >= 0.74 && stats.overall.successRate <= 0.76;
    console.log(`\n🎯 Target Status: ${hitTarget ? '✅ ACHIEVED' : '❌ NEEDS TUNING'}`);
    
    console.log('='.repeat(60));
  }

  /**
   * Run continuous scanning loop
   */
  async startContinuousScanning(intervalMinutes: number = 5): Promise<void> {
    console.log(`🔄 Starting continuous scanning every ${intervalMinutes} minutes...`);
    
    const scan = async () => {
      try {
        await this.runTokenScan();
        await this.updateTokenOutcomes();
        
        // Monitor performance every hour
        if (Math.random() < 0.2) { // 20% chance each scan
          await this.monitorPerformance();
        }
      } catch (error) {
        console.error('Scan failed:', error);
      }
    };
    
    // Run initial scan
    await scan();
    
    // Set up interval
    setInterval(scan, intervalMinutes * 60 * 1000);
  }

  // Helper methods (replace with your actual implementations)
  private async getTokenPrice(tokenAddress: string): Promise<number> {
    // Mock implementation - replace with your price service
    return Math.random() * 0.01 + 0.0001;
  }

  private async getTokenAgeMinutes(tokenAddress: string): Promise<number> {
    // Mock implementation - replace with your RPC calls
    return Math.floor(Math.random() * 1440); // 0-24 hours
  }

  private async getVolumeSpikes(): Promise<Array<{address: string; price: number}>> {
    // Mock implementation - replace with your market data service
    return [
      { address: 'VOLUME1...', price: 0.005 },
      { address: 'VOLUME2...', price: 0.012 },
      { address: 'VOLUME3...', price: 0.008 }
    ];
  }

  private async getSocialMentions(): Promise<Array<{address: string; price: number}>> {
    // Mock implementation - replace with your social monitoring service
    return [
      { address: 'SOCIAL1...', price: 0.003 },
      { address: 'SOCIAL2...', price: 0.007 },
      { address: 'SOCIAL3...', price: 0.015 }
    ];
  }

  private async getRecentEvaluatedTokens(): Promise<Array<{address: string; timestamp: Date; track: string; originalPrice?: number; maxReturn?: number}>> {
    // Mock implementation - replace with your database query
    return [
      { address: 'TOKEN1...', timestamp: new Date(Date.now() - 3600000), track: 'FAST' },
      { address: 'TOKEN2...', timestamp: new Date(Date.now() - 7200000), track: 'SLOW' }
    ];
  }
}

export default new ComprehensiveEdgeIntegration();

// Example usage:
/*
import ComprehensiveEdgeIntegration from './comprehensive-edge-integration';

// Run a single scan
const results = await ComprehensiveEdgeIntegration.runTokenScan();

// Start continuous scanning
await ComprehensiveEdgeIntegration.startContinuousScanning(5); // Every 5 minutes

// Monitor performance
await ComprehensiveEdgeIntegration.monitorPerformance();

// Update outcomes for learning
await ComprehensiveEdgeIntegration.updateTokenOutcomes();
*/