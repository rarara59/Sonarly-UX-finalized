// src/signal-modules/social-signals.module.ts

import { SignalModule, SignalContext, SignalResult, SignalModuleConfig } from '../interfaces/signal-module.interface';
import { DetectionSignals } from '../interfaces/detection-signals.interface';

export class SocialSignalsModule extends SignalModule {
    constructor(config: SignalModuleConfig) {
      super('social-signals', config);
    }
  
    getRequiredTrack(): 'FAST' | 'SLOW' | 'BOTH' {
      return 'SLOW'; // Social signals for slow track only
    }
  
    getSignalType(): keyof DetectionSignals {
      return 'socialSignals';
    }
  
    async execute(context: SignalContext): Promise<SignalResult> {
      const startTime = performance.now();
      
      try {
        const socialData = await this.getSocialMetrics(context.tokenAddress, context.logger);
        
        let confidence = 0;
        
        if (socialData.mentionVelocity >= 10) confidence += 35; // 10+ mentions/hour
        if (socialData.sentimentScore >= 0.6) confidence += 30; // Positive sentiment
        if (socialData.communityStrength >= 0.7) confidence += 35; // Strong community
        
        const data = {
          ...socialData,
          confidence
        };
  
        return {
          confidence,
          data,
          processingTime: performance.now() - startTime,
          source: 'social-signals-module',
          version: this.config.version
        };
      } catch (error) {
        context.logger.error('Social signals failed:', error);
        
        return {
          confidence: 0,
          data: {
            mentionVelocity: 2,
            sentimentScore: 0.45,
            communityStrength: 0.3,
            confidence: 0
          },
          processingTime: performance.now() - startTime,
          source: 'social-signals-module',
          version: this.config.version
        };
      }
    }
  
    // Extract the sophisticated social metrics analysis (~300 lines preserved!)
    private async getSocialMetrics(tokenAddress: string, logger: any): Promise<any> {
      try {
        // Get token metadata first (symbol/name for social searches)
        const tokenMetadata = await this.getTokenMetadataForSocial(tokenAddress);
        
        if (!tokenMetadata.symbol || tokenMetadata.symbol === 'UNKNOWN') {
          return { mentionVelocity: 0, sentimentScore: 0.5, communityStrength: 0.2 };
        }
        
        // Multi-source social analysis (parallel for performance)
        const [twitterMetrics, webMetrics, onChainMetrics] = await Promise.allSettled([
          this.analyzeTwitterSentiment(tokenMetadata),
          this.analyzeWebSentiment(tokenMetadata),
          this.analyzeOnChainSocialSignals(tokenAddress, tokenMetadata)
        ]);
        
        // Combine results with intelligent fallbacks
        const socialData = this.combineSocialMetrics(
          twitterMetrics.status === 'fulfilled' ? twitterMetrics.value : null,
          webMetrics.status === 'fulfilled' ? webMetrics.value : null,
          onChainMetrics.status === 'fulfilled' ? onChainMetrics.value : null,
          tokenMetadata
        );
        
        return socialData;
        
      } catch (error) {
        // Conservative fallback (neutral social signals)
        return {
          mentionVelocity: 2,
          sentimentScore: 0.45,
          communityStrength: 0.3
        };
      }
    }
  
    private async getTokenMetadataForSocial(tokenAddress: string): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        // METHOD 1: Try Helius Enhanced APIs for token metadata
        const heliusApiKey = process.env.HELIUS_API_KEY;
        if (heliusApiKey) {
          try {
            const response = await fetch(`https://devnet.helius-rpc.com/?api-key=${heliusApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'get-asset',
                method: 'getAsset',
                params: { id: tokenAddress }
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.result) {
                const asset = data.result;
                const content = asset.content || {};
                
                return {
                  symbol: content.metadata?.symbol || 'UNKNOWN',
                  name: content.metadata?.name || 'Unknown Token',
                  description: content.metadata?.description,
                  twitter: content.links?.twitter,
                  website: content.links?.website
                };
              }
            }
          } catch (heliusError) {
            // Continue to next method
          }
        }
        
        // METHOD 2: Get from token mint metadata program (simplified)
        return {
          symbol: `TOKEN_${tokenAddress.slice(0, 8)}`,
          name: 'Unknown Token'
        };
        
      } catch (error) {
        return { symbol: 'UNKNOWN', name: 'Unknown' };
      }
    }
  
    // TWITTER API v2 INTEGRATION (Free Tier) - preserved sophisticated logic
    private async analyzeTwitterSentiment(tokenMetadata: {symbol: string; name: string}): Promise<any> {
      const twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
      
      if (!twitterBearerToken) {
        return null;
      }
      
      try {
        // Search for recent tweets mentioning the token
        const searchQuery = this.buildTwitterSearchQuery(tokenMetadata);
        const tweetSearchUrl = `https://api.twitter.com/2/tweets/search/recent?query=${encodeURIComponent(searchQuery)}&max_results=100&tweet.fields=created_at,public_metrics,context_annotations&expansions=author_id&user.fields=public_metrics`;
        
        const response = await fetch(tweetSearchUrl, {
          headers: {
            'Authorization': `Bearer ${twitterBearerToken}`,
            'Content-Type': 'application/json'
          },
        });
        
        if (!response.ok) {
          return null;
        }
        
        const twitterData = await response.json();
        
        if (!twitterData.data || twitterData.data.length === 0) {
          return {
            mentionVelocity: 0,
            sentimentScore: 0.5,
            communityStrength: 0.1
          };
        }
        
        // Analyze tweet data
        const tweets = twitterData.data;
        const users = twitterData.includes?.users || [];
        
        // Calculate sophisticated metrics
        const mentionVelocity = this.calculateMentionVelocity(tweets);
        const sentimentScore = this.analyzeTweetSentiment(tweets);
        const communityStrength = this.calculateCommunityStrength(tweets, users);
        
        return { mentionVelocity, sentimentScore, communityStrength };
        
      } catch (twitterError) {
        return null;
      }
    }
  
    private buildTwitterSearchQuery(tokenMetadata: {symbol: string; name: string}): string {
      const symbol = tokenMetadata.symbol;
      const name = tokenMetadata.name;
      
      // Build search query with common meme coin terms
      const queries = [];
      
      // Symbol variations
      if (symbol && symbol !== 'UNKNOWN') {
        queries.push(`${symbol}`);
        queries.push(`#${symbol}`);
        queries.push(`"${symbol}"`);
      }
      
      // Name if meaningful
      if (name && name !== 'Unknown Token' && name.length > 3) {
        queries.push(`"${name}"`);
      }
      
      // Combine with crypto context
      const baseQuery = queries.slice(0, 3).join(' OR ');
      return `(${baseQuery}) (crypto OR solana OR memecoin OR "to the moon") -is:retweet`;
    }
  
    private calculateMentionVelocity(tweets: any[]): number {
      if (tweets.length === 0) return 0;
      
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
      
      const recentTweets = tweets.filter(tweet => {
        const tweetTime = new Date(tweet.created_at);
        return tweetTime >= oneHourAgo;
      });
      
      const sixHourTweets = tweets.filter(tweet => {
        const tweetTime = new Date(tweet.created_at);
        return tweetTime >= sixHoursAgo;
      });
      
      // Calculate mentions per hour (weighted recent vs historical)
      const recentVelocity = recentTweets.length;
      const avgVelocity = sixHourTweets.length / 6;
      
      const mentionVelocity = (recentVelocity * 0.7) + (avgVelocity * 0.3);
      
      return Math.max(0, Math.min(50, mentionVelocity));
    }
  
    private analyzeTweetSentiment(tweets: any[]): number {
      if (tweets.length === 0) return 0.5;
      
      // Sophisticated keyword-based sentiment analysis
      const positiveKeywords = [
        'moon', 'bullish', 'pump', 'rocket', 'gem', 'diamond', 'hands', 'buy', 'holding',
        'love', 'amazing', 'great', 'best', 'excited', 'rally', 'surge', 'breakout',
        '🚀', '💎', '🌙', '🔥', '💪', '📈', '🎯'
      ];
      
      const negativeKeywords = [
        'dump', 'crash', 'bearish', 'sell', 'scam', 'rug', 'dead', 'rip', 'exit',
        'terrible', 'awful', 'worst', 'avoid', 'warning', 'careful', 'falling',
        '📉', '💩', '⚠️', '🔴', '💔'
      ];
      
      let totalSentiment = 0;
      let analyzedTweets = 0;
      
      tweets.forEach(tweet => {
        const text = (tweet.text || '').toLowerCase();
        let sentiment = 0.5;
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        positiveKeywords.forEach(keyword => {
          if (text.includes(keyword)) positiveCount++;
        });
        
        negativeKeywords.forEach(keyword => {
          if (text.includes(keyword)) negativeCount++;
        });
        
        if (positiveCount > 0 || negativeCount > 0) {
          sentiment = 0.5 + ((positiveCount - negativeCount) * 0.1);
          sentiment = Math.max(0, Math.min(1, sentiment));
          
          totalSentiment += sentiment;
          analyzedTweets++;
        }
      });
      
      if (analyzedTweets === 0) return 0.5;
      
      return totalSentiment / analyzedTweets;
    }
  
    private calculateCommunityStrength(tweets: any[], users: any[]): number {
      if (tweets.length === 0) return 0.1;
      
      const userMap = new Map();
      users.forEach(user => userMap.set(user.id, user));
      
      let totalFollowers = 0;
      let totalEngagement = 0;
      let uniqueUsers = new Set();
      let verifiedUsers = 0;
      
      tweets.forEach(tweet => {
        const user = userMap.get(tweet.author_id);
        if (user) {
          uniqueUsers.add(user.id);
          totalFollowers += user.public_metrics?.followers_count || 0;
          
          if (user.verified) verifiedUsers++;
        }
        
        // Engagement metrics
        const metrics = tweet.public_metrics || {};
        totalEngagement += (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0);
      });
      
      // Community strength factors
      const uniqueUserCount = uniqueUsers.size;
      const avgFollowers = uniqueUserCount > 0 ? totalFollowers / uniqueUserCount : 0;
      const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;
      const verifiedRatio = uniqueUserCount > 0 ? verifiedUsers / uniqueUserCount : 0;
      
      // Combine factors (weighted)
      let strength = 0.1;
      
      if (uniqueUserCount >= 20) strength += 0.3;
      else if (uniqueUserCount >= 10) strength += 0.2;
      else if (uniqueUserCount >= 5) strength += 0.1;
      
      if (avgFollowers >= 10000) strength += 0.2;
      else if (avgFollowers >= 1000) strength += 0.1;
      
      if (avgEngagement >= 50) strength += 0.2;
      else if (avgEngagement >= 10) strength += 0.1;
      
      if (verifiedRatio >= 0.1) strength += 0.1;
      
      return Math.max(0.1, Math.min(1, strength));
    }
  
    // WEB SCRAPING FALLBACK (When Twitter API fails)
    private async analyzeWebSentiment(tokenMetadata: {symbol: string; name: string}): Promise<any> {
      const symbol = tokenMetadata.symbol;
      if (!symbol || symbol === 'UNKNOWN') return null;
      
      try {
        // Check CoinGecko for basic presence (indicates some community interest)
        const geckoResponse = await fetch(
          `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(symbol)}`,
        );
        
        if (geckoResponse.ok) {
          const geckoData = await geckoResponse.json();
          const coins = geckoData.coins || [];
          
          const isListed = coins.some((coin: any) => 
            coin.symbol?.toLowerCase() === symbol.toLowerCase()
          );
          
          if (isListed) {
            return {
              mentionVelocity: 2,
              sentimentScore: 0.55,
              communityStrength: 0.4
            };
          }
        }
        
        return {
          mentionVelocity: 0.5,
          sentimentScore: 0.45,
          communityStrength: 0.2
        };
        
      } catch (error) {
        return null;
      }
    }
  
    // ON-CHAIN SOCIAL SIGNALS (Fallback analysis)
    private async analyzeOnChainSocialSignals(tokenAddress: string, tokenMetadata: any): Promise<any> {
      try {
        const rpcManager = (await import('../services/rpc-connection-manager')).default;
        
        // Analyze on-chain activity as proxy for social interest
        const signatures = await rpcManager.getSignaturesForAddress(tokenAddress, 200).catch(() => []);
        
        if (signatures.length === 0) {
          return { mentionVelocity: 0, sentimentScore: 0.4, communityStrength: 0.1 };
        }
        
        // Calculate social proxies from on-chain activity
        const recent1h = signatures.filter(sig => {
          const sigTime = sig.blockTime || 0;
          const hour1Ago = Math.floor(Date.now() / 1000) - 3600;
          return sigTime >= hour1Ago;
        });
        
        const recent24h = signatures.filter(sig => {
          const sigTime = sig.blockTime || 0;
          const hours24Ago = Math.floor(Date.now() / 1000) - 86400;
          return sigTime >= hours24Ago;
        });
        
        // Social metrics from activity
        const mentionVelocity = Math.min(20, recent1h.length * 0.5);
        
        const recent6h = signatures.filter(sig => {
          const sigTime = sig.blockTime || 0;
          const hours6Ago = Math.floor(Date.now() / 1000) - 21600;
          return sigTime >= hours6Ago;
        });
        
        const growthRatio = recent6h.length > 0 ? recent1h.length / (recent6h.length / 6) : 1;
        const sentimentScore = Math.max(0.3, Math.min(0.8, 0.5 + (growthRatio - 1) * 0.2));
        
        // Community strength from unique wallets
        const uniqueWallets = new Set();
        recent24h.forEach(sig => {
          const wallet = sig.signature.slice(0, 44);
          uniqueWallets.add(wallet);
        });
        
        const communityStrength = Math.min(0.6, uniqueWallets.size * 0.02);
        
        return { mentionVelocity, sentimentScore, communityStrength };
        
      } catch (error) {
        return { mentionVelocity: 0, sentimentScore: 0.4, communityStrength: 0.1 };
      }
    }
  
    // COMBINE RESULTS FROM MULTIPLE SOURCES
    private combineSocialMetrics(twitterData: any, webData: any, onChainData: any, tokenMetadata: any): any {
      const sources = [twitterData, webData, onChainData].filter(Boolean);
      
      if (sources.length === 0) {
        return {
          mentionVelocity: 0,
          sentimentScore: 0.45,
          communityStrength: 0.2
        };
      }
      
      // Weighted combination (Twitter > Web > OnChain)
      const weights = [0.6, 0.3, 0.1];
      let totalWeight = 0;
      
      let mentionVelocity = 0;
      let sentimentScore = 0;
      let communityStrength = 0;
      
      sources.forEach((source, index) => {
        const weight = weights[index] || 0.1;
        totalWeight += weight;
        
        mentionVelocity += source.mentionVelocity * weight;
        sentimentScore += source.sentimentScore * weight;
        communityStrength += source.communityStrength * weight;
      });
      
      // Normalize by total weight
      if (totalWeight > 0) {
        mentionVelocity /= totalWeight;
        sentimentScore /= totalWeight;
        communityStrength /= totalWeight;
      }
      
      // Apply sanity bounds
      return {
        mentionVelocity: Math.max(0, Math.min(50, mentionVelocity)),
        sentimentScore: Math.max(0.1, Math.min(0.9, sentimentScore)),
        communityStrength: Math.max(0.1, Math.min(1, communityStrength))
      };
    }
  }