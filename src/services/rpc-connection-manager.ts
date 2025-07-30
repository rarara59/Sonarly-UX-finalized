// src/services/rpc-connection-manager.ts
import axios from 'axios';
import { performance } from 'perf_hooks';
import winston from 'winston';
import { config } from '../config';
import { Connection, ConnectionConfig, PublicKey } from '@solana/web3.js';

// =============================================
// INTERFACES
// =============================================

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
  connection?: Connection;
  priority?: number; // Higher number = higher priority
  specializations?: string[]; // e.g. ['memecoins', 'lp-detection']
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
  specializations?: string[];
}

interface QueuedRequest {
  endpoint: string;
  method: string;
  params: any[];
  priority: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  methodCategory: string;
}

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  lpValueUSD: number;
  quoteToken: string;
  network: string;
  source: string;
  timestamp: number;
}

// Method categories for specialized handling
enum MethodCategory {
  LP_DISCOVERY = 'lp_discovery',
  TOKEN_INFO = 'token_info',
  TRANSACTION = 'transaction',
  ACCOUNT = 'account',
  GENERAL = 'general'
}

// OPTIMIZATION: Faster cache expiry times for meme coin trading
const CACHE_EXPIRY_TIMES = {
  [MethodCategory.LP_DISCOVERY]: 15000,  // REDUCED: 15 seconds (was 30s) for faster LP detection
  [MethodCategory.TOKEN_INFO]: 30000,    // REDUCED: 30 seconds (was 1 min) for faster token info updates
  [MethodCategory.TRANSACTION]: 120000,  // REDUCED: 2 minutes (was 5 min) for recent tx data
  [MethodCategory.ACCOUNT]: 30000,       // REDUCED: 30 seconds (was 1 min) for account updates
  [MethodCategory.GENERAL]: 60000        // Keep 1 minute for general calls
};

// OPTIMIZATION: Increased timeouts for premium providers
const METHOD_TIMEOUTS = {
  [MethodCategory.LP_DISCOVERY]: 15000,   // INCREASED: 15 seconds (was 5s)
  [MethodCategory.TOKEN_INFO]: 10000,     // INCREASED: 10 seconds (was 3s)
  [MethodCategory.TRANSACTION]: 12000,    // INCREASED: 12 seconds (was 4s)
  [MethodCategory.ACCOUNT]: 10000,        // INCREASED: 10 seconds (was 3s)
  [MethodCategory.GENERAL]: 8000          // INCREASED: 8 seconds (was 3s)
};

// Method to category mapping
const METHOD_CATEGORIES: Record<string, MethodCategory> = {
  'getProgramAccounts': MethodCategory.LP_DISCOVERY,
  'getAccountInfo': MethodCategory.ACCOUNT,
  'getTokenSupply': MethodCategory.TOKEN_INFO,
  'getTransaction': MethodCategory.TRANSACTION,
  'getSignaturesForAddress': MethodCategory.TRANSACTION,
  'getTokenAccountsByOwner': MethodCategory.TOKEN_INFO,
  'getMultipleAccounts': MethodCategory.ACCOUNT,
  'getRecentBlockhash': MethodCategory.GENERAL
};

// =============================================
// CORE RPC CONNECTION MANAGER CLASS
// =============================================

export class RPCConnectionManager {
  private logger: winston.Logger;
  private endpoints: Endpoints;
  private cache: Map<string, CacheItem>;
  private requestQueue: Map<string, QueuedRequest[]>;
  private processing: Map<string, boolean>;
  
  // OPTIMIZATION: Increased limits for premium providers
  private maxConcurrentRequests: number = 15; // INCREASED from 5 to 15
  private requestsPerSecond: number = 50; // INCREASED from 8 to 50 for premium providers
  
  private lpScanInterval: NodeJS.Timeout | undefined;
  private isLPScanning: boolean = false;
  private lpScanConcurrencyLimit: number = 10; // INCREASED from 5 to 10
  private maxLPsPerScan: number = 50; // INCREASED from 20 to 50
  private recentLPMemo: Set<string> = new Set();
  private apiClient: APIClient;
  
  constructor() {
    this.logger = this.initializeLogger();
    this.endpoints = this.initializeEndpoints();
    this.cache = new Map<string, CacheItem>();
    this.requestQueue = new Map();
    this.processing = new Map();
    this.apiClient = new APIClient(this);
    
    // OPTIMIZATION: Actually initialize the connections! (was commented out)
    this.initializeSolanaConnections();
    this.startRequestProcessor();
    this.startHealthMonitoring();
  }

  // ========== INITIALIZATION METHODS ==========

  private initializeLogger(): winston.Logger {
    return winston.createLogger({
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
  }

  // OPTIMIZATION: Enhanced endpoint configuration for premium providers
  private initializeEndpoints(): Endpoints {
    return {
      helius: {
        url: 'https://mainnet.helius-rpc.com',
        apiKey: process.env.HELIUS_API_KEY || '',
        rateLimit: 500, // INCREASED: Helius premium allows much higher (was 200)
        active: Boolean(process.env.HELIUS_API_KEY),
        health: 100,
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0,
        priority: 10, // Highest priority for meme coins
        specializations: ['memecoins', 'lp-detection', 'token-metadata', 'fast-execution']
      },
      chainstack: {
        url: config.solanaRpcEndpoint,
        apiKey: '',
        rateLimit: 1000, // INCREASED: Chainstack can handle very high throughput (was 250)
        active: true,
        health: 100,
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0,
        priority: 8, // High priority for bulk operations (was 5)
        specializations: ['bulk-operations', 'execution', 'program-accounts']
      },
      public: {
        url: 'https://mainnet.helius-rpc.com',
        apiKey: '',
        rateLimit: 50, // Keep conservative for public endpoint (was 100)
        active: true,
        health: 60, // Lower health to deprioritize (was 80)
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0,
        priority: 1, // Lowest priority, emergency fallback only
        specializations: ['general', 'fallback']
      }
    };
  }

  private initializeSolanaConnections(): void {
    for (const [name, endpoint] of Object.entries(this.endpoints)) {
      try {
        if (!endpoint.url) {
          this.logger.warn(`Skipping ${name} initialization: missing URL`);
          endpoint.active = false;
          continue;
        }

        const connectionConfig: ConnectionConfig = {
          commitment: 'confirmed',
          disableRetryOnRateLimit: false,
          confirmTransactionInitialTimeout: 60000
        };
        
        // Set up Helius with API key
        let connectionUrl = endpoint.url;
        if (name === 'helius' && endpoint.apiKey) {
          connectionUrl = `${endpoint.url}?api-key=${endpoint.apiKey}`;
        }

        endpoint.connection = new Connection(connectionUrl, connectionConfig);
        this.requestQueue.set(name, []);
        this.processing.set(name, false);
        this.logger.info(`Initialized Solana connection for ${name}`);
      } catch (err) {
        this.logger.error(`Failed to initialize Solana connection for ${name}:`, err);
        endpoint.active = false;
      }
    }
  }

  // ========== REQUEST PROCESSING ==========

  // OPTIMIZATION: Faster request processing with less conservative throttling
  private startRequestProcessor(): void {
    setInterval(() => {
      for (const [endpointName, endpoint] of Object.entries(this.endpoints)) {
        if (!endpoint.active || this.processing.get(endpointName)) continue;
        
        const queue = this.requestQueue.get(endpointName) || [];
        if (queue.length === 0) continue;

        this.processQueuedRequests(endpointName, endpoint);
      }
    }, 100); // OPTIMIZED: Process every 100ms instead of 1000/requestsPerSecond for faster throughput
  }

  // OPTIMIZATION: Enhanced batch processing for premium providers
  private async processQueuedRequests(endpointName: string, endpoint: RpcEndpoint): Promise<void> {
    this.processing.set(endpointName, true);
    const queue = this.requestQueue.get(endpointName) || [];
    
    // Sort by priority (higher first)
    queue.sort((a, b) => b.priority - a.priority);
    
    // OPTIMIZATION: Larger batches for premium providers
    let batchSize = this.maxConcurrentRequests;
    if (endpointName === 'helius' || endpointName === 'chainstack') {
      batchSize = Math.min(20, this.maxConcurrentRequests * 2); // Double batch size for premium
    }
    
    const batch = queue.splice(0, batchSize);
    
    const promises = batch.map(async (request) => {
      try {
        const methodCategory = METHOD_CATEGORIES[request.method] || MethodCategory.GENERAL;
        const timeout = METHOD_TIMEOUTS[methodCategory];
        
        const result = await Promise.race([
          this.executeRpcCall(endpoint, request.method, request.params, endpointName),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
          )
        ]);
        
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }
    });

    await Promise.allSettled(promises);
    this.processing.set(endpointName, false);
  }

  // OPTIMIZATION: Enhanced RPC call execution with better error handling
  private async executeRpcCall(
    endpoint: RpcEndpoint,
    method: string,
    params: any[],
    forcedEndpoint?: string,
    isRetry: boolean = false
  ): Promise<any> {
    const startTime = performance.now();
    
    // STEP 1: Check the cache before making the call
    const methodCategory = METHOD_CATEGORIES[method] || MethodCategory.GENERAL;
    const cacheKey = `${method}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_TIMES[methodCategory]) {
      this.logger.debug(`✅ Cache hit for ${cacheKey}`);
      return cached.data;
    }
    
    try {
      // OPTIMIZATION: More lenient rate limiting for premium providers
      const now = Date.now();
      const timeSinceLastCall = now - endpoint.lastCall;
      
      // Calculate minimum interval based on provider capabilities
      let minInterval = 1000 / endpoint.rateLimit;
      
      // OPTIMIZATION: Even more lenient for known premium providers
      if (forcedEndpoint === 'helius' || forcedEndpoint === 'chainstack') {
        minInterval = minInterval * 0.5; // Allow 2x faster calls for premium
      }
      
      if (timeSinceLastCall < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
      }

      endpoint.lastCall = Date.now();
      endpoint.callCount++;

      // OPTIMIZATION: Prefer Solana native methods for better performance
      const solanaMethods = new Set([
        'getAccountInfo',
        'getProgramAccounts',
        'getTokenAccountsByOwner',
        'getMultipleAccounts',
        'getTokenSupply' // ADDED: This is also a native method
      ]);
      
      if (endpoint.connection && solanaMethods.has(method)) {
        const result = await this.executeSolanaMethod(endpoint.connection, method, params);
        // Store Solana method result in cache
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        return result;
      }

      // Prepare headers with API key handling
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // OPTIMIZATION: Better API key handling for Helius
      let requestUrl = endpoint.url;
      if (endpoint.apiKey) {
        if (forcedEndpoint === 'helius') {
          // For Helius, prefer URL parameter method
          requestUrl = endpoint.url.includes('api-key=') 
            ? endpoint.url 
            : `${endpoint.url}?api-key=${endpoint.apiKey}`;
        } else {
          // For others, use Authorization header
          headers['Authorization'] = `Bearer ${endpoint.apiKey}`;
        }
      }

      // OPTIMIZATION: Increased timeout for axios requests to match method timeouts
      const axiosTimeout = METHOD_TIMEOUTS[methodCategory] - 1000; // 1 second buffer

      const response = await axios.post(requestUrl, {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      }, {
        timeout: axiosTimeout,
        headers
      });

      const responseTime = performance.now() - startTime;
      this.updateEndpointStats(endpoint, responseTime, true);

      // Check for RPC-level errors
      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message} (Code: ${response.data.error.code})`);
      }

      // STEP 2: Store the result in the cache
      this.cache.set(cacheKey, {
        data: response.data.result,
        timestamp: Date.now()
      });

      return response.data.result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateEndpointStats(endpoint, responseTime, false);
      
      // OPTIMIZATION: Better error classification for premium providers
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Don't immediately fail premium providers on timeout - they might just be busy
      if ((forcedEndpoint === 'helius' || forcedEndpoint === 'chainstack') && 
          errorMessage.includes('timeout') && !isRetry) {
        this.logger.warn(`Premium provider ${forcedEndpoint} timeout, will retry with fallback`);
      } else {
        this.logger.error(`RPC request failed for endpoint ${forcedEndpoint || 'auto'}:`, {
          error: errorMessage,
          method,
          endpoint: endpoint.url,
          isRetry,
          responseTime
        });
      }

      // OPTIMIZATION: Smarter retry logic for premium providers
      if (!isRetry) {
        // For premium providers, try the other premium provider first
        if (forcedEndpoint === 'helius' && this.endpoints.chainstack.active) {
          this.logger.info(`Retrying with Chainstack after Helius failure`);
          return this.executeRpcCall(this.endpoints.chainstack, method, params, 'chainstack', true);
        } else if (forcedEndpoint === 'chainstack' && this.endpoints.helius.active) {
          this.logger.info(`Retrying with Helius after Chainstack failure`);
          return this.executeRpcCall(this.endpoints.helius, method, params, 'helius', true);
        } else {
          // Fallback to public only as last resort
          const fallbackEndpoint = this.selectFallbackEndpoint(endpoint, method);
          if (fallbackEndpoint) {
            this.logger.info(`Retrying with fallback endpoint: ${fallbackEndpoint.name}`);
            return this.executeRpcCall(fallbackEndpoint.endpoint, method, params, fallbackEndpoint.name, true);
          }
        }
      }

      throw error;
    }
  }

  private async executeSolanaMethod(connection: Connection, method: string, params: any[]): Promise<any> {
    switch (method) {
      case 'getAccountInfo':
        if (!params[0]) throw new Error('Missing pubkey for getAccountInfo');
        return await connection.getAccountInfo(new PublicKey(params[0]));
      case 'getProgramAccounts':
        if (!params[0]) throw new Error('Missing programId for getProgramAccounts');
        const programId = params[0] instanceof PublicKey ? params[0] : new PublicKey(params[0]);
        return await connection.getProgramAccounts(programId, params[1] || {});
      case 'getTokenAccountsByOwner':
        if (!params[0]) throw new Error('Missing owner for getTokenAccountsByOwner');
        return await connection.getTokenAccountsByOwner(
          new PublicKey(params[0]),
          params[1],
          params[2] || {}
        );
      case 'getMultipleAccounts':
        if (!params[0] || !Array.isArray(params[0])) 
          throw new Error('Missing addresses array for getMultipleAccounts');
        const pubkeys = params[0].map(addr => 
          addr instanceof PublicKey ? addr : new PublicKey(addr));
        return await connection.getMultipleAccountsInfo(pubkeys, params[1] || {});
      case 'getTokenSupply':
        if (!params[0]) throw new Error('Missing mint address for getTokenSupply');
        return await connection.getTokenSupply(new PublicKey(params[0]));
      default:
        throw new Error(`Unsupported Solana method: ${method}`);
    }
  }

  // ========== ENDPOINT MANAGEMENT ==========

  // OPTIMIZATION: Enhanced health monitoring for premium providers
  private updateEndpointStats(endpoint: RpcEndpoint, responseTime: number, success: boolean): void {
    endpoint.responseTime = responseTime;
    
    if (success) {
      // Improve health more aggressively for premium providers
      const healthBoost = (endpoint.priority || 0) >= 8 ? 2 : 1; // Premium providers get faster recovery
      endpoint.health = Math.min(100, endpoint.health + healthBoost);
      endpoint.failCount = Math.max(0, endpoint.failCount - 1);
    } else {
      endpoint.failCount++;
      
      // OPTIMIZATION: More forgiving health calculation for premium providers
      const maxAcceptableResponseTime = (endpoint.priority || 0) >= 8 ? 2000 : 500; // Premium can be slower
      const responseTimeFactor = Math.min(1, responseTime / maxAcceptableResponseTime);
      
      const recentFailRate = endpoint.callCount > 0 ? 
        endpoint.failCount / Math.min(endpoint.callCount, 100) : 0;
      
      // Health scoring - be more forgiving to premium providers
      const forgivenessFactor = (endpoint.priority || 0) >= 8 ? 0.5 : 1.0; // 50% more forgiving
      const weights = { failure: 0.7 * forgivenessFactor, latency: 0.3 * forgivenessFactor };
      
      endpoint.health = Math.max(0, Math.min(100,
        100 - (recentFailRate * weights.failure * 100) - (responseTimeFactor * weights.latency * 100)
      ));
      
      // OPTIMIZATION: Don't disable premium providers as quickly
      const disableThreshold = (endpoint.priority || 0) >= 8 ? 5 : 10; // Premium providers get lower threshold
      
      if (endpoint.health < disableThreshold) {
        endpoint.active = false;
        this.logger.warn(`Disabled endpoint due to low health: ${endpoint.url} (health: ${endpoint.health})`);
        
        // OPTIMIZATION: Faster reactivation check for premium providers
        const reactivationDelay = (endpoint.priority || 0) >= 8 ? 30000 : 60000; // 30s vs 60s
        setTimeout(() => this.checkEndpointReactivation(endpoint), reactivationDelay);
      }
    }
  }

  private async checkEndpointReactivation(endpoint: RpcEndpoint): Promise<void> {
    try {
      // Send a simple health check request
      let requestUrl = endpoint.url;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (endpoint.apiKey) {
        if (endpoint.url.includes('helius')) {
          requestUrl = endpoint.url.includes('api-key=') 
            ? endpoint.url 
            : `${endpoint.url}?api-key=${endpoint.apiKey}`;
        } else {
          headers['Authorization'] = `Bearer ${endpoint.apiKey}`;
        }
      }

      const response = await axios.post(requestUrl, {
        jsonrpc: '2.0',
        method: 'getVersion',
        params: [],
        id: Date.now()
      }, {
        timeout: 3000,
        headers
      });

      if (response.data && !response.data.error) {
        this.logger.info(`Reactivating endpoint: ${endpoint.url}`);
        endpoint.active = true;
        endpoint.health = 50;
        endpoint.failCount = 0;
        
        // Re-create the connection
        try {
          let connectionUrl = endpoint.url;
          if (endpoint.apiKey && endpoint.url.includes('helius')) {
            connectionUrl = endpoint.url.includes('api-key=') 
              ? endpoint.url 
              : `${endpoint.url}?api-key=${endpoint.apiKey}`;
          }
            
          endpoint.connection = new Connection(connectionUrl, {
            commitment: 'confirmed',
            disableRetryOnRateLimit: false
          });
        } catch (err) {
          this.logger.error(`Failed to recreate connection for ${endpoint.url}:`, err);
        }
      }
    } catch (error) {
      this.logger.warn(`Endpoint ${endpoint.url} still unhealthy, keeping deactivated`);
      // Schedule another check in 5 minutes
      setTimeout(() => this.checkEndpointReactivation(endpoint), 300000);
    }
  }

  private selectBestEndpoint(method?: string): { name: string; endpoint: RpcEndpoint } | null {
    // Filter active endpoints - prioritize premium providers
    let activeEndpoints = Object.entries(this.endpoints)
      .filter(([_, endpoint]) => endpoint.active);

    // OPTIMIZATION: Exclude public endpoint unless it's the only option
    const premiumEndpoints = activeEndpoints.filter(([name, _]) => name !== 'public');
    if (premiumEndpoints.length > 0) {
      activeEndpoints = premiumEndpoints;
    }
    
    // If method is provided, prioritize endpoints that specialize in this method category
    if (method) {
      const category = METHOD_CATEGORIES[method] || MethodCategory.GENERAL;
      
      // First, try to find endpoints that specialize in this category
      const specializedEndpoints = activeEndpoints.filter(([_, endpoint]) => {
        if (!endpoint.specializations) return false;
        
        // Map category to specialization
        const specialization = category === MethodCategory.LP_DISCOVERY ? 'lp-detection' :
                              category === MethodCategory.TOKEN_INFO ? 'token-metadata' :
                              'general';
                              
        return endpoint.specializations.includes(specialization);
      });
      
      if (specializedEndpoints.length > 0) {
        activeEndpoints = specializedEndpoints;
      }
    }
    
    // Sort by priority first, then by health and response time
    activeEndpoints.sort(([_, a], [__, b]) => {
      // Priority is the main factor (higher priority = better)
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      
      // If priorities are equal, use health and response time
      const scoreA = a.health - (a.responseTime / 100);
      const scoreB = b.health - (b.responseTime / 100);
      return scoreB - scoreA;
    });

    if (activeEndpoints.length === 0) return null;
    
    const [name, endpoint] = activeEndpoints[0];
    return { name, endpoint };
  }

  private selectFallbackEndpoint(
    currentEndpoint: RpcEndpoint, 
    method?: string
  ): { name: string; endpoint: RpcEndpoint } | null {
    // Similar to selectBestEndpoint but excludes the current endpoint
    let fallbackCandidates = Object.entries(this.endpoints)
      .filter(([_, endpoint]) => 
        endpoint.active && 
        endpoint !== currentEndpoint && 
        endpoint.health > 20
      );
    
    if (method) {
      const category = METHOD_CATEGORIES[method] || MethodCategory.GENERAL;
      const specialization = category === MethodCategory.LP_DISCOVERY ? 'lp-detection' :
                            category === MethodCategory.TOKEN_INFO ? 'token-metadata' :
                            'general';
                            
      const specializedFallbacks = fallbackCandidates.filter(([_, endpoint]) => 
        endpoint.specializations?.includes(specialization)
      );
      
      if (specializedFallbacks.length > 0) {
        fallbackCandidates = specializedFallbacks;
      }
    }
    
    // Sort by priority first, then by health
    fallbackCandidates.sort(([_, a], [__, b]) => {
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return b.health - a.health;
    });

    if (fallbackCandidates.length === 0) return null;
    
    const [name, endpoint] = fallbackCandidates[0];
    return { name, endpoint };
  }

  // ========== PUBLIC RPC METHODS ==========

  async call(
    method: string,
    params: any[] = [],
    cacheKey?: string,
    forcedEndpoint?: string,
    priority: number = 1
  ): Promise<any> {
    // Determine method category for specialized handling
    const methodCategory = METHOD_CATEGORIES[method] || MethodCategory.GENERAL;
    
    // Check cache first if cache key provided
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const cacheExpiry = CACHE_EXPIRY_TIMES[methodCategory];
      
      if (Date.now() - cached.timestamp < cacheExpiry) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    // Find best endpoint (or use forced endpoint)
    let endpoint: { name: string; endpoint: RpcEndpoint } | null;
    
    if (forcedEndpoint) {
      if (!this.endpoints[forcedEndpoint] || !this.endpoints[forcedEndpoint].active) {
        throw new Error(`Forced endpoint ${forcedEndpoint} is not available`);
      }
      endpoint = { name: forcedEndpoint, endpoint: this.endpoints[forcedEndpoint] };
    } else {
      endpoint = this.selectBestEndpoint(method);
    }

    if (!endpoint) {
      throw new Error('No active RPC endpoints available');
    }

    // Queue the request
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        endpoint: endpoint!.name,
        method,
        params,
        priority,
        methodCategory,
        resolve: (result) => {
          // Cache the result if cache key provided
          if (cacheKey) {
            this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
          }
          resolve(result);
        },
        reject,
        timestamp: Date.now()
      };

      const queue = this.requestQueue.get(endpoint!.name) || [];
      queue.push(request);
      this.requestQueue.set(endpoint!.name, queue);
    });
  }

  // ========== CONVENIENCE METHODS ==========

  async getAccountInfo(address: string, priority: number = 1): Promise<any> {
    return this.call(
      'getAccountInfo', 
      [address, { encoding: 'jsonParsed' }], 
      `account_${address}`, 
      undefined, 
      priority
    );
  }

  async getMultipleAccounts(addresses: string[], priority: number = 1): Promise<any[]> {
    if (addresses.length === 0) return [];
    
    // Solana RPC has a limit on batch requests, chunk if necessary
    const chunkSize = 100;
    const chunks = [];
    
    for (let i = 0; i < addresses.length; i += chunkSize) {
      chunks.push(addresses.slice(i, i + chunkSize));
    }
    
    const results = await Promise.all(chunks.map(async (chunk) => {
      const cacheKey = `accounts_batch_${chunk.join(',')}`;
      const response = await this.call(
        'getMultipleAccounts',
        [chunk, { encoding: 'jsonParsed' }],
        cacheKey,
        undefined,
        priority
      );
      return response?.value || [];
    }));
    
    return results.flat();
  }

  // OPTIMIZATION: Enhanced getSignaturesForAddress with better limits
  async getSignaturesForAddress(address: string, limit: number = 100, priority: number | string = 1): Promise<any[]> {
    const cacheKey = `signatures_${address}_${limit}`;
    
    // Convert priority to number for internal use
    const numericPriority = typeof priority === 'string' ? 
      (priority === 'chainstack' ? 3 : priority === 'helius' ? 4 : 1) : priority;
    
    // OPTIMIZATION: Smarter limit adjustment based on provider capabilities
    let adjustedLimit = limit;
    let preferredEndpoint: string | undefined;
    
    if (priority === 'chainstack' || priority === 3) {
      adjustedLimit = Math.min(limit, 200); // Chainstack can handle more
      preferredEndpoint = 'chainstack';
    } else if (priority === 'helius' || priority === 4) {
      adjustedLimit = Math.min(limit, 500); // Helius can handle even more
      preferredEndpoint = 'helius';
    } else {
      adjustedLimit = Math.min(limit, 50); // Conservative for public
    }
    
    try {
      return await this.call(
        'getSignaturesForAddress',
        [new PublicKey(address), { limit: adjustedLimit }],
        cacheKey,
        preferredEndpoint,
        numericPriority
      );
    } catch (error) {
      const err = error as any;
      if (err.message?.includes('WrongSize') || err.message?.includes('Invalid param')) {
        // Progressive fallback with smaller limits
        const fallbackLimits = [100, 50, 20, 10];
        
        for (const fallbackLimit of fallbackLimits) {
          if (fallbackLimit >= adjustedLimit) continue;
          
          try {
            return await this.call(
              'getSignaturesForAddress',
              [new PublicKey(address), { limit: fallbackLimit }],
              `signatures_${address}_${fallbackLimit}`,
              preferredEndpoint,
              numericPriority
            );
          } catch (fallbackError) {
            continue; // Try next smaller limit
          }
        }
      }
      
      // If all else fails, return empty array instead of throwing
      this.logger.warn(`All signature fetch attempts failed for ${address}, returning empty array`);
      return [];
    }
  }

  async getTransaction(signature: string, priority: number = 1): Promise<any> {
    const cacheKey = `tx_${signature}`;
    return this.call(
      'getTransaction',
      [signature, { encoding: 'json', maxSupportedTransactionVersion: 0 }],
      cacheKey,
      undefined,
      priority
    );
  }

  async getMultipleTransactions(signatures: string[], priority: number = 1): Promise<any[]> {
    if (signatures.length === 0) return [];
    
    // Optimize by checking cache first
    const cachedResults: any[] = [];
    const uncachedSignatures: string[] = [];
    
    signatures.forEach(sig => {
      const cacheKey = `tx_${sig}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_EXPIRY_TIMES[MethodCategory.TRANSACTION]) {
          cachedResults.push(cached.data);
          return;
        }
      }
      uncachedSignatures.push(sig);
    });
    
    // Fetch uncached transactions in parallel
    const uncachedResults = await Promise.all(
      uncachedSignatures.map(sig => this.getTransaction(sig, priority))
    );
    
    // Combine and return results in original order
    const resultMap = new Map();
    cachedResults.forEach(result => resultMap.set(result?.transaction?.signatures?.[0], result));
    uncachedResults.forEach(result => resultMap.set(result?.transaction?.signatures?.[0], result));
    
    return signatures.map(sig => resultMap.get(sig)).filter(Boolean);
  }

  async getTokenAccountsByOwner(owner: string, programId?: string, priority: number = 1): Promise<any[]> {
    const cacheKey = `token_accounts_${owner}_${programId || 'default'}`;
    const response = await this.call(
      'getTokenAccountsByOwner',
      [
        new PublicKey(owner),
        { programId: new PublicKey(programId || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') },
        { encoding: 'base64' }
      ],
      cacheKey,
      undefined,
      priority
    );
    return response?.value || [];
  }

  async getTokenSupply(mintAddress: string, priority: number = 1): Promise<any> {
    const cacheKey = `token_supply_${mintAddress}`;
    const response = await this.call('getTokenSupply', [mintAddress], cacheKey, undefined, priority);
    return response?.value;
  }

  async getRecentBlockhash(priority: number = 1): Promise<string> {
    // Cache for 30 seconds since blockhashes change frequently
    const cacheKey = `recent_blockhash_${Math.floor(Date.now() / 30000)}`;
    const response = await this.call('getRecentBlockhash', [], cacheKey, undefined, priority);
    return response?.value?.blockhash;
  }

  async getProgramAccounts(programId: string, options: any = {}, priority: number = 1): Promise<any[]> {
    // Don't cache program accounts as they change frequently
    return this.call(
      'getProgramAccounts',
      [programId, { ...options, encoding: options.encoding || 'jsonParsed' }],
      undefined,
      undefined,
      priority
    );
  }

  async getTokenBuyersWithTimestamps(tokenAddress: string): Promise<Array<{address: string, timestamp: number, amount: number}>> {
    try {
      // Get recent signatures for the token
      const signatures = await this.getSignaturesForAddress(tokenAddress, 50, 2);
      const buyers: Array<{address: string, timestamp: number, amount: number}> = [];
      
      // Analyze recent transactions to find buyers
      for (const sig of signatures.slice(0, 10)) { // Limit to avoid rate limits
        try {
          const tx = await this.getTransaction(sig.signature, 2);
          if (!tx || !tx.meta) continue;
          
          // Look for token transfers TO new accounts (buyers)
          const tokenTransfers = tx.meta.postTokenBalances?.filter((balance: any) => 
            balance.mint === tokenAddress && 
            balance.uiTokenAmount.uiAmount > 0
          ) || [];
          
          for (const transfer of tokenTransfers) {
            if (transfer.owner) {
              buyers.push({
                address: transfer.owner,
                timestamp: tx.blockTime * 1000, // Convert to milliseconds
                amount: transfer.uiTokenAmount.uiAmount || 0
              });
            }
          }
        } catch (error) {
          this.logger.debug(`Error analyzing transaction ${sig.signature}:`, error);
        }
      }
      
      // Remove duplicates and sort by timestamp
      const uniqueBuyers = buyers.filter((buyer, index, self) => 
        index === self.findIndex(b => b.address === buyer.address)
      ).sort((a, b) => a.timestamp - b.timestamp);
      
      this.logger.debug(`Found ${uniqueBuyers.length} unique buyers for token ${tokenAddress}`);
      return uniqueBuyers;
      
    } catch (error) {
      this.logger.error(`Error getting token buyers for ${tokenAddress}:`, error);
      return [];
    }
  }

  // ========== HEALTH MONITORING ==========

  startHealthMonitoring(): void {
    setInterval(async () => {
      const healthCheckPromises = Object.entries(this.endpoints)
        .filter(([_, endpoint]) => endpoint.active)
        .map(async ([endpointName, endpoint]) => {
          try {
            const startTime = performance.now();
            await this.call('getVersion', [], undefined, endpointName);
            const responseTime = performance.now() - startTime;
            
            endpoint.responseTime = responseTime;
            this.updateEndpointStats(endpoint, responseTime, true);
            
            this.logger.debug(`Health check for ${endpointName}: ${endpoint.health}`);
          } catch (error) {
            this.logger.debug(`Health check failed for ${endpointName}`);
          }
        });
      
      await Promise.allSettled(healthCheckPromises);
      this.cleanCache();
    }, 30000); // Every 30 seconds
  }

  private cleanCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
      // Determine cache expiry time based on key prefix
      let cacheExpiry = CACHE_EXPIRY_TIMES[MethodCategory.GENERAL];
      
      if (key.startsWith('account_')) {
        cacheExpiry = CACHE_EXPIRY_TIMES[MethodCategory.ACCOUNT];
      } else if (key.startsWith('signatures_') || key.startsWith('tx_')) {
        cacheExpiry = CACHE_EXPIRY_TIMES[MethodCategory.TRANSACTION];
      } else if (key.startsWith('token_')) {
        cacheExpiry = CACHE_EXPIRY_TIMES[MethodCategory.TOKEN_INFO];
      } else if (key.startsWith('program_')) {
        cacheExpiry = CACHE_EXPIRY_TIMES[MethodCategory.LP_DISCOVERY];
      }
      
      if (now - value.timestamp > cacheExpiry) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned ${cleanedCount} expired cache items`);
    }
  }

  // ========== STATUS METHODS ==========

  getEndpointStatuses(): EndpointStatus[] {
    return Object.entries(this.endpoints).map(([name, endpoint]) => ({
      name,
      active: endpoint.active,
      health: endpoint.health,
      responseTime: endpoint.responseTime,
      callCount: endpoint.callCount,
      failCount: endpoint.failCount,
      specializations: endpoint.specializations
    }));
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  clearCache(): void {
    this.cache.clear();
    this.logger.info('RPC cache cleared');
  }

  async getConnection(category?: MethodCategory): Promise<Connection> {
    // Map category to specialization
    const specialization = category === MethodCategory.LP_DISCOVERY ? 'lp-detection' :
                          category === MethodCategory.TOKEN_INFO ? 'token-metadata' :
                          'general';
    
    // Find active endpoints that specialize in this category
    const candidates = Object.entries(this.endpoints)
      .filter(([_, endpoint]) => 
        endpoint.active && 
        endpoint.connection &&
        endpoint.specializations?.includes(specialization)
      )
      .sort(([_, a], [__, b]) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return b.health - a.health;
      });
    
    if (candidates.length > 0) {
      return candidates[0][1].connection!;
    }
    
    // Fallback to any active connection
    const best = this.selectBestEndpoint();
    if (!best || !best.endpoint.connection) {
      throw new Error('No active Solana connection available');
    }
    return best.endpoint.connection;
  }
}

// =============================================
// API CLIENT (FOR JUPITER AND DEXSCREENER)
// =============================================

class APIClient {
  private logger: winston.Logger;
  private rpcManager: RPCConnectionManager;
  private jupiterApiUrl: string = 'https://quote-api.jup.ag/v6';
  private dexscreenerApiUrl: string = 'https://api.dexscreener.com/latest/dex';
  private cache: Map<string, CacheItem> = new Map();
  
  constructor(rpcManager: RPCConnectionManager) {
    this.rpcManager = rpcManager;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'api-client' },
      transports: [
        new winston.transports.File({ filename: 'api-error.log', level: 'error' }),
        new winston.transports.File({ filename: 'api-combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }
  
  // Jupiter API methods
  async getJupiterQuote(inputMint: string, outputMint: string, amount: number): Promise<any> {
    try {
      const cacheKey = `jupiter_quote_${inputMint}_${outputMint}_${amount}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 10000) { // 10 second cache for quotes
        return cached.data;
      }
      
      const response = await axios.get(`${this.jupiterApiUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount,
          slippageBps: 50 // 0.5% slippage default
        },
        timeout: 5000
      });
      
      if (response.data) {
        this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
      }
      
      throw new Error('Empty response from Jupiter API');
    } catch (error) {
      this.logger.error('Jupiter API error:', error);
      throw error;
    }
  }
  
  async getJupiterTokenList(): Promise<any[]> {
    try {
      const cacheKey = 'jupiter_token_list';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour cache
        return cached.data;
      }
      
      const response = await axios.get('https://token.jup.ag/all', {
        timeout: 5000
      });
      
      if (response.data) {
        this.cache.set(cacheKey, { data: response.data, timestamp: Date.now() });
        return response.data;
      }
      
      throw new Error('Empty response from Jupiter token list API');
    } catch (error) {
      this.logger.error('Jupiter token list API error:', error);
      throw error;
    }
  }
  
  // Dexscreener API methods
  async getDexscreenerPairsByTokens(tokens: string[]): Promise<any[]> {
    try {
      if (tokens.length === 0) return [];
      
      const addresses = tokens.join(',');
      const cacheKey = `dexscreener_pairs_${addresses}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.data;
      }
      
      const response = await axios.get(`${this.dexscreenerApiUrl}/tokens/${addresses}`, {
        timeout: 5000
      });
      
      if (response.data && response.data.pairs) {
        this.cache.set(cacheKey, { data: response.data.pairs, timestamp: Date.now() });
        return response.data.pairs;
      }
      
      return [];
    } catch (error) {
      this.logger.error('Dexscreener API error:', error);
      return [];
    }
  }
  
  async getDexscreenerPair(pairAddress: string): Promise<any> {
    try {
      const cacheKey = `dexscreener_pair_${pairAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
        return cached.data;
      }
      
      const response = await axios.get(`${this.dexscreenerApiUrl}/pairs/solana/${pairAddress}`, {
        timeout: 5000
      });
      
      if (response.data && response.data.pairs && response.data.pairs.length > 0) {
        const pair = response.data.pairs[0];
        this.cache.set(cacheKey, { data: pair, timestamp: Date.now() });
        return pair;
      }
      
      return null;
    } catch (error) {
      this.logger.error('Dexscreener pair API error:', error);
      return null;
    }
  }
  
  // Combined utility methods
  async getTokenMetadata(tokenAddress: string): Promise<any> {
    try {
      // First check Jupiter token list (fastest)
      const tokenList = await this.getJupiterTokenList();
      const token = tokenList.find(t => t.address === tokenAddress);
      
      if (token) {
        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          decimals: token.decimals,
          logoURI: token.logoURI,
          source: 'jupiter'
        };
      }
      
      // If not found, try Dexscreener
      const pairs = await this.getDexscreenerPairsByTokens([tokenAddress]);
      
      if (pairs && pairs.length > 0) {
        const pair = pairs[0];
        const isBaseToken = pair.baseToken.address === tokenAddress;
        const tokenData = isBaseToken ? pair.baseToken : pair.quoteToken;
        
        return {
          address: tokenData.address,
          symbol: tokenData.symbol,
          name: tokenData.name || tokenData.symbol,
          decimals: null, // Dexscreener doesn't provide decimals
          source: 'dexscreener'
        };
      }
      
      // Last resort, try on-chain
      const tokenInfo = await this.rpcManager.getAccountInfo(tokenAddress, 2); // Higher priority
      
      if (tokenInfo && tokenInfo.data) {
        // Parse minimal token info
        return {
          address: tokenAddress,
          symbol: 'UNKNOWN',
          name: 'Unknown Token',
          decimals: tokenInfo.data.parsed?.info?.decimals || 0,
          source: 'solana'
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error fetching token metadata:', error);
      return null;
    }
  }
  
  async getLiquidityPoolInfo(tokenAddress: string): Promise<any> {
    try {
      // Try Dexscreener first for LP info
      const pairs = await this.getDexscreenerPairsByTokens([tokenAddress]);
      
      if (pairs && pairs.length > 0) {
        const mainPair = pairs[0]; // Use the first pair (usually highest liquidity)
        
        return {
          pairAddress: mainPair.pairAddress,
          dexId: mainPair.dexId,
          url: mainPair.url,
          baseToken: mainPair.baseToken,
          quoteToken: mainPair.quoteToken,
          priceUsd: mainPair.priceUsd,
          priceChange: {
            h24: mainPair.priceChange?.h24 || 0,
            h6: mainPair.priceChange?.h6 || 0,
            h1: mainPair.priceChange?.h1 || 0,
          },
          liquidity: {
            usd: mainPair.liquidity?.usd || 0,
          },
          volume: {
            h24: mainPair.volume?.h24 || 0,
          },
          txns: {
            h24: {
              buys: mainPair.txns?.h24?.buys || 0,
              sells: mainPair.txns?.h24?.sells || 0,
            }
          },
          source: 'dexscreener'
        };
      }
      
      // If not found, check if token exists in Jupiter
      const tokenList = await this.getJupiterTokenList();
      const token = tokenList.find(t => t.address === tokenAddress);
      
      if (token) {
        // Token exists but no liquidity info found
        return {
          pairAddress: null,
          dexId: null,
          baseToken: {
            address: token.address,
            name: token.name,
            symbol: token.symbol
          },
          quoteToken: null,
          priceUsd: null,
          liquidity: { usd: 0 },
          volume: { h24: 0 },
          txns: { h24: { buys: 0, sells: 0 } },
          source: 'jupiter'
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error('Error fetching LP info:', error);
      return null;
    }
  }
  
  // Enhanced token evaluation with combined APIs
  async evaluateToken(tokenAddress: string): Promise<any> {
    try {
      // Parallel fetching of all data sources
      const [metadata, lpInfo, onchainInfo] = await Promise.all([
        this.getTokenMetadata(tokenAddress),
        this.getLiquidityPoolInfo(tokenAddress),
        this.getTokenOnchainInfo(tokenAddress)
      ]);
      
      if (!metadata) {
        return { success: false, reason: 'Token metadata not found' };
      }
      
      // Combined evaluation criteria
      const evaluation = {
        token: {
          address: tokenAddress,
          symbol: metadata.symbol,
          name: metadata.name,
          decimals: metadata.decimals,
          mintable: onchainInfo?.mintable || false,
          freezable: onchainInfo?.freezable || false,
          mintAuthority: onchainInfo?.mintAuthority,
          supplyRaw: onchainInfo?.supply,
          supply: onchainInfo?.supply ? Number(onchainInfo.supply) / Math.pow(10, metadata.decimals || 0) : null
        },
        liquidity: lpInfo ? {
          usd: lpInfo.liquidity?.usd || 0,
          dex: lpInfo.dexId,
          pairAddress: lpInfo.pairAddress,
          quoteToken: lpInfo.quoteToken?.symbol || 'UNKNOWN'
        } : null,
        price: {
          usd: lpInfo?.priceUsd || 0,
          change24h: lpInfo?.priceChange?.h24 || 0,
          change1h: lpInfo?.priceChange?.h1 || 0
        },
        volume: {
          usd24h: lpInfo?.volume?.h24 || 0
        },
        transactions: {
          buys24h: lpInfo?.txns?.h24?.buys || 0,
          sells24h: lpInfo?.txns?.h24?.sells || 0,
          total24h: (lpInfo?.txns?.h24?.buys || 0) + (lpInfo?.txns?.h24?.sells || 0)
        },
        marketCap: onchainInfo?.supply && lpInfo?.priceUsd
          ? (Number(onchainInfo.supply) / Math.pow(10, metadata.decimals || 0)) * lpInfo.priceUsd
          : null,
        holders: onchainInfo?.holderCount || 0,
        topHolderConcentration: onchainInfo?.topHolderPercentage || 1,
        tokenAge: onchainInfo?.creationTimestamp
          ? Math.floor(Date.now() / 1000) - onchainInfo.creationTimestamp
          : null,
        dataSources: {
          metadata: metadata.source,
          liquidity: lpInfo?.source || 'none',
          onchain: 'solana'
        }
      };
      
      // Validation checks (based on your criteria)
      const validations = {
        hasLiquidity: (lpInfo?.liquidity?.usd || 0) >= 100000,
        marketCapSufficient: (evaluation.marketCap || 0) >= 100000,
        volumeSufficient: (lpInfo?.volume?.h24 || 0) >= 100000,
        holderCountSufficient: (onchainInfo?.holderCount || 0) >= 300,
        topHolderConcentrationLow: (onchainInfo?.topHolderPercentage || 1) <= 0.3,
        transactionCountSufficient: ((lpInfo?.txns?.h24?.buys || 0) + (lpInfo?.txns?.h24?.sells || 0)) >= 500,
        isPotentiallyMeme: this.isPotentialMemeToken(metadata.name, metadata.symbol)
      };
      
      (evaluation as any).validations = validations;
      (evaluation as any).score = this.calculateTokenScore(evaluation, validations);
      
      return {
        success: true,
        evaluation
      };
    } catch (error) {
      this.logger.error('Token evaluation error:', error);
      return { 
        success: false, 
        reason: 'Evaluation error', 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  private isPotentialMemeToken(name: string, symbol: string): boolean {
    // Simple heuristic - check for meme-related keywords or patterns
    const memeKeywords = [
      'dog', 'doge', 'shib', 'cat', 'kitty', 'pepe', 'frog', 'moon', 'elon', 'safe',
      'inu', 'meme', 'wojak', 'chad', 'coin', 'token', 'ai', 'gpt', 'turbo'
    ];
    
    const combinedText = `${name} ${symbol}`.toLowerCase();
    return memeKeywords.some(keyword => combinedText.includes(keyword));
  }
  
  private async getTokenOnchainInfo(tokenAddress: string): Promise<any> {
    try {
      // Use higher priority for these calls
      const [accountInfo, signatures, largestAccounts] = await Promise.all([
        this.rpcManager.getAccountInfo(tokenAddress, 3),
        this.rpcManager.getSignaturesForAddress(tokenAddress, 1000, 3),
        this.rpcManager.call('getTokenLargestAccounts', [tokenAddress], `token_largest_${tokenAddress}`, undefined, 3)
      ]);
      
      // Extract mint authority and supply
      const mintAuthority = accountInfo?.data?.parsed?.info?.mintAuthority || null;
      const freezeAuthority = accountInfo?.data?.parsed?.info?.freezeAuthority || null;
      const supply = accountInfo?.data?.parsed?.info?.supply || null;
      
      // Creation time estimation
      let creationTimestamp = null;
      if (signatures && signatures.length > 0) {
        const oldest = signatures[signatures.length - 1];
        creationTimestamp = oldest.blockTime || null;
      }
      
      // Holder analysis (if largest accounts available)
      let holderCount = 0;
      let topHolderPercentage = 1;
      
      if (largestAccounts?.value && largestAccounts.value.length > 0 && supply) {
        holderCount = largestAccounts.value.length;
        
        const largestHolder = largestAccounts.value[0];
        topHolderPercentage = Number(largestHolder.amount) / Number(supply);
      }
      
      return {
        mintAuthority,
        freezeAuthority,
        mintable: !!mintAuthority,
        freezable: !!freezeAuthority,
        supply,
        creationTimestamp,
        holderCount,
        topHolderPercentage
      };
    } catch (error) {
      this.logger.error('Error fetching token onchain info:', error);
      return null;
    }
  }
  
  private calculateTokenScore(evaluation: any, validations: any): number {
    // Simple scoring system (0-100)
    let score = 0;
    
    // Liquidity factor (0-20)
    const liquidityUSD = evaluation.liquidity?.usd || 0;
    score += Math.min(20, liquidityUSD / 10000);
    
    // Volume factor (0-20)
    const volumeUSD = evaluation.volume?.usd24h || 0;
    score += Math.min(20, volumeUSD / 10000);
    
    // Transaction count (0-15)
    const txCount = evaluation.transactions?.total24h || 0;
    score += Math.min(15, txCount / 50);
    
    // Holder diversity (0-15)
    const holderCount = evaluation.holders || 0;
    score += Math.min(15, holderCount / 30);
    
    // Holder concentration (0-15)
    const topHolderPct = evaluation.topHolderConcentration || 1;
    score += Math.min(15, (1 - topHolderPct) * 15);
    
    // Meme token factor (0-15)
    if (validations.isPotentiallyMeme) {
      score += 15;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
}

// Export as singleton for MVP
export default new RPCConnectionManager();