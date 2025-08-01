import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { RenaissanceMathEngine } from './services/renaissance-math-engine.js';
import RPCConnectionManager from './core/rpc-connection-manager/index.js';

// Get current directory and load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🔍 DEBUG: Loading .env from:', join(rootDir, '.env'));
const result = dotenv.config({ path: join(rootDir, '.env') });
console.log('🔍 ENV Load Result:', result.error ? result.error.message : 'SUCCESS');

// Debug environment variables
console.log('🔍 DEBUG: Starting debug mode...');
console.log('🔍 DEBUG: Environment variables loaded:');
console.log('🔍 HELIUS_RPC_URL:', process.env.HELIUS_RPC_URL ? 'SET' : 'MISSING');
console.log('🔍 HELIUS_API_KEY:', process.env.HELIUS_API_KEY ? 'SET' : 'MISSING');
console.log('🔍 CHAINSTACK_RPC_URL:', process.env.CHAINSTACK_RPC_URL ? 'SET' : 'MISSING');

async function main() {
  try {
    console.log('🧠 Starting Renaissance Trading System...');

    // Create RPC manager (it will handle WebSocket connections internally)
    console.log('✅ Creating RPC manager...');
    const rpcManager = RPCConnectionManager.getInstance({
      heliusUrl: process.env.HELIUS_RPC_URL,
      chainstackUrl: process.env.CHAINSTACK_RPC_URL
    });

    // Create Renaissance math engine
    console.log('✅ Creating math engine...');
    const mathEngine = new RenaissanceMathEngine({
      maxKellyFraction: 0.1,
      significanceLevel: 0.01,
      minSampleSize: 30
    });

    // Wait for RPC manager to initialize (including WebSocket connections)
    console.log('🔍 DEBUG: Waiting for RPC manager initialization...');
    const initTimeout = setTimeout(() => {
      console.error('💥 TIMEOUT: RPC manager initialization took too long (30s)');
      process.exit(1);
    }, 30000);

    await rpcManager.initializationPromise;
    clearTimeout(initTimeout);
    console.log('🔍 DEBUG: RPC manager initialization completed');

    console.log('✅ RPC manager initialized, setting up event handlers...');

    // Connect RPC manager events to math engine
    rpcManager.on('lpEvent', async ({ event, analysis }) => {
      try {
        console.log(`📊 Processing LP event: ${event.baseMint?.slice(0,8)}...`);
        
        // Send real data to Renaissance math engine
        const signal = await mathEngine.processPoolEvent(event);
        
        if (signal) {
          handleRenaissanceSignal(signal);
        }
        
      } catch (error) {
        console.error('❌ Error processing LP event:', error);
      }
    });

    // Handle high-priority significant LP events
    rpcManager.on('significantLPEvent', async ({ event, analysis }) => {
      try {
        console.log(`🎯 HIGH CONFIDENCE LP: ${event.baseMint?.slice(0,8)}...`);
        
        const signal = await mathEngine.processPoolEvent(event);
        
        if (signal?.statistics.isSignificant) {
          console.log(`🔥 SIGNIFICANT RENAISSANCE SIGNAL: ${signal.signal.recommendation}`);
          handleRenaissanceSignal(signal, true);
        }
        
      } catch (error) {
        console.error('❌ Error processing significant LP event:', error);
      }
    });

    // Handle new token creation events
    rpcManager.on('newToken', (tokenData) => {
      console.log(`🪙 New token detected: ${tokenData.address?.slice(0,8)}...`);
    });

    // System health monitoring
    setInterval(() => {
      const rpcMetrics = rpcManager.getPerformanceStats();
      const mathMetrics = mathEngine.getEngineMetrics();
      
      console.log('\n📈 RENAISSANCE SYSTEM METRICS:');
      console.log(`   RPC Health: ${Object.values(rpcMetrics.endpoints).map(e => e.health).join('/')} `);
      console.log(`   WebSocket: ${rpcMetrics.webSocket.overview.activeConnections} connections`);
      console.log(`   Cache Hit Rate: ${(rpcMetrics.cache.cacheSize / (rpcMetrics.cache.cacheSize + 1) * 100).toFixed(1)}%`);
      console.log(`   Memory: ${rpcMetrics.memory.current.heapUsed}MB / ${rpcMetrics.memory.current.heapTotal}MB`);
      console.log(`   Math Engine Events: ${mathMetrics.history.events}`);
      console.log(`   GARCH Volatility: ${(mathMetrics.models.garch.volatility * 100).toFixed(2)}%`);
    }, 30000);

    console.log('✅ Renaissance Trading System fully operational');
    console.log('📊 Monitoring for LP events with institutional-grade analysis...\n');

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down Renaissance system...');
      await rpcManager.shutdown();
      process.exit(0);
    });

  } catch (error) {
    console.error('💥 Renaissance system failed:', error);
    process.exit(1);
  }
}

function handleRenaissanceSignal(signal, isHighPriority = false) {
  const prefix = isHighPriority ? '🚀 HIGH-PRIORITY' : '🧠';
  
  console.log(`\n${prefix} RENAISSANCE SIGNAL:`);
  console.log(`   Token: ${signal.poolEvent.baseMint?.slice(0,8)}...`);
  console.log(`   Recommendation: ${signal.signal.recommendation}`);
  console.log(`   Confidence: ${(signal.signal.confidence * 100).toFixed(1)}%`);
  console.log(`   Expected Return: ${(signal.signal.expectedReturn * 100).toFixed(2)}%`);
  console.log(`   Position Size: ${(signal.position.size * 100).toFixed(1)}%`);
  console.log(`   P-Value: ${signal.statistics.pValue.toFixed(4)}`);
  console.log(`   Sharpe Ratio: ${signal.position.riskMetrics.sharpeRatio.toFixed(2)}`);
  console.log(`   Processing Time: ${signal.processingTime.toFixed(2)}ms`);

  // Check if this is a strong enough signal to execute
  if (shouldExecuteTrade(signal)) {
    executeTrade(signal);
  }
  
  console.log(''); // Add spacing
}

function shouldExecuteTrade(signal) {
  return (
    signal.statistics.isSignificant &&           // Statistically significant
    signal.signal.confidence > 0.7 &&            // High confidence (>70%)
    Math.abs(signal.position.size) > 0.01 &&     // Meaningful position size (>1%)
    signal.signal.strength > 0.5 &&              // Strong signal
    signal.position.riskMetrics.sharpeRatio > 1.5 // Good risk-adjusted return
  );
}

function executeTrade(signal) {
  console.log(`🚀 EXECUTING RENAISSANCE TRADE:`);
  console.log(`   Action: ${signal.signal.recommendation}`);
  console.log(`   Token: ${signal.poolEvent.baseMint}`);
  console.log(`   Size: ${(signal.position.size * 100).toFixed(1)}% of portfolio`);
  console.log(`   Expected Return: ${signal.signal.expectedReturn > 0 ? '+' : ''}${(signal.signal.expectedReturn * 100).toFixed(2)}%`);
  console.log(`   Risk Metrics: Sharpe=${signal.position.riskMetrics.sharpeRatio.toFixed(2)}, Vol=${(signal.position.riskMetrics.volatility * 100).toFixed(1)}%`);
}

main().catch(console.error);