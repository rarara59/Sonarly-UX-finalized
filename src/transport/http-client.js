/**
 * Renaissance HTTP Client
 * Simple, Fast, Reliable - No Academic Over-Engineering
 * Target: Fast RPC calls with connection reuse
 */

import https from 'https';
import http from 'http';

export class HTTPClient {
  constructor(options = {}) {
    // Simple connection pooling - proven settings
    this.httpsAgent = new https.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000
    });
    
    this.httpAgent = new http.Agent({
      keepAlive: true,
      maxSockets: 50,
      maxFreeSockets: 10,
      timeout: 30000
    });
    
    // Simple stats
    this.stats = {
      requests: 0,
      errors: 0
    };
  }

  // Main request method - simple and reliable
  async request(url, options = {}) {
    this.stats.requests++;
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;
      const agent = isHttps ? this.httpsAgent : this.httpAgent;
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Renaissance-Trading-Bot/1.0',
          'Accept': 'application/json',
          'Connection': 'keep-alive',
          ...options.headers
        },
        agent,
        timeout: options.timeout || 30000
      };

      // Handle request body
      let bodyData = null;
      if (options.body) {
        bodyData = typeof options.body === 'string' 
          ? options.body 
          : JSON.stringify(options.body);
        requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyData);
        requestOptions.headers['Content-Type'] = 'application/json';
      }

      const req = client.request(requestOptions, (res) => {
        let responseBody = '';
        
        res.setEncoding('utf8');
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          try {
            // Try to parse as JSON, fallback to text
            let data;
            try {
              data = JSON.parse(responseBody);
            } catch {
              data = responseBody;
            }
            
            resolve({
              status: res.statusCode,
              data: data
            });
          } catch (error) {
            this.stats.errors++;
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        this.stats.errors++;
        reject(error);
      });
      
      req.on('timeout', () => {
        req.destroy();
        this.stats.errors++;
        reject(new Error('Request timeout'));
      });

      // Send body if present
      if (bodyData) {
        req.write(bodyData);
      }
      
      req.end();
    });
  }

  // Simple HTTP methods
  async get(url, headers = {}) {
    return this.request(url, { method: 'GET', headers });
  }

  async post(url, body, headers = {}) {
    return this.request(url, { method: 'POST', body, headers });
  }

  // RPC-specific method - handles Solana RPC format
  async rpcCall(url, method, params) {
    const rpcPayload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };
    
    const response = await this.post(url, rpcPayload);
    
    // Handle RPC errors
    if (response.data?.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }
    
    return response.data?.result;
  }

  // Simple stats
  getStats() {
    return {
      requests: this.stats.requests,
      errors: this.stats.errors,
      errorRate: this.stats.requests > 0 
        ? this.stats.errors / this.stats.requests 
        : 0
    };
  }

  // Health check
  isHealthy() {
    const stats = this.getStats();
    return stats.errorRate < 0.1; // Less than 10% error rate
  }

  // Simple cleanup - just null the agents
  destroy() {
    this.httpsAgent = null;
    this.httpAgent = null;
  }
}