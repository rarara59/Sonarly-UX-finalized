// test-parser-mem.js
import 'dotenv/config';           // loads .env automatically
console.log('HELIUS_API_KEY =', process.env.HELIUS_API_KEY);
import { SolanaPoolParserService } from './src/services/solana-pool-parser.service.js';

// 1. Spin up the parser with normal settings
const parser = new SolanaPoolParserService({
  rpcManager: (await import('./src/core/rpc-connection-manager/index.js')).default
});

// 2. Make sure it’s ready
await parser.initialize();

console.log('⏳ Starting stress-test: fetching 300 pools...');
const startMB = process.memoryUsage().rss / 1024 / 1024;
console.log(`📏 RAM at start: ${startMB.toFixed(1)} MB`);

// 3. Call the originally heavy method
await parser.findMemeCoinPoolsOriginal(300);  // fetch & parse 300 pools

// Wait a bit so GC can run
setTimeout(() => {
  const endMB = process.memoryUsage().rss / 1024 / 1024;
  console.log(`📏 RAM after fetch: ${endMB.toFixed(1)} MB`);
  console.log('✅ Stress-test complete — Ctrl-C to exit');
}, 60_000);