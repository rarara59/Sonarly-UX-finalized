import { RenaissanceSmartWalletSystem } from './renaissance-signal-combiner.js';

console.log('Testing Renaissance combiner (mock mode)...');

const system = new RenaissanceSmartWalletSystem({
  testing: {
    enableMockMode: true  // This should bypass database
  }
});

const mockContext = {
  tokenAddress: 'test_token',
  logger: {
    info: (msg) => console.log(`[INFO] ${msg}`),
    warn: (msg) => console.warn(`[WARN] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  },
  rpcManager: null,
  mockMode: true  // Force mock mode
};

system.execute(mockContext)
  .then(result => {
    console.log('✅ SUCCESS:', result.confidence);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  });