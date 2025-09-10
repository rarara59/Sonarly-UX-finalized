import { SmartWalletNetworkEffectsAnalyzer } from './smart-wallet-signal.js';

console.log('Testing network analyzer only...');

const analyzer = new SmartWalletNetworkEffectsAnalyzer();

const mockTransactions = [
  { from: 'wallet1', to: 'wallet2', amount: 1000, timestamp: Date.now() },
  { from: 'wallet2', to: 'wallet3', amount: 2000, timestamp: Date.now() },
  { from: 'wallet1', to: 'wallet3', amount: 1500, timestamp: Date.now() }
];

const mockWallets = ['wallet1', 'wallet2', 'wallet3'];

analyzer.analyzeNetworkEffects('test_token', mockWallets, mockTransactions)
  .then(result => {
    console.log('✅ Network analyzer works:', result.networkConfidence);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Network analyzer failed:', error);
    process.exit(1);
  });