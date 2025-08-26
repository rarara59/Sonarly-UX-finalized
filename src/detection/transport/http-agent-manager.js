import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import HttpsKeepAliveAgent from 'agentkeepalive';
import { logger, generateRequestId } from '../../utils/logger.js';
import { randomUUID } from 'crypto';

class HttpAgentManager {
  constructor() {
    this.agents = new Map(); // endpoint -> agent mapping
    this.connectionTracking = new Map(); // conn_id -> metadata
    this.socketStats = {
      open_sockets: 0,
      free_sockets: 0,
      queued_requests: 0,
      sockets_by_endpoint: {}
    };
    this.statusInterval = null;
  }

  createAgent(endpointConfig) {
    const agentConfig = {
      keepAlive: true,
      keepAliveMsecs: 30000,
      freeSocketTimeout: 60000,
      timeout: endpointConfig.timeout_ms || 10000,
      maxSockets: endpointConfig.concurrency_limit || 10,
      maxFreeSockets: Math.ceil((endpointConfig.concurrency_limit || 10) / 2),
      maxTotalSockets: (endpointConfig.concurrency_limit || 10) * 2,
      scheduling: 'fifo'
    };

    const isHttps = endpointConfig.url.startsWith('https://');
    
    let agent;
    if (isHttps) {
      // Use HttpsKeepAliveAgent for HTTPS endpoints
      const HttpsAgent = HttpsKeepAliveAgent.HttpsAgent;
      agent = new HttpsAgent({
        ...agentConfig,
        secureProtocol: 'TLSv1_2_method',
        maxCachedSessions: 100,
        timeout: agentConfig.timeout
      });
    } else {
      agent = new HttpAgent(agentConfig);
    }

    // Track agent creation
    logger.info({
      component: 'rpc-pool',
      event: 'agent.init',
      endpoint: endpointConfig.alias,
      keep_alive: true,
      http_version: 'http/1.1',
      maxSockets: agentConfig.maxSockets,
      maxFreeSockets: agentConfig.maxFreeSockets,
      freeSocketTimeout_ms: agentConfig.freeSocketTimeout,
      maxTotalSockets: agentConfig.maxTotalSockets,
      keepAliveMsecs: agentConfig.keepAliveMsecs
    });

    this.agents.set(endpointConfig.alias, agent);
    this.socketStats.sockets_by_endpoint[endpointConfig.alias] = {
      open: 0,
      free: 0,
      queued: 0
    };

    return agent;
  }

  getAgent(endpointAlias) {
    return this.agents.get(endpointAlias);
  }

  generateConnectionId() {
    return randomUUID().slice(0, 8);
  }

  trackConnection(connId, endpointAlias, isReused = false) {
    this.connectionTracking.set(connId, {
      endpoint: endpointAlias,
      created_at: Date.now(),
      reused: isReused,
      request_count: isReused ? (this.connectionTracking.get(connId)?.request_count || 0) + 1 : 1
    });

    return {
      conn_id: connId,
      reused_socket: isReused
    };
  }

  updateSocketStats() {
    let totalOpen = 0;
    let totalFree = 0;
    let totalQueued = 0;

    for (const [alias, agent] of this.agents.entries()) {
      const sockets = agent.sockets || {};
      const freeSockets = agent.freeSockets || {};
      const requests = agent.requests || {};

      let endpointOpen = 0;
      let endpointFree = 0;
      let endpointQueued = 0;

      // Count sockets per host
      for (const hostSockets of Object.values(sockets)) {
        endpointOpen += Array.isArray(hostSockets) ? hostSockets.length : 0;
      }

      // Count free sockets per host
      for (const hostFreeSockets of Object.values(freeSockets)) {
        endpointFree += Array.isArray(hostFreeSockets) ? hostFreeSockets.length : 0;
      }

      // Count queued requests per host
      for (const hostRequests of Object.values(requests)) {
        endpointQueued += Array.isArray(hostRequests) ? hostRequests.length : 0;
      }

      this.socketStats.sockets_by_endpoint[alias] = {
        open: endpointOpen,
        free: endpointFree,
        queued: endpointQueued
      };

      totalOpen += endpointOpen;
      totalFree += endpointFree;
      totalQueued += endpointQueued;
    }

    this.socketStats.open_sockets = totalOpen;
    this.socketStats.free_sockets = totalFree;
    this.socketStats.queued_requests = totalQueued;
  }

  startStatusMonitoring(intervalMs = 10000) {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }

    this.statusInterval = setInterval(() => {
      this.updateSocketStats();
      
      logger.info({
        component: 'rpc-pool',
        event: 'agent.status',
        open_sockets: this.socketStats.open_sockets,
        free_sockets: this.socketStats.free_sockets,
        queued_requests: this.socketStats.queued_requests,
        sockets_by_endpoint: this.socketStats.sockets_by_endpoint,
        active_connections: this.connectionTracking.size
      });
    }, intervalMs);
  }

  stopStatusMonitoring() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }
  }

  cleanup() {
    this.stopStatusMonitoring();
    
    for (const agent of this.agents.values()) {
      if (agent.destroy) {
        agent.destroy();
      }
    }
    
    this.agents.clear();
    this.connectionTracking.clear();
  }
}

export default HttpAgentManager;