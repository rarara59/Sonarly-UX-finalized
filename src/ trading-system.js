/**
 * TRADING SYSTEM INTEGRATION
 * Connects WebSocket data to Renaissance math engine
 */

import { HeliusWebSocketClient } from './services/production-helius-websocket-client.js';
import { RenaissanceMathEngine } from './services/renaissance-math-engine.js';

export class TradingSystem {
  constructor(heliusApiKey, rpcManager, options = {}) {
    // Create the WebSocket client (gets real data)
    this.wsClient = new HeliusWebSocketClient(heliusApiKey, rpcManager, options);
    
    // Create the math engine (processes data)
    this.mathEngine = new RenaissanceMathEngine(options.mathConfig);
    
    // Connect them together
    this.setupEventHandlers();
    
    console.log('🚀 Trading system initialized');
  }

  setupEventHandlers() {
    // When WebSocket finds a new pool, send it to math engine
    this.wsClient.on('poolEvent', async ({ event, metrics }) => {
      try {
        console.log(`📊 Processing pool: ${event.baseMint.slice(0,8)}...`);
        
        // Send real data to Renaissance math engine
        const signal = await this.mathEngine.processPoolEvent(event);
        
        if (signal) {
          this.handleTradingSignal(signal);
        }
        
      } catch (error) {
        console.error('❌ Error processing pool:', error);
      }
    });

    // Handle high-confidence pools separately
    this.wsClient.on('highConfidencePool', async ({ event, metrics }) => {
      console.log(`🎯 High confidence pool detected: ${event.baseMint.slice(0,8)}...`);
      
      const signal = await this.mathEngine.processPoolEvent(event);
      
      if (signal?.statistics.isSignificant) {
        console.log(`🔥 SIGNIFICANT SIGNAL: ${signal.signal.recommendation}`);
        this.handleTradingSignal(signal);
      }
    });

    // Handle connection events
    this.wsClient.on('connected', () => {
      console.log('✅ Connected to Helius WebSocket');
    });

    this.wsClient.on('error', (error) => {
      console.error('🚨 WebSocket error:', error);
    });
  }

  handleTradingSignal(signal) {
    // This is where you decide what to do with Renaissance signals
    console.log('\n🧠 RENAISSANCE SIGNAL RECEIVED:');
    console.log(`   Token: ${signal.poolEvent.baseMint.slice(0,8)}...`);
    console.log(`   Recommendation: ${signal.signal.recommendation}`);
    console.log(`   Confidence: ${(signal.signal.confidence * 100).toFixed(1)}%`);
    console.log(`   Expected Return: ${(signal.signal.expectedReturn * 100).toFixed(2)}%`);
    console.log(`   Position Size: ${(signal.position.size * 100).toFixed(1)}%`);
    console.log(`   P-Value: ${signal.statistics.pValue.toFixed(4)}`);
    console.log(`   Processing Time: ${signal.processingTime.toFixed(2)}ms\n`);

    // Check if this is a strong enough signal to trade
    if (this.shouldExecuteTrade(signal)) {
      this.executeTrade(signal);
    }
  }

  shouldExecuteTrade(signal) {
    // Your trading criteria
    return (
      signal.statistics.isSignificant &&           // Statistically significant
      signal.signal.confidence > 0.7 &&            // High confidence (>70%)
      Math.abs(signal.position.size) > 0.01 &&     // Meaningful position size (>1%)
      signal.signal.strength > 0.5                 // Strong signal
    );
  }

  executeTrade(signal) {
    console.log(`🚀 EXECUTING TRADE: ${signal.signal.recommendation}`);
    console.log(`   Size: ${(signal.position.size * 100).toFixed(1)}% of portfolio`);
    
    // This is where you would place actual trades
    // For now, we'll just log what we would do
    
    if (signal.signal.recommendation === 'BUY') {
      console.log(`   Action: BUY ${signal.poolEvent.baseMint}`);
      console.log(`   Expected Return: +${(signal.signal.expectedReturn * 100).toFixed(2)}%`);
    } else if (signal.signal.recommendation === 'SELL') {
      console.log(`   Action: SELL ${signal.poolEvent.baseMint}`);
    }
  }

  async start() {
    console.log('🔌 Starting trading system...');
    await this.wsClient.connect();
  }

  async stop() {
    console.log('⏹️ Stopping trading system...');
    await this.wsClient.disconnect();
  }

  getSystemMetrics() {
    return {
      websocket: this.wsClient.getProductionMetrics(),
      mathEngine: this.mathEngine.getEngineMetrics()
    };
  }
}