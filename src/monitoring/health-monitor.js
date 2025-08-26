//src/monitoring/health-monitor.js (NEW FILE)

import { getAgentForUrl, makeHttpRequest } from '../config/http-agent-config.js';

/**
 * Production-grade health monitor with self-protection mechanisms
 * Prevents thundering herd effects and self-inflicted rate limiting
 */
export class HealthMonitor {
  constructor(endpoints, healthConfig, httpAgents, logger) {
    this.endpoints = endpoints;
    this.healthConfig = healthConfig;
    this.httpAgents = httpAgents;
    this.logger = logger;
    
    // RPS limiting state
    this.probeCount = 0;
    this.lastProbeWindow = Date.now();
    this.rpsLimit = healthConfig.probeRpsLimit || 2;
    
    // Scheduling state
    this.isRunning = false;
    this.intervalId = null;
    this.nextProbeTime = null;
    
    // Statistics
    this.stats = {
      totalProbes: 0,
      successfulProbes: 0,
      failedProbes: 0,
      timeoutProbes: 0,
      rpsLimitedProbes: 0,
      lastProbeTime: null,
      uptimeStart: Date.now()
    };
    
    this.logger.debug('HealthMonitor initialized', {
      endpoints: endpoints.map(e => e.name),
      interval_ms: healthConfig.interval,
      jitter_ms: healthConfig.jitter,
      probe_timeout_ms: healthConfig.probeTimeout,
      probe_rps_limit: this.rpsLimit
    });
  }
  
  /**
   * Start health monitoring with jittered scheduling
   */
  start() {
    if (this.isRunning) {
      this.logger.warn('Health monitor already running');
      return;
    }
    
    this.isRunning = true;
    this.stats.uptimeStart = Date.now();
    
    this.logger.info('Health monitoring started', {
      interval_ms: this.healthConfig.interval,
      jitter_ms: this.healthConfig.jitter,
      probe_timeout_ms: this.healthConfig.probeTimeout,
      probe_rps_limit: this.rpsLimit,
      endpoints: this.endpoints.map(e => e.name)
    });
    
    // Start first probe cycle
    this.scheduleNextProbe();
  }
  
  /**
   * Stop health monitoring gracefully
   */
  stop() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
    
    const uptimeMs = Date.now() - this.stats.uptimeStart;
    
    this.logger.info('Health monitoring stopped', {
      uptime_ms: uptimeMs,
      total_probes: this.stats.totalProbes,
      successful_probes: this.stats.successfulProbes,
      failed_probes: this.stats.failedProbes,
      rps_limited_probes: this.stats.rpsLimitedProbes,
      success_rate: this.stats.totalProbes > 0 ? 
        ((this.stats.successfulProbes / this.stats.totalProbes) * 100).toFixed(1) + '%' : 'N/A'
    });
  }
  
  /**
   * Schedule next probe with random jitter to prevent thundering herd
   */
  scheduleNextProbe() {
    if (!this.isRunning) {
      return;
    }
    
    // Calculate jittered delay
    const baseInterval = this.healthConfig.interval;
    const maxJitter = this.healthConfig.jitter;
    const jitterMs = Math.random() * maxJitter;
    const nextProbeDelay = baseInterval + jitterMs;
    
    this.nextProbeTime = Date.now() + nextProbeDelay;
    
    this.logger.debug('Next health probe scheduled', {
      base_interval_ms: baseInterval,
      jitter_applied_ms: Math.round(jitterMs),
      total_delay_ms: Math.round(nextProbeDelay),
      next_probe_at: new Date(this.nextProbeTime).toISOString()
    });
    
    this.intervalId = setTimeout(() => {
      this.runProbesCycle();
      this.scheduleNextProbe();
    }, nextProbeDelay);
  }
  
  /**
   * Run health probes for all endpoints with RPS limiting
   */
  async runProbesCycle() {
    if (!this.isRunning) {
      return;
    }
    
    const now = Date.now();
    
    // Reset RPS counter every second
    if (now - this.lastProbeWindow >= 1000) {
      this.probeCount = 0;
      this.lastProbeWindow = now;
    }
    
    // Check RPS limit
    const probesNeeded = this.endpoints.length;
    const rpsAvailable = this.rpsLimit - this.probeCount;
    
    if (rpsAvailable <= 0) {
      this.stats.rpsLimitedProbes += probesNeeded;
      this.logger.debug('Health probes skipped due to RPS limit', {
        current_rps: this.probeCount,
        rps_limit: this.rpsLimit,
        probes_skipped: probesNeeded,
        next_window_in_ms: 1000 - (now - this.lastProbeWindow)
      });
      return;
    }
    
    // Limit probes to available RPS budget
    const probesToRun = Math.min(probesNeeded, rpsAvailable);
    const endpointsToProbe = this.endpoints.slice(0, probesToRun);
    
    if (probesToRun < probesNeeded) {
      this.logger.debug('Health probes throttled by RPS limit', {
        probes_needed: probesNeeded,
        probes_running: probesToRun,
        rps_available: rpsAvailable
      });
    }
    
    // Run probes in parallel
    const probePromises = endpointsToProbe.map(endpoint => this.probeEndpoint(endpoint));
    await Promise.allSettled(probePromises);
    
    // Update probe count
    this.probeCount += probesToRun;
    this.stats.lastProbeTime = now;
  }
  
  /**
   * Probe individual endpoint with timeout and error handling
   * @param {Object} endpoint - Endpoint configuration
   */
  async probeEndpoint(endpoint) {
    const startTime = Date.now();
    const requestId = `probe_${endpoint.name}_${startTime}`;
    
    this.stats.totalProbes++;
    
    try {
      // Get appropriate agent for this endpoint
      const agent = getAgentForUrl(endpoint.url, this.httpAgents);
      
      // Make health check request
      const response = await makeHttpRequest(endpoint.url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Thorp-Health-Monitor/1.0'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: requestId,
          method: 'getHealth'
        }),
        timeout: this.healthConfig.probeTimeout,
        agent: agent
      });
      
      const latencyMs = Date.now() - startTime;
      
      if (response.ok) {
        this.stats.successfulProbes++;
        this.logHealthProbe(endpoint.name, startTime, 'ok', null, latencyMs);
      } else {
        this.stats.failedProbes++;
        this.logHealthProbe(endpoint.name, startTime, 'error', 
          new Error(`HTTP ${response.status}: ${response.statusText}`), latencyMs);
      }
      
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      let outcome = 'error';
      
      // Classify error type
      if (error.message?.includes('timeout')) {
        outcome = 'timeout';
        this.stats.timeoutProbes++;
      } else {
        this.stats.failedProbes++;
      }
      
      this.logHealthProbe(endpoint.name, startTime, outcome, error, latencyMs);
    }
  }
  
  /**
   * Log health probe result with structured data
   * @param {string} endpoint - Endpoint name
   * @param {number} startTime - Probe start timestamp
   * @param {string} outcome - Probe outcome (ok|timeout|error)
   * @param {Error} error - Error object if probe failed
   * @param {number} latencyMs - Probe latency in milliseconds
   */
  logHealthProbe(endpoint, startTime, outcome, error = null, latencyMs) {
    const logData = {
      message: 'Health probe completed',
      endpoint: endpoint,
      latency_ms: latencyMs,
      outcome: outcome,
      probe_time: new Date(startTime).toISOString(),
      probe_timeout_ms: this.healthConfig.probeTimeout
    };
    
    if (error) {
      logData.error = error.message || 'Unknown error';
      logData.error_type = error.constructor?.name || 'Error';
    }
    
    // Health probes are debug level unless they fail
    if (outcome === 'ok') {
      this.logger.debug('Health probe completed', logData);
    } else {
      this.logger.warn('Health probe failed', logData);
    }
  }
  
  /**
   * Get current health monitor statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const now = Date.now();
    const uptimeMs = now - this.stats.uptimeStart;
    
    return {
      is_running: this.isRunning,
      uptime_ms: uptimeMs,
      uptime_hours: (uptimeMs / (1000 * 60 * 60)).toFixed(2),
      total_probes: this.stats.totalProbes,
      successful_probes: this.stats.successfulProbes,
      failed_probes: this.stats.failedProbes,
      timeout_probes: this.stats.timeoutProbes,
      rps_limited_probes: this.stats.rpsLimitedProbes,
      success_rate_percent: this.stats.totalProbes > 0 ? 
        ((this.stats.successfulProbes / this.stats.totalProbes) * 100).toFixed(1) : '0.0',
      last_probe_time: this.stats.lastProbeTime ? 
        new Date(this.stats.lastProbeTime).toISOString() : null,
      next_probe_time: this.nextProbeTime ? 
        new Date(this.nextProbeTime).toISOString() : null,
      current_rps_usage: this.probeCount,
      rps_limit: this.rpsLimit,
      config: {
        interval_ms: this.healthConfig.interval,
        jitter_ms: this.healthConfig.jitter,
        probe_timeout_ms: this.healthConfig.probeTimeout,
        probe_rps_limit: this.rpsLimit,
        endpoints: this.endpoints.map(e => e.name)
      }
    };
  }
  
  /**
   * Check if health monitor is healthy (self-monitoring)
   * @returns {boolean} True if health monitor is operating normally
   */
  isHealthy() {
    if (!this.isRunning) {
      return false;
    }
    
    const now = Date.now();
    const timeSinceLastProbe = this.stats.lastProbeTime ? 
      now - this.stats.lastProbeTime : Infinity;
    
    // Consider unhealthy if no probes in 2x the expected interval
    const maxAllowedGap = (this.healthConfig.interval + this.healthConfig.jitter) * 2;
    
    return timeSinceLastProbe < maxAllowedGap;
  }
  
  /**
   * Force immediate health probe cycle (for testing)
   */
  async forceProbe() {
    this.logger.debug('Forcing immediate health probe cycle');
    await this.runProbesCycle();
  }
}

/**
 * Create and configure health monitor instance
 * @param {Array} endpoints - Array of endpoint configurations
 * @param {Object} healthConfig - Health monitoring configuration
 * @param {Object} httpAgents - HTTP agents for connection reuse
 * @param {Object} logger - Logger instance
 * @returns {HealthMonitor} Configured health monitor instance
 */
export function createHealthMonitor(endpoints, healthConfig, httpAgents, logger) {
  return new HealthMonitor(endpoints, healthConfig, httpAgents, logger);
}