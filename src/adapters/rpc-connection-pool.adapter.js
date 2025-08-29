// File: src/adapters/rpc-connection-pool.adapter.js  
// Real/fake switching adapter

import { componentFactory } from '../../system/component-factory.js';

export class RpcConnectionPoolAdapter {
  /**
   * Create RPC connection pool based on environment
   */
  static async create(options = {}) {
    return await componentFactory.create('rpc-connection-pool', options);
  }

  /**
   * Create real RPC connection pool
   */
  static async createReal() {
    return await componentFactory.create('rpc-connection-pool', { useFakes: false });
  }

  /**
   * Create fake RPC connection pool for testing
   */
  static async createFake() {
    return await componentFactory.create('rpc-connection-pool', { useFakes: true });
  }
}