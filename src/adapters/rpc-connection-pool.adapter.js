// File: src/adapters/rpc-connection-pool.adapter.js  
// Real/fake switching adapter with standalone capability

import { componentFactory } from '../../system/component-factory.js';

export class RpcConnectionPoolAdapter {
  static initialized = false;

  /**
   * Initialize the adapter by registering components if needed
   */
  static async initialize() {
    if (this.initialized) return;
    
    // Check if rpc-connection-pool is already registered
    try {
      await componentFactory.create('rpc-connection-pool', { useFakes: false });
      this.initialized = true;
      return;
    } catch (err) {
      // Not registered, so register it now
    }

    // Register real factory
    const realFactory = async (config, logger) => {
      const { default: RpcConnectionPool } = await import('../detection/transport/rpc-connection-pool.js');
      return new RpcConnectionPool({
        endpoints: [
          process.env.CHAINSTACK_RPC_URL,
          process.env.HELIUS_RPC_URL,
          process.env.PUBLIC_RPC_URL
        ].filter(Boolean),
        debug: false
      });
    };

    // Register fake factory
    const fakeFactory = async (config, logger) => {
      return {
        async call(method, params = []) {
          switch (method) {
            case 'getSlot':
              return 123456789;
            case 'getBlockHeight':
              return 100000000;
            case 'getBalance':
              return 1000000000;
            case 'getAccountInfo':
              return {
                lamports: 1000000000,
                owner: '11111111111111111111111111111111',
                executable: false,
                rentEpoch: 300
              };
            default:
              throw new Error(`Unknown method: ${method}`);
          }
        },
        async destroy() {
          // No-op for fake
        },
        async isHealthy() {
          return true;
        },
        getStats() {
          return {
            global: {
              calls: 100,
              successes: 100,
              failures: 0,
              successRate: '100%'
            },
            endpoints: []
          };
        }
      };
    };

    componentFactory.register('rpc-connection-pool', realFactory, fakeFactory);
    this.initialized = true;
  }

  /**
   * Create RPC connection pool based on environment
   */
  static async create(options = {}) {
    await this.initialize();
    return await componentFactory.create('rpc-connection-pool', options);
  }

  /**
   * Create real RPC connection pool
   */
  static async createReal() {
    await this.initialize();
    return await componentFactory.create('rpc-connection-pool', { useFakes: false });
  }

  /**
   * Create fake RPC connection pool for testing
   */
  static async createFake() {
    await this.initialize();
    return await componentFactory.create('rpc-connection-pool', { useFakes: true });
  }
}