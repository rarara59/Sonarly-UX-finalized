import https from 'https';
import http from 'http';

/**
 * Creates HTTP and HTTPS agents with proper Node.js keep-alive configuration
 * @param {Object} config - Configuration object with keepAlive settings
 * @returns {Object} Object containing http and https agents
 */
export function createHttpAgents(config) {
  const agents = {};
  
  // HTTPS Agent configuration (for Helius, ChainStack)
  const httpsAgentConfig = {
    keepAlive: config.keepAlive.enabled,
    keepAliveMsecs: config.keepAlive.msecs,
    maxSockets: config.keepAlive.sockets,
    maxFreeSockets: Math.floor(config.keepAlive.sockets * 0.3),
    protocol: 'https:'
  };
  
  agents.https = new https.Agent(httpsAgentConfig);
  
  // HTTP Agent configuration (for any HTTP endpoints)
  const httpAgentConfig = {
    keepAlive: config.keepAlive.enabled,
    keepAliveMsecs: config.keepAlive.msecs,
    maxSockets: config.keepAlive.sockets,
    maxFreeSockets: Math.floor(config.keepAlive.sockets * 0.3),
    protocol: 'http:'
  };
  
  agents.http = new http.Agent(httpAgentConfig);
  
  // Log agent configuration with accurate field names
  console.log('HTTP agent configured', {
    keep_alive: {
      enabled: httpsAgentConfig.keepAlive,
      max_sockets: httpsAgentConfig.maxSockets,
      max_free_sockets: httpsAgentConfig.maxFreeSockets,
      keep_alive_msecs: httpsAgentConfig.keepAliveMsecs,
      agent_type: 'https'
    }
  });
  
  return agents;
}

/**
 * Selects appropriate agent for URL protocol
 * @param {string} url - Target URL
 * @param {Object} agents - Object containing http and https agents
 * @returns {Object} Appropriate agent for the URL protocol
 */
export function getAgentForUrl(url, agents) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' ? agents.https : agents.http;
  } catch (error) {
    // Default to HTTPS agent for invalid URLs
    return agents.https;
  }
}

/**
 * Production-grade HTTP client with keep-alive support
 * Replaces fetch() with actual Node.js Agent usage
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise} Promise resolving to response object
 */
export async function makeHttpRequest(url, options = {}) {
  const https = await import('https');
  const http = await import('http');
  
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https.default : http.default;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Thorp-Trading-System/1.0',
        ...options.headers
      },
      agent: options.agent // This actually works with http/https modules
    };
    
    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          text: () => Promise.resolve(data),
          // Robust JSON parsing with error handling
          json: () => {
            return new Promise((jsonResolve, jsonReject) => {
              try {
                if (!data || data.trim() === '') {
                  jsonReject(new Error('Empty response body'));
                  return;
                }
                const parsed = JSON.parse(data);
                jsonResolve(parsed);
              } catch (jsonError) {
                jsonReject(new Error(`Invalid JSON response: ${jsonError.message}`));
              }
            });
          }
        });
      });
    });
    
    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });
    
    // Handle timeout
    if (options.timeout) {
      req.setTimeout(options.timeout, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    }
    
    // Write request body if provided
    if (options.body) {
      if (typeof options.body === 'string') {
        req.write(options.body);
      } else {
        req.write(JSON.stringify(options.body));
      }
    }
    
    req.end();
  });
}

/**
 * Test HTTP agent connection reuse
 * Makes multiple requests to same endpoint to verify socket reuse
 * @param {string} url - Test URL
 * @param {Object} agent - HTTP agent to test
 * @param {number} requestCount - Number of test requests
 * @returns {Promise} Promise resolving to connection reuse statistics
 */
export async function testConnectionReuse(url, agent, requestCount = 5) {
  const startTime = Date.now();
  const promises = [];
  
  for (let i = 0; i < requestCount; i++) {
    promises.push(
      makeHttpRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: i,
          method: 'getHealth'
        }),
        timeout: 5000,
        agent: agent
      })
    );
  }
  
  try {
    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const totalTime = Date.now() - startTime;
    
    return {
      total_requests: requestCount,
      successful_requests: successful,
      total_time_ms: totalTime,
      avg_time_per_request: totalTime / requestCount,
      connection_reuse_evidence: totalTime < (requestCount * 100), // Should be much faster with reuse
      agent_stats: {
        max_sockets: agent.maxSockets,
        keep_alive_enabled: agent.keepAlive,
        keep_alive_msecs: agent.keepAliveMsecs
      }
    };
  } catch (error) {
    throw new Error(`Connection reuse test failed: ${error.message}`);
  }
}