import { SmartWalletSignalJS } from './smart-wallet-signal.module.js';

const signal = new SmartWalletSignalJS();
const mockContext = {
  tokenAddress: 'X69GKB2f_test',
  tokenAgeMinutes: 5,
  rpcManager: {
    getTokenAccountsByOwner: () => Promise.resolve([]),
    getSignaturesForAddress: () => Promise.resolve([])
  },
  logger: { info: console.log, warn: console.warn, error: console.error }
};

const result = await signal.execute(mockContext);
console.log('✅ Signal confidence:', result.confidence);
console.log('✅ Math framework:', result.data.mathematicalFramework);
