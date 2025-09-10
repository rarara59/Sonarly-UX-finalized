import { SmartWalletSignalJS } from '../signal-modules/smart-wallet-signal.module.js';

console.log('Testing individual analysis only...');

const analyzer = new SmartWalletSignalJS();

const mockContext = {
  tokenAddress: 'test_token',
  logger: {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  },
  rpcManager: null
};

console.log('About to call analyzer.execute...');

// Add 15-second timeout to see where it hangs
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('TIMEOUT: Individual analysis hung after 15 seconds')), 15000);
});

Promise.race([
  analyzer.execute(mockContext),
  timeoutPromise
])
.then(result => {
  console.log('✅ Individual analysis works:', result.confidence);
  process.exit(0);
})
.catch(error => {
  console.error('❌ Individual analysis failed:', error.message);
  process.exit(1);
});