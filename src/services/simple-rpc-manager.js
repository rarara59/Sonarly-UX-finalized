import https from 'https';
import { PublicKey } from '@solana/web3.js';

class SimpleRPCManager {
  constructor() {
    this.endpoints = {
      public: 'mainnet.helius-rpc.com',
      helius: process.env.HELIUS_API_KEY ? 'mainnet.helius-rpc.com' : null
    };
  }

  async makeRPCCall(method, params = [], endpoint = 'public') {
    const hostname = this.endpoints[endpoint] || this.endpoints.public;
    
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    });
    
    const options = {
      hostname,
      port: 443,
      path: endpoint === 'helius' && process.env.HELIUS_API_KEY ? 
        `/?api-key=${process.env.HELIUS_API_KEY}` : '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 5000,
      family: 4  // Force IPv4
    };
    
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.error) {
              reject(new Error(`RPC Error: ${parsed.error.message}`));
            } else {
              resolve(parsed.result);
            }
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(data);
      req.end();
    });
  }

  async getTokenAccountsByOwner(owner, filter) {
    return await this.makeRPCCall('getTokenAccountsByOwner', [
      owner.toString(),
      filter,
      { encoding: 'jsonParsed' }
    ]);
  }

  async getSignaturesForAddress(address, limit = 10) {
    return await this.makeRPCCall('getSignaturesForAddress', [
      address.toString(),
      { limit }
    ]);
  }

  async getTransaction(signature) {
    return await this.makeRPCCall('getTransaction', [
      signature,
      { encoding: 'json', maxSupportedTransactionVersion: 0 }
    ]);
  }
}

export default new SimpleRPCManager();
