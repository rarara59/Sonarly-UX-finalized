import { RenaissanceSmartWalletSystem } from './renaissance-signal-combiner.js';

console.log('Testing Renaissance with mock individual analysis...');

// Create system that will use mock data instead of hanging SmartWalletSignalJS
const system = new RenaissanceSmartWalletSystem();

const mockContext = {
  tokenAddress: 'test_token',
  logger: {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  },
  rpcManager: null
};

console.log('Testing with mock individual analysis...');

// This should work if the Renaissance combiner is functional
system.execute(mockContext)
  .then(result => {
    console.log('✅ Renaissance with mock works:', result.confidence);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Renaissance failed:', error.message);
    process.exit(1);
  });