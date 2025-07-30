const https = require('https');
const { performance } = require('perf_hooks');
const winston = require('winston');

// Mock config to avoid slow imports
const config = {
  solanaRpcEndpoint: process.env.CHAINSTACK_RPC_URL || 'https://solana-mainnet.chainstacklabs.com'
};

// Functional PublicKey class (simplified but working)
class PublicKey {
  constructor(key) {
    if (typeof key !== 'string') {
      this.key = key.toString();
    } else {
      this.key = key;
    }
  }
  
  toString() {
    return this.key;
  }
  
  toBase58() {
    return this.key;
  }
}

// Mock Connection that delegates to RPC manager
class Connection {
  constructor(url, config) {
    this.url = url;
    this.config = config;
  }
}

// Working HTTPS implementation
function makeHttpsRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + (urlObj.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseBody);
          resolve({ data: jsonResponse });
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Method categories for specialized handling
const MethodCategory = {
  LP_DISCOVERY: "lp_discovery",
  TOKEN_INFO: "token_info", 
  TRANSACTION: "transaction",
  ACCOUNT: "account",
  GENERAL: "general"
};

const CACHE_EXPIRY_TIMES = {
  [MethodCategory.LP_DISCOVERY]: 15000,
  [MethodCategory.TOKEN_INFO]: 30000,
  [MethodCategory.TRANSACTION]: 120000,
  [MethodCategory.ACCOUNT]: 30000,
  [MethodCategory.GENERAL]: 60000
};

const METHOD_TIMEOUTS = {
  [MethodCategory.LP_DISCOVERY]: 15000,
  [MethodCategory.TOKEN_INFO]: 10000,
  [MethodCategory.TRANSACTION]: 12000,
  [MethodCategory.ACCOUNT]: 10000,
  [MethodCategory.GENERAL]: 8000
};

const METHOD_CATEGORIES = {
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

class RPCConnectionManager {
  constructor() {
    this.logger = this.initializeLogger();
    this.endpoints = this.initializeEndpoints();
    this.cache = new Map();
    this.requestQueue = new Map();
    this.processing = new Map();
    
    this.maxConcurrentRequests = 15;
    this.requestsPerSecond = 50;
    
    this.lpScanInterval = undefined;
    this.isLPScanning = false;
    this.lpScanConcurrencyLimit = 10;
    this.maxLPsPerScan = 50;
    this.recentLPMemo = new Set();
    
    this.apiClient = new APIClient(this);
    
    this.initializeSolanaConnections();
    this.startRequestProcessor();
    this.startHealthMonitoring();
  }

  initializeLogger() {
    return winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'rpc-connection-manager' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  initializeEndpoints() {
    return {
      helius: {
        url: 'https://mainnet.helius-rpc.com',
        apiKey: process.env.HELIUS_API_KEY || '',
        rateLimit: 500,
        active: Boolean(process.env.HELIUS_API_KEY),
        health: 100,
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0,
        priority: 10,
        specializations: ['memecoins', 'lp-detection', 'token-metadata', 'fast-execution']
      },
      chainstack: {
        url: config.solanaRpcEndpoint,
        apiKey: '',
        rateLimit: 1000,
        active: Boolean(config.solanaRpcEndpoint),
        health: 100,
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0,
        priority: 8,
        specializations: ['bulk-operations', 'execution', 'program-accounts']
      },
      public: {
        url: 'https://mainnet.helius-rpc.com',
        apiKey: '',
        rateLimit: 50,
        active: true,
        health: 60,
        responseTime: 0,
        failCount: 0,
        lastCall: 0,
        callCount: 0,
        priority: 1,
        specializations: ['general', 'fallback']
      }
    };
  }

  initializeSolanaConnections() {
    for (const [name, endpoint] of Object.entries(this.endpoints)) {
      try {
        if (!endpoint.url) {
          this.logger.warn(`Skipping ${name} initialization: missing URL`);
          endpoint.active = false;
          continue;
        }

        endpoint.connection = new Connection(endpoint.url, {
          commitment: 'confirmed'
        });
        
        this.requestQueue.set(name, []);
        this.processing.set(name, false);
        this.logger.info(`Initialized connection for ${name}`);
      } catch (err) {
        this.logger.error(`Failed to initialize connection for ${name}:`, err);
        endpoint.active = false;
      }
    }
  }

  startRequestProcessor() {
    setInterval(() => {
      for (const [endpointName, endpoint] of Object.entries(this.endpoints)) {
        if (!endpoint.active || this.processing.get(endpointName)) continue;
        
        const queue = this.requestQueue.get(endpointName) || [];
        if (queue.length === 0) continue;

        this.processQueuedRequests(endpointName, endpoint);
      }
    }, 100);
  }

  async processQueuedRequests(endpointName, endpoint) {
    this.processing.set(endpointName, true);
    const queue = this.requestQueue.get(endpointName) || [];
    
    queue.sort((a, b) => b.priority - a.priority);
    
    let batchSize = this.maxConcurrentRequests;
    if (endpointName === 'helius' || endpointName === 'chainstack') {
      batchSize = Math.min(20, this.maxConcurrentRequests * 2);
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

  async executeRpcCall(endpoint, method, params, forcedEndpoint, isRetry = false) {
    const startTime = performance.now();
    
    const methodCategory = METHOD_CATEGORIES[method] || MethodCategory.GENERAL;
    const cacheKey = `${method}:${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_TIMES[methodCategory]) {
      this.logger.debug(`✅ Cache hit for ${cacheKey}`);
      return cached.data;
    }
    
    try {
      const now = Date.now();
      const timeSinceLastCall = now - endpoint.lastCall;
      
      let minInterval = 1000 / endpoint.rateLimit;
      
      if (forcedEndpoint === 'helius' || forcedEndpoint === 'chainstack') {
        minInterval = minInterval * 0.5;
      }
      
      if (timeSinceLastCall < minInterval) {
        await new Promise(resolve => setTimeout(resolve, minInterval - timeSinceLastCall));
      }

      endpoint.lastCall = Date.now();
      endpoint.callCount++;

      // First try Solana native methods if available
      const solanaMethods = new Set([
        'getAccountInfo',
        'getProgramAccounts', 
        'getTokenAccountsByOwner',
        'getMultipleAccounts',
        'getTokenSupply'
      ]);
      
      if (endpoint.connection && solanaMethods.has(method)) {
        const result = await this.executeSolanaMethod(endpoint.connection, method, params);
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
        return result;
      }

      // Fallback to RPC call
      let requestUrl = endpoint.url;
      if (endpoint.apiKey) {
        if (forcedEndpoint === 'helius') {
          requestUrl = endpoint.url.includes('api-key=') 
            ? endpoint.url 
            : `${endpoint.url}?api-key=${endpoint.apiKey}`;
        }
      }

      const response = await makeHttpsRequest(requestUrl, {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      });

      const responseTime = performance.now() - startTime;
      this.updateEndpointStats(endpoint, responseTime, true);

      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message} (Code: ${response.data.error.code})`);
      }

      this.cache.set(cacheKey, {
        data: response.data.result,
        timestamp: Date.now()
      });

      return response.data.result;
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateEndpointStats(endpoint, responseTime, false);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (!isRetry) {
        if (forcedEndpoint === 'helius' && this.endpoints.chainstack.active) {
          this.logger.info(`Retrying with Chainstack after Helius failure`);
          return this.executeRpcCall(this.endpoints.chainstack, method, params, 'chainstack', true);
        } else if (forcedEndpoint === 'chainstack' && this.endpoints.helius.active) {
          this.logger.info(`Retrying with Helius after Chainstack failure`);
          return this.executeRpcCall(this.endpoints.helius, method, params, 'helius', true);
        } else {
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

  // MISSING METHOD: executeSolanaMethod with proper PublicKey handling
  async executeSolanaMethod(connection, method, params) {
    switch (method) {
      case 'getAccountInfo':
        if (!params[0]) throw new Error('Missing pubkey for getAccountInfo');
        // Simulate the call via RPC since we can't use real web3.js
        return this.makeDirectRpcCall(connection.url, 'getAccountInfo', [params[0], { encoding: 'jsonParsed' }]);
        
      case 'getProgramAccounts':
        if (!params[0]) throw new Error('Missing programId for getProgramAccounts');
        return this.makeDirectRpcCall(connection.url, 'getProgramAccounts', [params[0], params[1] || {}]);
        
      case 'getTokenAccountsByOwner':
        if (!params[0]) throw new Error('Missing owner for getTokenAccountsByOwner');
        return this.makeDirectRpcCall(connection.url, 'getTokenAccountsByOwner', params);
        
      case 'getMultipleAccounts':
        if (!params[0] || !Array.isArray(params[0])) 
          throw new Error('Missing addresses array for getMultipleAccounts');
        return this.makeDirectRpcCall(connection.url, 'getMultipleAccounts', params);
        
      case 'getTokenSupply':
        if (!params[0]) throw new Error('Missing mint address for getTokenSupply');
        return this.makeDirectRpcCall(connection.url, 'getTokenSupply', [params[0]]);
        
      default:
        throw new Error(`Unsupported Solana method: ${method}`);
    }
  }

  // Helper for direct RPC calls
  async makeDirectRpcCall(url, method, params) {
    const response = await makeHttpsRequest(url, {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    });

    if (response.data.error) {
      throw new Error(`RPC Error: ${response.data.error.message}`);
    }

    return response.data.result;
  }

  updateEndpointStats(endpoint, responseTime, success) {
    endpoint.responseTime = responseTime;
    
    if (success) {
      const healthBoost = (endpoint.priority || 0) >= 8 ? 2 : 1;
      endpoint.health = Math.min(100, endpoint.health + healthBoost);
      endpoint.failCount = Math.max(0, endpoint.failCount - 1);
    } else {
      endpoint.failCount++;
      
      const maxAcceptableResponseTime = (endpoint.priority || 0) >= 8 ? 2000 : 500;
      const responseTimeFactor = Math.min(1, responseTime / maxAcceptableResponseTime);
      
      const recentFailRate = endpoint.callCount > 0 ? 
        endpoint.failCount / Math.min(endpoint.callCount, 100) : 0;
      
      const forgivenessFactor = (endpoint.priority || 0) >= 8 ? 0.5 : 1.0;
      const weights = { failure: 0.7 * forgivenessFactor, latency: 0.3 * forgivenessFactor };
      
      endpoint.health = Math.max(0, Math.min(100,
        100 - (recentFailRate * weights.failure * 100) - (responseTimeFactor * weights.latency * 100)
      ));
      
      const disableThreshold = (endpoint.priority || 0) >= 8 ? 5 : 10;
      
      if (endpoint.health < disableThreshold) {
        endpoint.active = false;
        this.logger.warn(`Disabled endpoint due to low health: ${endpoint.url} (health: ${endpoint.health})`);
        
        const reactivationDelay = (endpoint.priority || 0) >= 8 ? 30000 : 60000;
        setTimeout(() => this.checkEndpointReactivation(endpoint), reactivationDelay);
      }
    }
  }

  async checkEndpointReactivation(endpoint) {
    try {
      let requestUrl = endpoint.url;
      
      if (endpoint.apiKey && endpoint.url.includes('helius')) {
        requestUrl = endpoint.url.includes('api-key=') 
          ? endpoint.url 
          : `${endpoint.url}?api-key=${endpoint.apiKey}`;
      }

      const response = await makeHttpsRequest(requestUrl, {
        jsonrpc: '2.0',
        method: 'getVersion',
        params: [],
        id: Date.now()
      });

      if (response.data && !response.data.error) {
        this.logger.info(`Reactivating endpoint: ${endpoint.url}`);
        endpoint.active = true;
        endpoint.health = 50;
        endpoint.failCount = 0;
        
        endpoint.connection = new Connection(requestUrl, {
          commitment: 'confirmed'
        });
      }
    } catch (error) {
      this.logger.warn(`Endpoint ${endpoint.url} still unhealthy, keeping deactivated`);
      setTimeout(() => this.checkEndpointReactivation(endpoint), 300000);
    }
  }

  selectBestEndpoint(method) {
    let activeEndpoints = Object.entries(this.endpoints)
      .filter(([_, endpoint]) => endpoint.active);

    const premiumEndpoints = activeEndpoints.filter(([name, _]) => name !== 'public');
    if (premiumEndpoints.length > 0) {
      activeEndpoints = premiumEndpoints;
    }
    
    if (method) {
      const category = METHOD_CATEGORIES[method] || MethodCategory.GENERAL;
      
      const specializedEndpoints = activeEndpoints.filter(([_, endpoint]) => {
        if (!endpoint.specializations) return false;
        
        const specialization = category === MethodCategory.LP_DISCOVERY ? 'lp-detection' :
                              category === MethodCategory.TOKEN_INFO ? 'token-metadata' :
                              'general';
                              
        return endpoint.specializations.includes(specialization);
      });
      
      if (specializedEndpoints.length > 0) {
        activeEndpoints = specializedEndpoints;
      }
    }
    
    activeEndpoints.sort(([_, a], [__, b]) => {
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      
      const scoreA = a.health - (a.responseTime / 100);
      const scoreB = b.health - (b.responseTime / 100);
      return scoreB - scoreA;
    });

    if (activeEndpoints.length === 0) return null;
    
    const [name, endpoint] = activeEndpoints[0];
    return { name, endpoint };
  }

  selectFallbackEndpoint(currentEndpoint, method) {
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

  async call(method, params = [], cacheKey, forcedEndpoint, priority = 1) {
    const methodCategory = METHOD_CATEGORIES[method] || MethodCategory.GENERAL;
    
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      const cacheExpiry = CACHE_EXPIRY_TIMES[methodCategory];
      
      if (Date.now() - cached.timestamp < cacheExpiry) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }

    let endpoint;
    
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

    return new Promise((resolve, reject) => {
      const request = {
        endpoint: endpoint.name,
        method,
        params,
        priority,
        methodCategory,
        resolve: (result) => {
          if (cacheKey) {
            this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
          }
          resolve(result);
        },
        reject,
        timestamp: Date.now()
      };

      const queue = this.requestQueue.get(endpoint.name) || [];
      queue.push(request);
      this.requestQueue.set(endpoint.name, queue);
    });
  }

  async getAccountInfo(address, priority = 1) {
    return this.call(
      'getAccountInfo', 
      [address, { encoding: 'jsonParsed' }], 
      `account_${address}`, 
      undefined, 
      priority
    );
  }

  async getMultipleAccounts(addresses, priority = 1) {
    if (addresses.length === 0) return [];
    
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

  async getSignaturesForAddress(address, limit = 100, priority = 1) {
    const cacheKey = `signatures_${address}_${limit}`;
    
    const numericPriority = typeof priority === 'string' ? 
      (priority === 'chainstack' ? 3 : priority === 'helius' ? 4 : 1) : priority;
    
    let adjustedLimit = limit;
    let preferredEndpoint;
    
    if (priority === 'chainstack' || priority === 3) {
      adjustedLimit = Math.min(limit, 200);
      preferredEndpoint = 'chainstack';
    } else if (priority === 'helius' || priority === 4) {
      adjustedLimit = Math.min(limit, 500);
      preferredEndpoint = 'helius';
    } else {
      adjustedLimit = Math.min(limit, 50);
    }
    
    try {
      return await this.call(
        'getSignaturesForAddress',
        [address, { limit: adjustedLimit }],
        cacheKey,
        preferredEndpoint,
        numericPriority
      );
    } catch (error) {
      const err = error;
      if (err.message?.includes('WrongSize') || err.message?.includes('Invalid param')) {
        const fallbackLimits = [100, 50, 20, 10];
        
        for (const fallbackLimit of fallbackLimits) {
          if (fallbackLimit >= adjustedLimit) continue;
          
          try {
            return await this.call(
              'getSignaturesForAddress',
              [address, { limit: fallbackLimit }],
              `signatures_${address}_${fallbackLimit}`,
              preferredEndpoint,
              numericPriority
            );
          } catch (fallbackError) {
            continue;
          }
        }
      }
      
      this.logger.warn(`All signature fetch attempts failed for ${address}, returning empty array`);
      return [];
    }
  }

  async getTransaction(signature, priority = 1) {
    const cacheKey = `tx_${signature}`;
    return this.call(
      'getTransaction',
      [signature, { encoding: 'json', maxSupportedTransactionVersion: 0 }],
      cacheKey,
      undefined,
      priority
    );
  }

  // MISSING METHOD: getMultipleTransactions
  async getMultipleTransactions(signatures, priority = 1) {
    if (signatures.length === 0) return [];
    
    const cachedResults = [];
    const uncachedSignatures = [];
    
    signatures.forEach(sig => {
      const cacheKey = `tx_${sig}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_EXPIRY_TIMES[MethodCategory.TRANSACTION]) {
          cachedResults.push(cached.data);
          return;
        }
      }
      uncachedSignatures.push(sig);
    });
    
    const uncachedResults = await Promise.all(
      uncachedSignatures.map(sig => this.getTransaction(sig, priority))
    );
    
    const resultMap = new Map();
    cachedResults.forEach(result => resultMap.set(result?.transaction?.signatures?.[0], result));
    uncachedResults.forEach(result => resultMap.set(result?.transaction?.signatures?.[0], result));
    
    return signatures.map(sig => resultMap.get(sig)).filter(Boolean);
  }

  async getTokenAccountsByOwner(owner, programId, priority = 1) {
    const cacheKey = `token_accounts_${owner}_${programId || 'default'}`;
    const response = await this.call(
      'getTokenAccountsByOwner',
      [
        owner,
        { programId: programId || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
        { encoding: 'base64' }
      ],
      cacheKey,
      undefined,
      priority
    );
    return response?.value || [];
  }

  async getTokenSupply(mintAddress, priority = 1) {
    const cacheKey = `token_supply_${mintAddress}`;
    const response = await this.call('getTokenSupply', [mintAddress], cacheKey, undefined, priority);
    return response?.value;
  }

  async getRecentBlockhash(priority = 1) {
    const cacheKey = `recent_blockhash_${Math.floor(Date.now() / 30000)}`;
    const response = await this.call('getRecentBlockhash', [], cacheKey, undefined, priority);
    return response?.value?.blockhash;
  }

  async getProgramAccounts(programId, options = {}, priority = 1) {
    return this.call(
      'getProgramAccounts',
      [programId, { ...options, encoding: options.encoding || 'jsonParsed' }],
      undefined,
      undefined,
      priority
    );
  }

  // MISSING METHOD: getTokenBuyersWithTimestamps
  async getTokenBuyersWithTimestamps(tokenAddress) {
    try {
      const signatures = await this.getSignaturesForAddress(tokenAddress, 50, 2);
      const buyers = [];
      
      for (const sig of signatures.slice(0, 10)) {
        try {
          const tx = await this.getTransaction(sig.signature, 2);
          if (!tx || !tx.meta) continue;
          
          const tokenTransfers = tx.meta.postTokenBalances?.filter((balance) => 
            balance.mint === tokenAddress && 
            balance.uiTokenAmount.uiAmount > 0
          ) || [];
          
          for (const transfer of tokenTransfers) {
            if (transfer.owner) {
              buyers.push({
                address: transfer.owner,
                timestamp: tx.blockTime * 1000,
                amount: transfer.uiTokenAmount.uiAmount || 0
              });
            }
          }
        } catch (error) {
          this.logger.debug(`Error analyzing transaction ${sig.signature}:`, error);
        }
      }
      
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

  startHealthMonitoring() {
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
    }, 30000);
  }

  cleanCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.cache.entries()) {
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

  getEndpointStatuses() {
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

  getCacheSize() {
    return this.cache.size;
  }

  clearCache() {
    this.cache.clear();
    this.logger.info('RPC cache cleared');
  }

  // MISSING METHOD: getConnection
  async getConnection(category) {
    const specialization = category === MethodCategory.LP_DISCOVERY ? 'lp-detection' :
                          category === MethodCategory.TOKEN_INFO ? 'token-metadata' :
                          'general';
    
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
      return candidates[0][1].connection;
    }
    
    const best = this.selectBestEndpoint();
    if (!best || !best.endpoint.connection) {
      throw new Error('No active Solana connection available');
    }
    return best.endpoint.connection;
  }
}

// =============================================
// COMPLETE API CLIENT FOR JUPITER AND DEXSCREENER
// =============================================

class APIClient {
  constructor(rpcManager) {
    this.rpcManager = rpcManager;
    this.jupiterApiUrl = 'https://quote-api.jup.ag/v6';
    this.dexscreenerApiUrl = 'https://api.dexscreener.com/latest/dex';
    this.cache = new Map();
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'api-client' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }
  
  async getJupiterQuote(inputMint, outputMint, amount) {
    try {
      const cacheKey = `jupiter_quote_${inputMint}_${outputMint}_${amount}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 10000) {
        return cached.data;
      }
      
      const url = `${this.jupiterApiUrl}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`;
      const response = await makeHttpsRequest(url, null);
      
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
  
  async getJupiterTokenList() {
    try {
      const cacheKey = 'jupiter_token_list';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }
      
      const response = await makeHttpsRequest('https://token.jup.ag/all', null);
      
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
  
  async getDexscreenerPairsByTokens(tokens) {
    try {
      if (tokens.length === 0) return [];
      
      const addresses = tokens.join(',');
      const cacheKey = `dexscreener_pairs_${addresses}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
      
      const url = `${this.dexscreenerApiUrl}/tokens/${addresses}`;
      const response = await makeHttpsRequest(url, null);
      
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
  
  async getDexscreenerPair(pairAddress) {
    try {
      const cacheKey = `dexscreener_pair_${pairAddress}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
      
      const url = `${this.dexscreenerApiUrl}/pairs/solana/${pairAddress}`;
      const response = await makeHttpsRequest(url, null);
      
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
  
  async getTokenMetadata(tokenAddress) {
    try {
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
      
      const pairs = await this.getDexscreenerPairsByTokens([tokenAddress]);
      
      if (pairs && pairs.length > 0) {
        const pair = pairs[0];
        const isBaseToken = pair.baseToken.address === tokenAddress;
        const tokenData = isBaseToken ? pair.baseToken : pair.quoteToken;
        
        return {
          address: tokenData.address,
          symbol: tokenData.symbol,
          name: tokenData.name || tokenData.symbol,
          decimals: null,
          source: 'dexscreener'
        };
      }
      
      const tokenInfo = await this.rpcManager.getAccountInfo(tokenAddress, 2);
      
      if (tokenInfo && tokenInfo.data) {
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
  
  async getLiquidityPoolInfo(tokenAddress) {
    try {
      const pairs = await this.getDexscreenerPairsByTokens([tokenAddress]);
      
      if (pairs && pairs.length > 0) {
        const mainPair = pairs[0];
        
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
      
      const tokenList = await this.getJupiterTokenList();
      const token = tokenList.find(t => t.address === tokenAddress);
      
      if (token) {
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
  
  async evaluateToken(tokenAddress) {
    try {
      const [metadata, lpInfo, onchainInfo] = await Promise.all([
        this.getTokenMetadata(tokenAddress),
        this.getLiquidityPoolInfo(tokenAddress),
        this.getTokenOnchainInfo(tokenAddress)
      ]);
      
      if (!metadata) {
        return { success: false, reason: 'Token metadata not found' };
      }
      
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
      
      const validations = {
        hasLiquidity: (lpInfo?.liquidity?.usd || 0) >= 100000,
        marketCapSufficient: (evaluation.marketCap || 0) >= 100000,
        volumeSufficient: (lpInfo?.volume?.h24 || 0) >= 100000,
        holderCountSufficient: (onchainInfo?.holderCount || 0) >= 300,
        topHolderConcentrationLow: (onchainInfo?.topHolderPercentage || 1) <= 0.3,
        transactionCountSufficient: ((lpInfo?.txns?.h24?.buys || 0) + (lpInfo?.txns?.h24?.sells || 0)) >= 500,
        isPotentiallyMeme: this.isPotentialMemeToken(metadata.name, metadata.symbol)
      };
      
      evaluation.validations = validations;
      evaluation.score = this.calculateTokenScore(evaluation, validations);
      
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
  
  isPotentialMemeToken(name, symbol) {
    const memeKeywords = [
      'dog', 'doge', 'shib', 'cat', 'kitty', 'pepe', 'frog', 'moon', 'elon', 'safe',
      'inu', 'meme', 'wojak', 'chad', 'coin', 'token', 'ai', 'gpt', 'turbo'
    ];
    
    const combinedText = `${name} ${symbol}`.toLowerCase();
    return memeKeywords.some(keyword => combinedText.includes(keyword));
  }
  
  async getTokenOnchainInfo(tokenAddress) {
    try {
      const [accountInfo, signatures, largestAccounts] = await Promise.all([
        this.rpcManager.getAccountInfo(tokenAddress, 3),
        this.rpcManager.getSignaturesForAddress(tokenAddress, 1000, 3),
        this.rpcManager.call('getTokenLargestAccounts', [tokenAddress], `token_largest_${tokenAddress}`, undefined, 3)
      ]);
      
      const mintAuthority = accountInfo?.data?.parsed?.info?.mintAuthority || null;
      const freezeAuthority = accountInfo?.data?.parsed?.info?.freezeAuthority || null;
      const supply = accountInfo?.data?.parsed?.info?.supply || null;
      
      let creationTimestamp = null;
      if (signatures && signatures.length > 0) {
        const oldest = signatures[signatures.length - 1];
        creationTimestamp = oldest.blockTime || null;
      }
      
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
  
  calculateTokenScore(evaluation, validations) {
    let score = 0;
    
    const liquidityUSD = evaluation.liquidity?.usd || 0;
    score += Math.min(20, liquidityUSD / 10000);
    
    const volumeUSD = evaluation.volume?.usd24h || 0;
    score += Math.min(20, volumeUSD / 10000);
    
    const txCount = evaluation.transactions?.total24h || 0;
    score += Math.min(15, txCount / 50);
    
    const holderCount = evaluation.holders || 0;
    score += Math.min(15, holderCount / 30);
    
    const topHolderPct = evaluation.topHolderConcentration || 1;
    score += Math.min(15, (1 - topHolderPct) * 15);
    
    if (validations.isPotentiallyMeme) {
      score += 15;
    }
    
    return Math.min(100, Math.max(0, Math.round(score)));
  }
}

// Export as singleton for MVP
module.exports = new RPCConnectionManager();

  // ========== LP SCANNING METHODS ==========

  async startLPScanning(intervalMs = 5000) {
    if (this.isLPScanning) {
      this.logger.warn('LP scanning already active');
      return;
    }

    this.logger.info(`Starting LP scanning with ${intervalMs}ms interval`);
    this.isLPScanning = true;
    
    this.lpScanInterval = setInterval(async () => {
      try {
        await this.scanForNewLiquidityPools();
      } catch (error) {
        this.logger.error('LP scanning error:', error);
        // Don't stop scanning on single error
      }
    }, intervalMs);

    // Initial scan
    try {
      await this.scanForNewLiquidityPools();
    } catch (error) {
      this.logger.error('Initial LP scan failed:', error);
    }
  }

  stopLPScanning() {
    if (!this.isLPScanning) {
      this.logger.warn('LP scanning not active');
      return;
    }

    this.logger.info('Stopping LP scanning');
    this.isLPScanning = false;
    
    if (this.lpScanInterval) {
      clearInterval(this.lpScanInterval);
      this.lpScanInterval = undefined;
    }
  }

  async scanForNewLiquidityPools() {
    const startTime = performance.now();
    this.logger.debug('Scanning for new liquidity pools...');

    try {
      // Scan multiple DEX programs concurrently for maximum coverage
      const dexPrograms = [
        'So11111111111111111111111111111111111111112', // Wrapped SOL
        '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Raydium AMM V4
        'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB',  // Jupiter
        'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',  // Orca Whirlpools
        'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'   // Raydium CPMM
      ];

      const scanPromises = dexPrograms.map(async (programId) => {
        return this.scanDEXProgram(programId);
      });

      const results = await Promise.allSettled(scanPromises);
      
      let totalNewPools = 0;
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const newPools = result.value || 0;
          totalNewPools += newPools;
          this.logger.debug(`DEX program ${dexPrograms[index]}: ${newPools} new pools`);
        } else {
          this.logger.warn(`DEX program scan failed: ${dexPrograms[index]}:`, result.reason);
        }
      });

      const scanTime = performance.now() - startTime;
      this.logger.info(`LP scan completed: ${totalNewPools} new pools found in ${Math.round(scanTime)}ms`);
      
      return totalNewPools;
    } catch (error) {
      const scanTime = performance.now() - startTime;
      this.logger.error(`LP scan failed after ${Math.round(scanTime)}ms:`, error);
      throw error;
    }
  }

  async scanDEXProgram(programId) {
    try {
      // Use specialized LP detection endpoint (Helius priority)
      const accounts = await this.getProgramAccounts(programId, {
        filters: [
          {
            dataSize: 752 // Standard LP account size for most DEXs
          }
        ]
      }, 4); // Priority 4 = Helius preference

      if (!accounts || accounts.length === 0) {
        return 0;
      }

      // Filter for new accounts (not in our memo)
      const newAccounts = accounts.filter(account => {
        const accountKey = account.pubkey;
        return !this.recentLPMemo.has(accountKey);
      });

      if (newAccounts.length === 0) {
        return 0;
      }

      // Limit processing to avoid overwhelming system
      const accountsToProcess = newAccounts.slice(0, this.maxLPsPerScan);
      
      // Process new LP accounts in parallel batches
      const batchSize = Math.min(this.lpScanConcurrencyLimit, accountsToProcess.length);
      const batches = [];
      
      for (let i = 0; i < accountsToProcess.length; i += batchSize) {
        batches.push(accountsToProcess.slice(i, i + batchSize));
      }

      let validNewPools = 0;
      
      for (const batch of batches) {
        const batchPromises = batch.map(async (account) => {
          try {
            const lpData = await this.analyzeLPAccount(account);
            if (lpData && this.isValidNewLP(lpData)) {
              // Add to memo to avoid reprocessing
              this.recentLPMemo.add(account.pubkey);
              
              // Emit LP creation event for signal processing
              this.emitLPCreationEvent(lpData);
              return 1;
            }
            return 0;
          } catch (error) {
            this.logger.debug(`Failed to analyze LP account ${account.pubkey}:`, error);
            return 0;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            validNewPools += result.value;
          }
        });
      }

      // Clean memo periodically to prevent memory growth
      if (this.recentLPMemo.size > 10000) {
        this.cleanLPMemo();
      }

      return validNewPools;
    } catch (error) {
      this.logger.error(`Error scanning DEX program ${programId}:`, error);
      return 0;
    }
  }

  async analyzeLPAccount(account) {
    try {
      // Extract LP data from account
      const accountData = account.account;
      if (!accountData || !accountData.data) {
        return null;
      }

      // Parse account data to extract token information
      const lpInfo = {
        address: account.pubkey,
        programId: accountData.owner,
        lamports: accountData.lamports,
        dataSize: accountData.data.length,
        timestamp: Date.now(),
        executable: accountData.executable
      };

      // For parsed accounts, extract token information
      if (accountData.data.parsed && accountData.data.parsed.info) {
        const info = accountData.data.parsed.info;
        lpInfo.tokenA = info.tokenA || info.mint;
        lpInfo.tokenB = info.tokenB;
        lpInfo.authority = info.authority;
        lpInfo.feeAccount = info.feeAccount;
      }

      // Get additional metadata if tokens identified
      if (lpInfo.tokenA) {
        try {
          const [tokenAInfo, tokenBInfo] = await Promise.allSettled([
            this.apiClient.getTokenMetadata(lpInfo.tokenA),
            lpInfo.tokenB ? this.apiClient.getTokenMetadata(lpInfo.tokenB) : Promise.resolve(null)
          ]);

          if (tokenAInfo.status === 'fulfilled' && tokenAInfo.value) {
            lpInfo.tokenAMetadata = tokenAInfo.value;
          }
          if (tokenBInfo.status === 'fulfilled' && tokenBInfo.value) {
            lpInfo.tokenBMetadata = tokenBInfo.value;
          }
        } catch (error) {
          this.logger.debug(`Failed to get token metadata for LP ${account.pubkey}:`, error);
        }
      }

      return lpInfo;
    } catch (error) {
      this.logger.debug(`Error analyzing LP account ${account.pubkey}:`, error);
      return null;
    }
  }

  isValidNewLP(lpData) {
    // Basic validation criteria for new LP
    if (!lpData || !lpData.address) {
      return false;
    }

    // Must have at least one token identified
    if (!lpData.tokenA) {
      return false;
    }

    // Must have reasonable lamports (not empty account)
    if (lpData.lamports < 1000000) { // 0.001 SOL minimum
      return false;
    }

    // Check for meme token characteristics if metadata available
    if (lpData.tokenAMetadata) {
      const isMemeToken = this.apiClient.isPotentialMemeToken(
        lpData.tokenAMetadata.name || '',
        lpData.tokenAMetadata.symbol || ''
      );
      
      // For meme tokens, be more permissive
      if (isMemeToken) {
        this.logger.debug(`Potential meme token LP detected: ${lpData.tokenAMetadata.symbol}`);
        return true;
      }
    }

    // For non-meme tokens, apply stricter criteria
    // (This can be expanded based on specific requirements)
    
    return true; // For MVP, accept most valid LPs
  }

  emitLPCreationEvent(lpData) {
    // Create standardized LP creation event
    const event = {
      type: 'LP_CREATION',
      timestamp: Date.now(),
      lpAddress: lpData.address,
      programId: lpData.programId,
      tokenA: lpData.tokenA,
      tokenB: lpData.tokenB,
      tokenAMetadata: lpData.tokenAMetadata,
      tokenBMetadata: lpData.tokenBMetadata,
      lamports: lpData.lamports,
      confidence: this.calculateLPConfidence(lpData)
    };

    // Log the event for signal processing
    this.logger.info(`🚀 NEW LP DETECTED:`, {
      address: event.lpAddress.substring(0, 8) + '...',
      tokenA: event.tokenAMetadata?.symbol || 'UNKNOWN',
      tokenB: event.tokenBMetadata?.symbol || 'UNKNOWN',
      confidence: event.confidence,
      lamports: event.lamports
    });

    // Store in cache for signal modules to access
    this.cache.set(`lp_event_${event.lpAddress}`, {
      data: event,
      timestamp: Date.now()
    });

    // TODO: Integration point for signal modules
    // This is where the smart wallet signal would be triggered
    return event;
  }

  calculateLPConfidence(lpData) {
    let confidence = 50; // Base confidence

    // Token metadata available
    if (lpData.tokenAMetadata) confidence += 10;
    if (lpData.tokenBMetadata) confidence += 10;

    // Meme token characteristics
    if (lpData.tokenAMetadata && this.apiClient.isPotentialMemeToken(
      lpData.tokenAMetadata.name || '',
      lpData.tokenAMetadata.symbol || ''
    )) {
      confidence += 15;
    }

    // LP size (lamports)
    if (lpData.lamports > 10000000) confidence += 10; // > 0.01 SOL
    if (lpData.lamports > 100000000) confidence += 10; // > 0.1 SOL

    // Program credibility
    const knownPrograms = [
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Raydium
      'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'   // Orca
    ];
    if (knownPrograms.includes(lpData.programId)) {
      confidence += 15;
    }

    return Math.min(95, Math.max(25, confidence));
  }

  cleanLPMemo() {
    // Keep only recent entries to prevent memory growth
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let cleanedCount = 0;

    // Since Set doesn't have timestamps, we'll just clear periodically
    if (this.recentLPMemo.size > 10000) {
      this.recentLPMemo.clear();
      cleanedCount = this.recentLPMemo.size;
      this.logger.debug(`Cleaned LP memo: removed all entries to prevent memory growth`);
    }

    return cleanedCount;
  }

  // Utility method to get recent LP events for signal processing
  getRecentLPEvents(maxEvents = 50) {
    const events = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith('lp_event_') && events.length < maxEvents) {
        // Only return events from last hour
        if (Date.now() - value.timestamp < 3600000) {
          events.push(value.data);
        }
      }
    }

    // Sort by timestamp (newest first)
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }

  getLPScanningStatus() {
    return {
      isScanning: this.isLPScanning,
      interval: this.lpScanInterval ? 'active' : 'inactive',
      concurrencyLimit: this.lpScanConcurrencyLimit,
      maxLPsPerScan: this.maxLPsPerScan,
      memoSize: this.recentLPMemo.size,
      recentEvents: this.getRecentLPEvents(10).length
    };
  }

}

// =============================================
// COMPLETE API CLIENT FOR JUPITER AND DEXSCREENER
// =============================================


// Export as singleton for MVP
module.exports = new RPCConnectionManager();