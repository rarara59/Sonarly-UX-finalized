// src/services/rpc-connection-manager.ts
import axios from 'axios';
import { performance } from 'perf_hooks';
import winston from 'winston';
import { config } from '../config'; // Import using named export
import { Connection, ConnectionConfig } from '@solana/web3.js';

interface RpcEndpoint {
  url: string;
  apiKey: string;
  rateLimit: number;
  active: boolean;
  health: number;
  responseTime: number;
  failCount: number;
  lastCall: number;
  callCount: number;
  connection?: Connection; // Solana Connection object
}

interface Endpoints {
  [key: string]: RpcEndpoint;
}

interface CacheItem {
  data: any;
  timestamp: number;
}

interface RpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

interface EndpointStatus {
  name: string;
  active: boolean;
  health: number;
  responseTime: number;
  callCount: number;
  failCount: number;
}

class RPCConnectionManager {
  private logger: winston.Logger;
  private endpoints: Endpoints;
  private cache: Map<string, CacheItem>;
  private cacheExpiry: number;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'rpc-connection-manager' },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    // Initialize Solana RPC endpoints using existing config
    this.endpoints = {
      // Primary endpoint (Chainstack)
      chainstack: {
        url: config.solanaRpcEndpoint,
        apiKey: '',  // Chainstack RPC URL already contains auth info
        rateLimit: 250, // Based on Growth plan
        active: true,
        health: 100,
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0
      },
      // Optional backup endpoints
      helius: {
        url: 'https://mainnet.helius-rpc.com',
        apiKey: process.env.HELIUS_API_KEY || '',
        rateLimit: 200,
        active: process.env.HELIUS_API_KEY ? true : false,
        health: 100,
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0
      },
      public: {
        url: 'https://api.mainnet-beta.solana.com',
        apiKey: '',
        rateLimit: 100, // Public endpoint has lower rate limits
        active: true,
        health: 80, // Start with lower health to prefer Chainstack
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0
      }
    };

    // Initialize Solana Connection objects
    for (const [name, endpoint] of Object.entries(this.endpoints)) {
      try {
        // Skip initialization if URL is not properly configured
        if (!endpoint.url) {
          this.logger.warn(`Skipping ${name} initialization: missing URL`);
          endpoint.active = false;
          continue;
        }

        const connectionConfig: ConnectionConfig = {
          commitment: 'confirmed',
          disableRetryOnRateLimit: false,
          confirmTransactionInitialTimeout: 60000 // 60 seconds
        };
        
        // Set up Helius with API key as URL parameter if available
        if (name === 'helius' && endpoint.apiKey) {
          endpoint.url = `${endpoint.url}?api-key=${endpoint.apiKey}`;
        }

        endpoint.connection = new Connection(endpoint.url, connectionConfig);
        this.logger.info(`Initialized Solana connection for ${name}`);
      } catch (err) {
        this.logger.error(`Failed to initialize Solana connection for ${name}:`, err);
        endpoint.active = false;
      }
    }

    // Cache for responses
    this.cache = new Map<string, CacheItem>();
    this.cacheExpiry = 60000; // 1 minute cache expiry by default
    
    // Start health monitoring
    this.startHealthMonitoring();
  }

  // Rest of the class implementation remains the same
  // ...

  // Get the best available endpoint based on health and load balancing
  getBestEndpoint(): string {
    const activeEndpoints = Object.entries(this.endpoints)
      .filter(([_, endpoint]) => endpoint.active && endpoint.health > 20)
      .sort((a, b) => {
        // Sort by health score first
        if (b[1].health !== a[1].health) {
          return b[1].health - a[1].health;
        }
        // Then by response time
        return a[1].responseTime - b[1].responseTime;
      });

    if (activeEndpoints.length === 0) {
      this.logger.error('No healthy Solana RPC endpoints available!');
      throw new Error('No healthy Solana RPC endpoints available');
    }
    
    return activeEndpoints[0][0]; // Return the name of the best endpoint
  }

  // Get Solana Connection object for the best endpoint
  getBestConnection(): Connection {
    const endpointName = this.getBestEndpoint();
    const endpoint = this.endpoints[endpointName];
    
    if (!endpoint.connection) {
      // Re-create connection if it doesn't exist
      try {
        endpoint.connection = new Connection(endpoint.url, {
          commitment: 'confirmed',
          disableRetryOnRateLimit: false
        });
      } catch (err) {
        this.logger.error(`Failed to create Solana connection for ${endpointName}:`, err);
        throw new Error(`Failed to create Solana connection for ${endpointName}`);
      }
    }
    
    return endpoint.connection;
  }

  // Send Solana RPC request with fallback and caching
  async sendRequest(
    method: string, 
    params: any[], 
    cacheKey: string | null = null, 
    forcedEndpoint: string | null = null
  ): Promise<RpcResponse> {
    // Check cache first if cacheKey provided
    if (cacheKey && this.cache.has(cacheKey)) {
      const cachedItem = this.cache.get(cacheKey)!;
      if (Date.now() - cachedItem.timestamp < this.cacheExpiry) {
        return cachedItem.data;
      } else {
        this.cache.delete(cacheKey); // Expired cache item
      }
    }

    // Select endpoint
    const endpointName = forcedEndpoint || this.getBestEndpoint();
    const endpoint = this.endpoints[endpointName];
    
    // Prepare request
    const payload = {
      jsonrpc: '2.0',
      method,
      params,
      id: Date.now()
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if present and not already in URL (like Helius)
    if (endpoint.apiKey && !endpoint.url.includes('api-key=')) {
      headers['Authorization'] = `Bearer ${endpoint.apiKey}`;
    }

    try {
      endpoint.lastCall = Date.now();
      endpoint.callCount++;
      const startTime = performance.now();
      
      const response = await axios.post<RpcResponse>(endpoint.url, payload, { headers });
      
      // Update endpoint metrics
      const endTime = performance.now();
      endpoint.responseTime = endTime - startTime;
      endpoint.failCount = Math.max(0, endpoint.failCount - 1); // Decrease fail count on success
      this.updateEndpointHealth(endpointName);

      // Cache the result if cacheKey provided
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data: response.data,
          timestamp: Date.now()
        });
      }

      return response.data;
    } catch (error) {
      // Update endpoint metrics
      endpoint.failCount++;
      this.updateEndpointHealth(endpointName);
      
      this.logger.error(`Solana RPC request failed for ${endpointName}:`, {
        error: error instanceof Error ? error.message : String(error),
        method,
        endpoint: endpointName
      });

      // Try fallback if this wasn't already a fallback request
      if (!forcedEndpoint) {
        const fallbackEndpoints = Object.keys(this.endpoints)
          .filter(name => name !== endpointName && this.endpoints[name].active);
        
        if (fallbackEndpoints.length > 0) {
          this.logger.info(`Trying fallback to ${fallbackEndpoints[0]}`);
          return this.sendRequest(method, params, cacheKey, fallbackEndpoints[0]);
        }
      }
      
      throw error;
    }
  }

  // Update health score for an endpoint
  updateEndpointHealth(endpointName: string): void {
    const endpoint = this.endpoints[endpointName];
    
    // Health calculation based on failure rate and response time
    const maxAcceptableResponseTime = 500; // ms
    const responseTimeFactor = Math.min(1, endpoint.responseTime / maxAcceptableResponseTime);
    
    // Calculate fail rate over recent calls
    const recentFailRate = endpoint.callCount > 0 ? 
      endpoint.failCount / Math.min(endpoint.callCount, 100) : 0;
      
    // New health score (weighted)
    endpoint.health = Math.max(0, Math.min(100, 
      100 - (recentFailRate * 80) - (responseTimeFactor * 20)
    ));
    
    // Deactivate endpoint if health is too low
    if (endpoint.health < 10) {
      this.logger.warn(`Deactivating unhealthy Solana endpoint: ${endpointName}`);
      endpoint.active = false;
      
      // Schedule reactivation check
      setTimeout(() => this.checkEndpointReactivation(endpointName), 60000);
    }
  }

  // Check if a deactivated endpoint can be reactivated
  async checkEndpointReactivation(endpointName: string): Promise<void> {
    const endpoint = this.endpoints[endpointName];
    
    try {
      // Send a simple health check request - getVersion for Solana
      const response = await axios.post<RpcResponse>(
        endpoint.url, 
        {
          jsonrpc: '2.0',
          method: 'getVersion',
          params: [],
          id: Date.now()
        }, 
        {
          headers: {
            'Content-Type': 'application/json',
            ...(endpoint.apiKey && !endpoint.url.includes('api-key=') ? { 'Authorization': `Bearer ${endpoint.apiKey}` } : {})
          },
          timeout: 3000 // Short timeout for health check
        }
      );
      
      if (response.data && !response.data.error) {
        this.logger.info(`Reactivating Solana endpoint: ${endpointName}`);
        endpoint.active = true;
        endpoint.health = 50; // Start with moderate health
        endpoint.failCount = 0;
        
        // Re-create the connection
        try {
          endpoint.connection = new Connection(endpoint.url, {
            commitment: 'confirmed',
            disableRetryOnRateLimit: false
          });
        } catch (err) {
          this.logger.error(`Failed to recreate Solana connection for ${endpointName}:`, err);
        }
      }
    } catch (error) {
      this.logger.warn(`Solana endpoint ${endpointName} still unhealthy, keeping deactivated`);
      // Schedule another check
      setTimeout(() => this.checkEndpointReactivation(endpointName), 300000); // 5 minutes
    }
  }

  // Start periodic health checks
  startHealthMonitoring(): void {
    setInterval(() => {
      Object.keys(this.endpoints).forEach(async (endpointName) => {
        if (this.endpoints[endpointName].active) {
          try {
            const startTime = performance.now();
            // Use Solana's getVersion method for health checks
            await this.sendRequest('getVersion', [], null, endpointName);
            const responseTime = performance.now() - startTime;
            
            this.endpoints[endpointName].responseTime = responseTime;
            this.updateEndpointHealth(endpointName);
            
            this.logger.debug(`Health check for ${endpointName}: ${this.endpoints[endpointName].health}`);
          } catch (error) {
            // Error handling already done in sendRequest
          }
        }
      });
      
      // Clean expired cache items
      this.cleanCache();
    }, 30000); // Every 30 seconds
  }

  // Clean expired cache items
  cleanCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheExpiry) {
        this.cache.delete(key);
      }
    }
  }

  // Get RPC connection status for all endpoints
  getStatus(): EndpointStatus[] {
    return Object.entries(this.endpoints).map(([name, endpoint]) => ({
      name,
      active: endpoint.active,
      health: endpoint.health,
      responseTime: endpoint.responseTime,
      callCount: endpoint.callCount,
      failCount: endpoint.failCount
    }));
  }

  // Solana-specific methods below
  
  // Get latest signatures for address
  async getSignaturesForAddress(address: string, limit: number = 100): Promise<any[]> {
    try {
      const cacheKey = `signatures_${address}_${limit}`;
      const response = await this.sendRequest(
        'getSignaturesForAddress',
        [address, { limit }],
        cacheKey
      );
      
      return response.result || [];
    } catch (error) {
      this.logger.error(`Failed to get signatures for address ${address}:`, error);
      throw error;
    }
  }
  
  // Get transaction details
  async getTransaction(signature: string): Promise<any> {
    try {
      const cacheKey = `tx_${signature}`;
      const response = await this.sendRequest(
        'getTransaction',
        [signature, { encoding: 'json', maxSupportedTransactionVersion: 0 }],
        cacheKey
      );
      
      return response.result;
    } catch (error) {
      this.logger.error(`Failed to get transaction ${signature}:`, error);
      throw error;
    }
  }
  
  // Get token accounts by owner
  async getTokenAccountsByOwner(owner: string): Promise<any[]> {
    try {
      const cacheKey = `token_accounts_${owner}`;
      const response = await this.sendRequest(
        'getTokenAccountsByOwner',
        [
          owner,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }, // SPL Token program ID
          { encoding: 'jsonParsed' }
        ],
        cacheKey
      );
      
      return response.result?.value || [];
    } catch (error) {
      this.logger.error(`Failed to get token accounts for owner ${owner}:`, error);
      throw error;
    }
  }
  
  // Get token supply
  async getTokenSupply(mintAddress: string): Promise<any> {
    try {
      const cacheKey = `token_supply_${mintAddress}`;
      const response = await this.sendRequest(
        'getTokenSupply',
        [mintAddress],
        cacheKey
      );
      
      return response.result?.value;
    } catch (error) {
      this.logger.error(`Failed to get token supply for ${mintAddress}:`, error);
      throw error;
    }
  }
  
  // Get recent block hash (needed for transaction building)
  async getRecentBlockhash(): Promise<string> {
    try {
      const response = await this.sendRequest(
        'getRecentBlockhash',
        [],
        'recent_blockhash_' + Math.floor(Date.now() / 30000) // Cache for 30 seconds
      );
      
      return response.result?.value?.blockhash;
    } catch (error) {
      this.logger.error('Failed to get recent blockhash:', error);
      throw error;
    }
  }
  
  // Get account info (for checking token metadata, etc)
  async getAccountInfo(address: string): Promise<any> {
    try {
      const cacheKey = `account_${address}`;
      const response = await this.sendRequest(
        'getAccountInfo',
        [address, { encoding: 'jsonParsed' }],
        cacheKey
      );
      
      return response.result?.value;
    } catch (error) {
      this.logger.error(`Failed to get account info for ${address}:`, error);
      throw error;
    }
  }
  
  // Get program accounts (useful for finding token mints, etc)
  async getProgramAccounts(programId: string, filters: any[] = []): Promise<any[]> {
    try {
      // Don't cache program accounts as they can be large and change frequently
      const response = await this.sendRequest(
        'getProgramAccounts',
        [
          programId,
          {
            encoding: 'jsonParsed',
            filters
          }
        ]
      );
      
      return response.result || [];
    } catch (error) {
      this.logger.error(`Failed to get program accounts for ${programId}:`, error);
      throw error;
    }
  }
}

export default new RPCConnectionManager();