// === rpc-connection-pool.js – MINIMAL PATCHES ONLY ===

// 1) Constructor: add deps + ttl cache + per-endpoint cooldown fields
constructor(endpoints, performanceMonitor = null, deps = {}) {
  this.healthCheckIntervalId = null;
  this.queueMonitoringIntervalId = null;
  this.monitor = performanceMonitor;

  // deps (DI for tests)
  this.http = deps.http ?? globalThis.fetch.bind(globalThis);
  this.now = deps.now ?? (() => Date.now());
  this.log = deps.log ?? console;

  // Short-TTL cache (fast re-requests within a poll slice)
  const Cache = deps.Cache ?? class {
    constructor({ max = 2048, ttlMs = 250 } = {}) { this.max=max; this.ttl=ttlMs; this.map=new Map(); }
    get(k){ const e=this.map.get(k); if(!e||e.exp<this.now) return this.map.delete(k), undefined; return e.v; }
    set(k,v,ttl=this.ttl){ if(this.map.size>=this.max){ const [old]=this.map.keys(); this.map.delete(old);} this.map.set(k,{v,exp:(deps.now?deps.now():Date.now())+ttl}); }
  };
  this.cache = new Cache({ max: 2048, ttlMs: 250 });

  // stats (unchanged) …
  this.stats = { /* …existing… */ };

  // endpoints + cooldown fields
  this.endpoints = new Map();
  this.initializeEndpoints(endpoints || this.getDefaultEndpoints());
  // add breaker-like cooldown per endpoint
  for (const ep of this.endpoints.values()) { ep.openUntil = 0; ep.halfOpen = false; }

  this.currentEndpoint = this.selectBestEndpoint();
  this.requestId = 1;
  this.healthCheckInterval = 30000;
  this.failoverThreshold = 3;

  this.requestQueue = [];
  this.maxConcurrentRequests = 50;
  this.activeRequests = 0;

  this.maxQueueSize = 200;
  this.queueHealthCheckInterval = 10000;

  this.startHealthMonitoring();
  this.startQueueMonitoring();
}

// 2) call(): add short-TTL cache
async call(method, params = [], options = {}) {
  const startTime = performance.now?.() ?? (this.now() / 1);
  const timeout = options.timeout || 8000;

  // short-TTL cache key
  const ck = `${method}:${JSON.stringify(params)}`;
  const cached = this.cache.get(ck);
  if (cached !== undefined) return cached;

  try {
    this.stats.totalRequests++;
    await this.waitForSlot();
    this.activeRequests++;

    const result = await this.executeCall(method, params, timeout);

    const latency = (performance.now?.() ?? this.now()) - startTime;
    this.updateSuccessMetrics(latency);
    if (this.monitor?.recordLatency) this.monitor.recordLatency('rpcConnection', latency, true);

    this.cache.set(ck, result, 250); // save result briefly
    return result;
  } catch (error) {
    const latency = (performance.now?.() ?? this.now()) - startTime;
    this.handleCallFailure(error, latency);
    throw error;
  } finally {
    this.activeRequests--;
    this.processQueue();
  }
}

// 3) executeCall(): try currentEndpoint first, skip cooldown, support half-open probe
async executeCall(method, params, timeout) {
  let lastError;

  const all = Array.from(this.endpoints.values())
    .filter(ep => ep.health !== 'dead');

  // move currentEndpoint to front if present
  const attempts = [];
  const cur = all.find(ep => ep.name === this.currentEndpoint);
  if (cur) attempts.push(cur);
  for (const ep of all) if (!cur || ep.name !== cur.name) attempts.push(ep);

  for (const endpoint of attempts) {
    const now = this.now();
    if (endpoint.openUntil && now < endpoint.openUntil) continue; // cooldown skip unless half-open
    try {
      if (!this.canMakeRequest(endpoint)) continue;
      const result = await this.makeRequest(endpoint, method, params, timeout);
      // success → close breaker
      endpoint.consecutiveFailures = 0;
      endpoint.health = 'healthy';
      endpoint.openUntil = 0;
      endpoint.halfOpen = false;
      this.updateEndpointHealth(endpoint.name, true);
      return result;
    } catch (error) {
      lastError = error;
      this.updateEndpointHealth(endpoint.name, false);

      // breaker: if degraded, set cooldown; allow rare half-open later
      if (endpoint.health !== 'dead' && endpoint.consecutiveFailures >= this.failoverThreshold) {
        endpoint.health = endpoint.consecutiveFailures >= 10 ? 'dead' : 'degraded';
        endpoint.openUntil = this.now() + 8000; // 8s cooldown
        endpoint.halfOpen = true; // next pass after cooldown will be single probe
      }
      continue;
    }
  }
  throw new Error(`All RPC endpoints failed. Last error: ${lastError?.message || 'Unknown error'}`);
}

// 4) makeRequest(): use injected fetch + keep your timeout pattern
async makeRequest(endpoint, method, params, timeout) {
  const requestPayload = { jsonrpc:'2.0', id:this.requestId++, method, params };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    endpoint.totalRequests++;
    endpoint.requestsThisSecond++;
    const res = await this.http(endpoint.url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (data?.error) throw new Error(`RPC Error: ${data.error.message} (${data.error.code})`);
    endpoint.successfulRequests++;
    return data.result;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms`);
    throw e;
  }
}

// 5) startQueueMonitoring(): shed overload instead of forcing resolve()
startQueueMonitoring() {
  this.queueMonitoringIntervalId = setInterval(() => {
    if (this.requestQueue.length > this.maxQueueSize) {
      const toDrop = this.requestQueue.length - this.maxQueueSize;
      this.log.warn(`Request queue oversize: ${this.requestQueue.length} items, dropping ${toDrop}`);
      for (let i = 0; i < toDrop; i++) {
        const item = this.requestQueue.shift();
        if (item?.timeoutId) clearTimeout(item.timeoutId);
        // reject to *shed load* (do not resolve)
        if (item?.reject) item.reject(new Error('backpressure_drop'));
      }
    }
    const now = this.now();
    this.requestQueue = this.requestQueue.filter(item => {
      const age = now - (item.timestamp || now);
      if (age > 60000) { if (item.timeoutId) clearTimeout(item.timeoutId); if (item.reject) item.reject(new Error('queue_timeout')); return false; }
      return true;
    });
  }, this.queueHealthCheckInterval);
}

// 6) waitForSlot(): store reject so monitor can drop correctly
async waitForSlot() {
  if (this.activeRequests < this.maxConcurrentRequests) return;
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const idx = this.requestQueue.findIndex(it => it.resolve === resolve);
      if (idx >= 0) this.requestQueue.splice(idx, 1);
      reject(new Error('Request queue timeout after 30 seconds'));
    }, 30000);
    this.requestQueue.push({ resolve, reject, timeoutId, timestamp: this.now() });
  });
}