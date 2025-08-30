/**
 * RPC Connection Pool Adapter
 * Provides real/fake switching capability for testing
 */

export class RpcConnectionPoolAdapter {
  static async create() {
    const useFakes = process.env.USE_FAKES === 'true';
    
    if (useFakes) {
      // Return fake implementation for testing
      return {
        async call(method, params = []) {
          // Simulate RPC responses
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
        
        isHealthy() {
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
    } else {
      // Return real implementation
      const { default: RpcConnectionPool } = await import('../src/detection/transport/rpc-connection-pool.js');
      return new RpcConnectionPool({
        endpoints: [
          process.env.CHAINSTACK_RPC_URL,
          process.env.HELIUS_RPC_URL,
          process.env.PUBLIC_RPC_URL
        ].filter(Boolean),
        debug: false
      });
    }
  }
}

export default RpcConnectionPoolAdapter;