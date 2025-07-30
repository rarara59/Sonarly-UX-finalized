import https from 'https';

class WorkingRPCManager {
  constructor() {
    this.cache = new Map();
  }

  async makeRPCCall(method, params = []) {
    const data = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    });
    
    const options = {
      hostname: 'mainnet.helius-rpc.com',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 8000,
      family: 4
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

  async getTokenAccountsByOwner(ownerAddress, filter) {
    return await this.makeRPCCall('getTokenAccountsByOwner', [
      ownerAddress,
      filter,
      { encoding: 'jsonParsed' }
    ]);
  }

  async getSignaturesForAddress(address, limit = 10) {
    return await this.makeRPCCall('getSignaturesForAddress', [
      address,
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

export default new WorkingRPCManager();
