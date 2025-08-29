// File: src/adapters/rpc-connection-pool.fake.js
// Testing implementation that matches real behavior

import { createStructuredLogger } from '../logger/structured-logger.js';

export class RpcConnectionPoolFake {
  constructor(logger = null) {
    this.logger = logger || createStructuredLogger('RpcConnectionPoolFake');
    this.callCount = 0;
    this.isShutdown = false;
    
    // Fake Solana mainnet data
    this.fakeData = {
      slot: 363295738,
      blockHeight: 363295738,
      balance: 1000000000, // 1 SOL in lamports
      tokenSupply: {
        value: {
          amount: '9600000000000000', // 9.6B USDC
          decimals: 6
        }
      }
    };
  }

  /**
   * Fake RPC call that matches real interface exactly
   */
  async call(method, params = []) {
    if (this.isShutdown) {
      throw new Error('RPC pool is shut down');
    }

    this.callCount++;
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));

    this.logger.debug('Fake RPC call', { method, params, callCount: this.callCount });

    // Match real Solana RPC responses
    switch (method) {
      case 'getSlot':
        return this.fakeData.slot;
        
      case 'getBlockHeight':
        return this.fakeData.blockHeight;
        
      case 'getBalance':
        return { value: this.fakeData.balance };
        
      case 'getTokenSupply':
        const [mint] = params;
        if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') { // USDC
          return this.fakeData.tokenSupply;
        }
        return { value: { amount: '1000000000', decimals: 9 } };
        
      case 'getLatestBlockhash':
        return {
          value: {
            blockhash: 'FakeBlockhash1234567890abcdef',
            lastValidBlockHeight: this.fakeData.blockHeight + 150
          }
        };
        
      default:
        this.logger.warn('Unhandled fake RPC method', { method });
        return { result: 'fake_response' };
    }
  }

  /**
   * Health check - always healthy for testing
   */
  async isHealthy() {
    return !this.isShutdown;
  }

  /**
   * Get call statistics  
   */
  getStats() {
    return {
      totalCalls: this.callCount,
      isShutdown: this.isShutdown,
      type: 'fake'
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.isShutdown = true;
    this.logger.info('Fake RPC connection pool shut down');
  }
}
