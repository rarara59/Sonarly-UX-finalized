# Session 2: Production Operations - Health Monitoring & Configuration Hot-Reload

**MISSION**: Build production operations capabilities that provide real-time system visibility and live parameter adjustment during trading operations.

**EXISTING WORKING FOUNDATION** (Sessions 1 + Previous):
- RPC pool with all 5 critical safety patterns (CS1-CS5)
- Comprehensive configuration system with 35+ variable validation  
- Enhanced production logger with request tracing
- Idempotency manager and ordered event bus
- **NEW from Session 1**: Backpressure management system and graceful shutdown manager
- Real Solana mainnet integration with 54ms latency

---

## MONEY-LOSING FAILURE SCENARIOS TO PREVENT

### **CRITICAL FAILURE #3: Production Debugging Blindness**
**Current Risk**: System failures during live trading with no health visibility → can't diagnose issues fast enough → extended downtime during profitable periods.
**Financial Impact**: Every minute of undiagnosed downtime during viral events = lost profits. BONK event lasted 4 hours - system issues without visibility = missing entire opportunity.
**Required Solution**: Real-time health monitoring with component-level visibility and failure alerting.

### **CRITICAL FAILURE #4: Configuration Drift During Live Trading**
**Current Risk**: Can't adjust trading parameters during market opportunities without system restart → miss profit opportunities due to rigid configuration.
**Financial Impact**: Market conditions change rapidly. Wrong parameters during shift = systematic losses until next restart.
**Required Solution**: Hot-reload configuration system that validates and applies changes without trading interruption.

---

## COMPONENT #1: PRODUCTION HEALTH MONITOR

### **Implementation Requirements**
```javascript
// REQUIRED PATTERN: Real-time system health with component-level visibility
class ProductionHealthMonitor {
  constructor(components, config = {}) {
    this.components = components;
    this.config = {
      checkIntervalMs: config.checkIntervalMs || 30000,
      alertThresholds: {
        rpcLatencyMs: config.maxRpcLatency || 100,
        memoryUsageMB: config.maxMemoryMB || 1000,
        errorRate: config.maxErrorRate || 0.05,
        queueUtilization: config.maxQueueUtil || 0.9
      },
      ...config
    };
    
    this.healthHistory = [];
    this.alerts = new Map();
    this.isMonitoring = false;
  }
  
  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('Starting production health monitoring');
    
    // Perform initial health check
    const initialHealth = await this.performHealthCheck();
    console.log('Initial system health:', initialHealth.overall);
    
    this.monitoringInterval = setInterval(async () => {
      try {
        const healthReport = await this.performHealthCheck();
        this.processHealthReport(healthReport);
      } catch (error) {
        console.error('Health check failed:', error.message);
        this.recordHealthCheckFailure(error);
      }
    }, this.config.checkIntervalMs);
  }
  
  async performHealthCheck() {
    const healthReport = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      components: {},
      system: {}
    };
    
    // System-level health metrics
    const memUsage = process.memoryUsage();
    healthReport.system = {
      memory: {
        heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
        rssMemoryMB: Math.round(memUsage.rss / 1024 / 1024)
      },
      uptime: process.uptime(),
      pid: process.pid
    };
    
    // Check if system memory usage is concerning
    if (healthReport.system.memory.heapUsedMB > this.config.alertThresholds.memoryUsageMB) {
      healthReport.overall = 'degraded';
    }
    
    // Component-level health checks
    for (const [name, component] of Object.entries(this.components)) {
      try {
        const componentHealth = await this.checkComponent(name, component);
        healthReport.components[name] = componentHealth;
        
        if (componentHealth.status === 'critical') {
          healthReport.overall = 'critical';
        } else if (componentHealth.status === 'degraded' && healthReport.overall === 'healthy') {
          healthReport.overall = 'degraded';
        }
      } catch (error) {
        healthReport.components[name] = {
          status: 'critical',
          error: error.message,
          lastCheck: new Date().toISOString()
        };
        healthReport.overall = 'critical';
      }
    }
    
    return healthReport;
  }
  
  async checkComponent(name, component) {
    const health = {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      metrics: {}
    };
    
    switch (name) {
      case 'rpcPool':
        if (typeof component.getStats === 'function') {
          const rpcStats = component.getStats();
          health.metrics = {
            successRate: rpcStats.successRate || 0,
            avgLatencyMs: rpcStats.avgLatencyMs || 0,
            p95LatencyMs: rpcStats.p95LatencyMs || 0,
            activeConnections: rpcStats.activeConnections || 0
          };
          
          if (health.metrics.p95LatencyMs > this.config.alertThresholds.rpcLatencyMs) {
            health.status = 'degraded';
            health.issue = 'HIGH_LATENCY';
            health.details = `P95 latency ${health.metrics.p95LatencyMs}ms exceeds threshold ${this.config.alertThresholds.rpcLatencyMs}ms`;
          }
          
          if (health.metrics.successRate < 0.95) {
            health.status = 'critical';
            health.issue = 'HIGH_ERROR_RATE';
            health.details = `Success rate ${Math.round(health.metrics.successRate * 100)}% below 95%`;
          }
        }
        break;
        
      case 'eventBus':
        if (typeof component.getStats === 'function') {
          const busStats = component.getStats();
          health.metrics = {
            queueDepth: busStats.queueDepth || 0,
            utilization: busStats.utilization || 0,
            throughput: busStats.eventsPerSecond || 0
          };
          
          if (health.metrics.utilization > this.config.alertThresholds.queueUtilization * 100) {
            health.status = 'degraded';
            health.issue = 'HIGH_QUEUE_UTILIZATION';
            health.details = `Queue utilization ${health.metrics.utilization}% exceeds threshold`;
          }
        }
        break;
        
      case 'backpressureManager':
        if (typeof component.getStats === 'function') {
          const bpStats = component.getStats();
          health.metrics = {
            utilization: bpStats.utilization || 0,
            rejectionRate: Math.round((bpStats.rejectionRate || 0) * 100),
            currentLoad: bpStats.currentLoad || 0,
            status: bpStats.status || 'UNKNOWN'
          };
          
          if (health.metrics.utilization > 95) {
            health.status = 'critical';
            health.issue = 'SYSTEM_OVERLOAD';
            health.details = `System utilization at ${health.metrics.utilization}%`;
          } else if (health.metrics.utilization > 80) {
            health.status = 'degraded';
            health.issue = 'HIGH_UTILIZATION';
            health.details = `System utilization at ${health.metrics.utilization}%`;
          }
        }
        break;
        
      case 'circuitBreaker':
        if (typeof component.getStats === 'function') {
          const cbStats = component.getStats();
          health.metrics = {
            state: cbStats.state || 'UNKNOWN',
            failures: cbStats.failures || 0,
            successes: cbStats.successes || 0
          };
          
          if (health.metrics.state === 'OPEN') {
            health.status = 'critical';
            health.issue = 'CIRCUIT_BREAKER_OPEN';
            health.details = 'Circuit breaker is OPEN - requests being rejected';
          } else if (health.metrics.state === 'HALF_OPEN') {
            health.status = 'degraded';
            health.issue = 'CIRCUIT_BREAKER_RECOVERING';
            health.details = 'Circuit breaker in HALF_OPEN state - testing recovery';
          }
        }
        break;
        
      default:
        // Generic health check for unknown components
        if (typeof component.isHealthy === 'function') {
          const isHealthy = await component.isHealthy();
          health.status = isHealthy ? 'healthy' : 'degraded';
        } else if (typeof component.getStatus === 'function') {
          const status = await component.getStatus();
          health.metrics.customStatus = status;
        }
    }
    
    return health;
  }
  
  processHealthReport(healthReport) {
    // Store in history (keep last 100 reports for trend analysis)
    this.healthHistory.push(healthReport);
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }
    
    // Check for alert conditions
    this.checkAlertConditions(healthReport);
    
    // Log health changes
    if (healthReport.overall === 'critical') {
      console.error('CRITICAL SYSTEM HEALTH ALERT:', {
        overall: healthReport.overall,
        criticalComponents: Object.entries(healthReport.components)
          .filter(([_, comp]) => comp.status === 'critical')
          .map(([name, comp]) => ({ name, issue: comp.issue, details: comp.details }))
      });
    } else if (healthReport.overall === 'degraded') {
      console.warn('SYSTEM HEALTH DEGRADED:', {
        overall: healthReport.overall,
        degradedComponents: Object.entries(healthReport.components)
          .filter(([_, comp]) => comp.status === 'degraded')
          .map(([name, comp]) => ({ name, issue: comp.issue }))
      });
    }
  }
  
  checkAlertConditions(healthReport) {
    // Alert if system has been critical for more than 2 minutes
    const recentReports = this.healthHistory.slice(-4); // Last 4 reports = 2 minutes at 30s intervals
    if (recentReports.length >= 4 && recentReports.every(r => r.overall === 'critical')) {
      this.raiseAlert('SUSTAINED_CRITICAL', 'System has been critical for 2+ minutes', healthReport);
    }
    
    // Alert on memory growth trend
    if (this.healthHistory.length >= 10) {
      const recent10 = this.healthHistory.slice(-10);
      const memoryTrend = recent10.map(r => r.system.memory.heapUsedMB);
      const growth = memoryTrend[memoryTrend.length - 1] - memoryTrend[0];
      
      if (growth > 100) { // 100MB growth over 5 minutes
        this.raiseAlert('MEMORY_GROWTH', `Memory usage increased by ${growth}MB`, healthReport);
      }
    }
  }
  
  raiseAlert(type, message, healthReport) {
    const alertId = `${type}_${Date.now()}`;
    const alert = {
      id: alertId,
      type,
      message,
      timestamp: new Date().toISOString(),
      healthReport,
      acknowledged: false
    };
    
    this.alerts.set(alertId, alert);
    console.error(`HEALTH ALERT [${type}]: ${message}`);
    
    // Limit alert history
    if (this.alerts.size > 100) {
      const oldestAlert = this.alerts.keys().next().value;
      this.alerts.delete(oldestAlert);
    }
  }
  
  getHealthSummary() {
    if (this.healthHistory.length === 0) {
      return { error: 'No health data available' };
    }
    
    const recent = this.healthHistory.slice(-10);
    const currentHealth = this.healthHistory[this.healthHistory.length - 1];
    
    const healthyCnt = recent.filter(r => r.overall === 'healthy').length;
    const degradedCnt = recent.filter(r => r.overall === 'degraded').length;
    const criticalCnt = recent.filter(r => r.overall === 'critical').length;
    
    return {
      currentHealth,
      recentTrend: {
        healthyPct: Math.round((healthyCnt / recent.length) * 100),
        degradedPct: Math.round((degradedCnt / recent.length) * 100),
        criticalPct: Math.round((criticalCnt / recent.length) * 100)
      },
      activeAlerts: Array.from(this.alerts.values()).filter(a => !a.acknowledged),
      totalReports: this.healthHistory.length,
      monitoringDuration: this.healthHistory.length > 1 
        ? new Date(currentHealth.timestamp) - new Date(this.healthHistory[0].timestamp)
        : 0
    };
  }
  
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.isMonitoring = false;
      console.log('Health monitoring stopped');
    }
  }
}
```

---

## COMPONENT #2: CONFIGURATION HOT-RELOAD SYSTEM

### **Implementation Requirements**
```javascript
// REQUIRED PATTERN: Live parameter adjustment without trading interruption
class HotReloadConfigManager {
  constructor(configPath = '.env') {
    this.configPath = configPath;
    this.watchers = new Map(); // component -> callback
    this.currentConfig = {};
    this.lastReload = 0;
    this.reloadInProgress = false;
    this.reloadHistory = [];
    
    this.loadInitialConfig();
    this.setupFileWatcher();
  }
  
  loadInitialConfig() {
    try {
      this.currentConfig = this.loadAndValidateConfig();
      console.log(`Initial configuration loaded: ${Object.keys(this.currentConfig).length} variables`);
    } catch (error) {
      console.error('Failed to load initial configuration:', error.message);
      throw error; // Fail fast on startup
    }
  }
  
  loadAndValidateConfig() {
    // Load from file
    const fs = require('fs');
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }
    
    const configContent = fs.readFileSync(this.configPath, 'utf8');
    const config = {};
    
    // Parse .env format
    for (const line of configContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    // Validate configuration
    this.validateConfig(config);
    
    return config;
  }
  
  validateConfig(config) {
    const required = [
      'HELIUS_RPC_URL',
      'RPC_DEFAULT_TIMEOUT_MS',
      'MIN_EDGE_SCORE'
    ];
    
    // Check required variables
    for (const key of required) {
      if (!config[key]) {
        throw new Error(`Required configuration variable missing: ${key}`);
      }
    }
    
    // Type validation
    const numericKeys = [
      'RPC_DEFAULT_TIMEOUT_MS',
      'MIN_EDGE_SCORE',
      'BACKPRESSURE_MAX_QUEUE_SIZE',
      'SHUTDOWN_TIMEOUT_MS'
    ];
    
    for (const key of numericKeys) {
      if (config[key] && isNaN(parseInt(config[key]))) {
        throw new Error(`Configuration variable ${key} must be numeric, got: ${config[key]}`);
      }
    }
    
    // Range validation
    if (config.MIN_EDGE_SCORE && (parseInt(config.MIN_EDGE_SCORE) < 0 || parseInt(config.MIN_EDGE_SCORE) > 100)) {
      throw new Error('MIN_EDGE_SCORE must be between 0 and 100');
    }
    
    if (config.RPC_DEFAULT_TIMEOUT_MS && parseInt(config.RPC_DEFAULT_TIMEOUT_MS) < 100) {
      throw new Error('RPC_DEFAULT_TIMEOUT_MS must be at least 100ms');
    }
    
    // URL validation for RPC endpoints
    const urlKeys = ['HELIUS_RPC_URL', 'CHAINSTACK_RPC_URL', 'PUBLIC_RPC_URL'];
    for (const key of urlKeys) {
      if (config[key] && !this.isValidUrl(config[key])) {
        throw new Error(`Configuration variable ${key} must be a valid URL`);
      }
    }
  }
  
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
  
  setupFileWatcher() {
    const fs = require('fs');
    
    fs.watch(this.configPath, (eventType, filename) => {
      if (eventType === 'change' && !this.reloadInProgress) {
        // Debounce file system events
        clearTimeout(this.reloadTimeout);
        this.reloadTimeout = setTimeout(() => {
          this.reloadConfig();
        }, 1000);
      }
    });
    
    console.log(`Configuration file watcher setup for: ${this.configPath}`);
  }
  
  onConfigChange(componentName, callback) {
    this.watchers.set(componentName, callback);
    console.log(`Component ${componentName} registered for configuration changes`);
  }
  
  async reloadConfig() {
    if (this.reloadInProgress) return;
    
    this.reloadInProgress = true;
    const reloadStartTime = Date.now();
    
    try {
      console.log('Configuration file changed - reloading...');
      
      const newConfig = this.loadAndValidateConfig();
      const changes = this.detectChanges(this.currentConfig, newConfig);
      
      if (changes.length === 0) {
        console.log('No configuration changes detected');
        return;
      }
      
      console.log(`Configuration changes detected:`, changes.map(c => `${c.key}: ${c.oldValue} → ${c.newValue}`));
      
      // Notify components of changes
      const notifications = [];
      let notificationErrors = 0;
      
      for (const [componentName, callback] of this.watchers) {
        try {
          const relevantChanges = changes.filter(c => 
            this.isRelevantForComponent(componentName, c.key)
          );
          
          if (relevantChanges.length > 0) {
            console.log(`Notifying ${componentName} of ${relevantChanges.length} relevant changes`);
            notifications.push(
              this.notifyComponent(componentName, callback, newConfig, relevantChanges)
            );
          }
        } catch (error) {
          console.error(`Failed to prepare notification for ${componentName}:`, error.message);
          notificationErrors++;
        }
      }
      
      // Wait for all components to acknowledge changes (with timeout)
      const results = await Promise.allSettled(notifications);
      const failedNotifications = results.filter(r => r.status === 'rejected');
      
      if (failedNotifications.length > 0) {
        console.warn(`${failedNotifications.length} component notifications failed, but proceeding with config update`);
        failedNotifications.forEach((result, idx) => {
          console.warn(`Notification ${idx} failed:`, result.reason?.message);
        });
      }
      
      // Update current config
      const previousConfig = { ...this.currentConfig };
      this.currentConfig = newConfig;
      this.lastReload = Date.now();
      
      // Record reload in history
      this.reloadHistory.push({
        timestamp: new Date().toISOString(),
        changes,
        duration: Date.now() - reloadStartTime,
        notificationErrors,
        failedNotifications: failedNotifications.length,
        success: true
      });
      
      console.log(`Configuration reload completed successfully in ${Date.now() - reloadStartTime}ms`);
      
    } catch (error) {
      console.error('Configuration reload failed - keeping previous config:', error.message);
      
      this.reloadHistory.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        duration: Date.now() - reloadStartTime,
        success: false
      });
    } finally {
      this.reloadInProgress = false;
    }
  }
  
  async notifyComponent(componentName, callback, newConfig, changes) {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${componentName} notification timeout after 5s`)), 5000)
    );
    
    const notification = Promise.resolve(callback(newConfig, changes));
    
    return Promise.race([notification, timeout]);
  }
  
  detectChanges(oldConfig, newConfig) {
    const changes = [];
    const allKeys = new Set([...Object.keys(oldConfig), ...Object.keys(newConfig)]);
    
    for (const key of allKeys) {
      if (oldConfig[key] !== newConfig[key]) {
        changes.push({
          key,
          oldValue: oldConfig[key] || '<not set>',
          newValue: newConfig[key] || '<removed>',
          timestamp: Date.now()
        });
      }
    }
    
    return changes;
  }
  
  isRelevantForComponent(componentName, configKey) {
    const componentMappings = {
      rpcPool: ['RPC_', 'HELIUS_', 'CHAINSTACK_', 'PUBLIC_'],
      circuitBreaker: ['RPC_BREAKER_', 'CIRCUIT_'],
      eventBus: ['EVENT_', 'QUEUE_'],
      backpressureManager: ['BACKPRESSURE_', 'QUEUE_MAX_SIZE'],
      shutdownManager: ['SHUTDOWN_', 'GRACEFUL_'],
      detection: ['MIN_EDGE_', 'MIN_LIQUIDITY_', 'MAX_HOLDER_', 'MIN_MARKET_', 'MAX_MARKET_'],
      logging: ['LOG_', 'TRACE_'],
      healthMonitor: ['HEALTH_', 'ALERT_', 'MONITOR_']
    };
    
    const prefixes = componentMappings[componentName] || [];
    return prefixes.some(prefix => configKey.startsWith(prefix));
  }
  
  getReloadStats() {
    return {
      lastReload: this.lastReload ? new Date(this.lastReload).toISOString() : 'never',
      reloadInProgress: this.reloadInProgress,
      watchedComponents: Array.from(this.watchers.keys()),
      configPath: this.configPath,
      reloadHistory: this.reloadHistory.slice(-10), // Last 10 reloads
      currentConfigSize: Object.keys(this.currentConfig).length
    };
  }
  
  getCurrentConfig() {
    return { ...this.currentConfig }; // Return copy
  }
}
```

---

## INTEGRATION WITH EXISTING SYSTEM

### **System Startup Integration**
```javascript
// SYSTEM INTEGRATION PATTERN:
const config = loadThorpConfig();

// Initialize health monitor with all system components
const healthMonitor = new ProductionHealthMonitor({
  rpcPool,
  eventBus,
  backpressureManager,
  shutdownManager,
  circuitBreaker
}, config.health);

// Initialize hot-reload configuration
const configManager = new HotReloadConfigManager('.env');

// Register components for configuration changes
configManager.onConfigChange('rpcPool', async (newConfig, changes) => {
  console.log('RPC pool received config changes:', changes.map(c => c.key));
  // Apply relevant changes to RPC pool
  if (changes.some(c => c.key.startsWith('RPC_'))) {
    await rpcPool.updateConfiguration(newConfig);
  }
});

configManager.onConfigChange('backpressureManager', async (newConfig, changes) => {
  console.log('Backpressure manager received config changes:', changes.map(c => c.key));
  // Apply backpressure configuration changes
  if (changes.some(c => c.key.startsWith('BACKPRESSURE_'))) {
    backpressureManager.updateConfiguration(newConfig);
  }
});

// Start health monitoring
await healthMonitor.startMonitoring();

// Export for system use
export { healthMonitor, configManager };
```

---

## COMPREHENSIVE TESTING REQUIREMENTS

### **YOU MUST CREATE AND RUN THESE TESTS**

#### **Test 1: Health Monitor with Component Integration**
```javascript
// FILE: scripts/test-health-monitor-integration.js
async function testHealthMonitorWithRealComponents() {
  console.log('Testing health monitor with real system components...');
  
  const config = loadThorpConfig();
  
  // Use actual system components
  const healthMonitor = new ProductionHealthMonitor({
    rpcPool,
    eventBus,
    backpressureManager,
    circuitBreaker
  }, {
    checkIntervalMs: 2000,
    maxRpcLatency: 100,
    maxErrorRate: 0.05
  });
  
  // Start monitoring
  await healthMonitor.startMonitoring();
  
  // Wait for several health checks
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  const healthSummary = healthMonitor.getHealthSummary();
  
  assert(healthSummary.currentHealth, 'Should have current health data');
  assert(healthSummary.currentHealth.overall, 'Should have overall health status');
  assert(healthSummary.currentHealth.components.rpcPool, 'Should have RPC pool health');
  assert(healthSummary.totalReports >= 3, 'Should have multiple health reports');
  
  // Test component health data
  const rpcHealth = healthSummary.currentHealth.components.rpcPool;
  assert(typeof rpcHealth.metrics.successRate === 'number', 'Should have RPC success rate');
  assert(typeof rpcHealth.metrics.avgLatencyMs === 'number', 'Should have RPC latency');
  
  // Stop monitoring
  healthMonitor.stopMonitoring();
  
  console.log(`✅ Health monitoring: ${healthSummary.totalReports} reports, overall status: ${healthSummary.currentHealth.overall}`);
}
```

#### **Test 2: Configuration Hot-Reload**
```javascript
// FILE: scripts/test-config-hot-reload.js
async function testConfigurationHotReload() {
  const fs = require('fs');
  const testConfigPath = './test-config.env';
  
  // Create initial test configuration
  const initialConfig = `
RPC_DEFAULT_TIMEOUT_MS=2000
MIN_EDGE_SCORE=60
LOG_LEVEL=info
BACKPRESSURE_MAX_QUEUE_SIZE=5000
`;
  
  fs.writeFileSync(testConfigPath, initialConfig.trim());
  
  console.log('Testing configuration hot-reload...');
  
  const configManager = new HotReloadConfigManager(testConfigPath);
  const configChanges = [];
  
  // Register for configuration changes
  configManager.onConfigChange('testComponent', async (newConfig, changes) => {
    configChanges.push({ config: { ...newConfig }, changes: [...changes] });
    console.log(`Received config changes: ${changes.map(c => c.key).join(', ')}`);
    return Promise.resolve();
  });
  
  // Wait for initial load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const initialState = configManager.getCurrentConfig();
  assert(initialState.RPC_DEFAULT_TIMEOUT_MS === '2000', 'Should load initial RPC timeout');
  assert(initialState.MIN_EDGE_SCORE === '60', 'Should load initial edge score');
  
  // Modify configuration
  const updatedConfig = `
RPC_DEFAULT_TIMEOUT_MS=3000
MIN_EDGE_SCORE=70
LOG_LEVEL=debug
BACKPRESSURE_MAX_QUEUE_SIZE=7500
NEW_SETTING=test_value
`;
  
  fs.writeFileSync(testConfigPath, updatedConfig.trim());
  
  // Wait for file watcher to trigger and reload to complete
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  assert(configChanges.length > 0, 'Should have detected config changes');
  
  const lastChange = configChanges[configChanges.length - 1];
  assert(lastChange.config.RPC_DEFAULT_TIMEOUT_MS === '3000', 'Should reload RPC timeout');
  assert(lastChange.config.MIN_EDGE_SCORE === '70', 'Should reload edge score');
  assert(lastChange.config.LOG_LEVEL === 'debug', 'Should reload log level');
  assert(lastChange.config.NEW_SETTING === 'test_value', 'Should load new settings');
  
  const reloadStats = configManager.getReloadStats();
  assert(reloadStats.reloadHistory.length > 0, 'Should have reload history');
  assert(reloadStats.reloadHistory[reloadStats.reloadHistory.length - 1].success, 'Last reload should be successful');
  
  // Cleanup
  fs.unlinkSync(testConfigPath);
  
  console.log('✅ Configuration hot-reload test passed');
}
```

#### **Test 3: Health Monitor Alerting**
```javascript
// FILE: scripts/test-health-monitor-alerting.js
async function testHealthMonitorAlerting() {
  console.log('Testing health monitor alerting system...');
  
  // Create mock components with controllable health
  const mockRpcPool = {
    getStats: () => ({
      successRate: 0.95,
      avgLatencyMs: 45,
      p95LatencyMs: 80,
      activeConnections: 25
    })
  };
  
  const mockBackpressure = {
    getStats: () => ({
      utilization: 45,
      rejectionRate: 0.01,
      currentLoad: 450,
      status: 'HEALTHY'
    })
  };
  
  const healthMonitor = new ProductionHealthMonitor({
    rpcPool: mockRpcPool,
    backpressureManager: mockBackpressure
  }, {
    checkIntervalMs: 1000,
    maxRpcLatency: 100,
    maxErrorRate: 0.05
  });
  
  await healthMonitor.startMonitoring();
  
  // Wait for initial healthy state
  await new Promise(resolve => setTimeout(resolve, 2000));
  let healthSummary = healthMonitor.getHealthSummary();
  assert(healthSummary.currentHealth.overall === 'healthy', 'Initial health should be healthy');
  
  // Degrade RPC pool performance
  mockRpcPool.getStats = () => ({
    successRate: 0.80,  // Below threshold
    avgLatencyMs: 150,   // Above threshold
    p95LatencyMs: 200,   // Above threshold
    activeConnections: 25
  });
  
  // Wait for health check to detect degradation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  healthSummary = healthMonitor.getHealthSummary();
  assert(healthSummary.currentHealth.overall === 'critical', 'Should detect critical RPC state');
  assert(healthSummary.currentHealth.components.rpcPool.status === 'critical', 'RPC pool should be critical');
  assert(healthSummary.currentHealth.components.rpcPool.issue === 'HIGH_ERROR_RATE', 'Should identify high error rate');
  
  // Test backpressure critical state
  mockBackpressure.getStats = () => ({
    utilization: 96,     // Above critical threshold
    rejectionRate: 0.3,
    currentLoad: 9600,
    status: 'CRITICAL'
  });
  
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  healthSummary = healthMonitor.getHealthSummary();
  assert(healthSummary.currentHealth.components.backpressureManager.status === 'critical', 'Backpressure should be critical');
  
  healthMonitor.stopMonitoring();
  
  console.log('✅ Health monitor alerting test passed');
}
```

#### **Test 4: Invalid Configuration Handling**
```javascript
// FILE: scripts/test-invalid-config-handling.js
async function testInvalidConfigurationHandling() {
  const fs = require('fs');
  const testConfigPath = './test-invalid-config.env';
  
  console.log('Testing invalid configuration handling...');
  
  // Start with valid configuration
  const validConfig = `
RPC_DEFAULT_TIMEOUT_MS=2000
MIN_EDGE_SCORE=60
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=test123
`;
  
  fs.writeFileSync(testConfigPath, validConfig.trim());
  
  const configManager = new HotReloadConfigManager(testConfigPath);
  
  // Wait for initial load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const initialConfig = configManager.getCurrentConfig();
  assert(initialConfig.RPC_DEFAULT_TIMEOUT_MS === '2000', 'Should load valid config');
  
  // Test invalid numeric value
  const invalidNumericConfig = `
RPC_DEFAULT_TIMEOUT_MS=not_a_number
MIN_EDGE_SCORE=60
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=test123
`;
  
  fs.writeFileSync(testConfigPath, invalidNumericConfig.trim());
  
  // Wait for reload attempt
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Should keep previous valid config
  const configAfterInvalid = configManager.getCurrentConfig();
  assert(configAfterInvalid.RPC_DEFAULT_TIMEOUT_MS === '2000', 'Should keep previous valid config on validation failure');
  
  const reloadStats = configManager.getReloadStats();
  const lastReload = reloadStats.reloadHistory[reloadStats.reloadHistory.length - 1];
  assert(lastReload.success === false, 'Invalid config reload should fail');
  assert(lastReload.error, 'Should have error message');
  
  // Test invalid URL
  const invalidUrlConfig = `
RPC_DEFAULT_TIMEOUT_MS=2000
MIN_EDGE_SCORE=60
HELIUS_RPC_URL=not-a-valid-url
`;
  
  fs.writeFileSync(testConfigPath, invalidUrlConfig.trim());
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Should still keep previous valid config
  const configAfterInvalidUrl = configManager.getCurrentConfig();
  assert(configAfterInvalidUrl.HELIUS_RPC_URL === 'https://mainnet.helius-rpc.com/?api-key=test123', 'Should keep valid URL');
  
  // Cleanup
  fs.unlinkSync(testConfigPath);
  
  console.log('✅ Invalid configuration handling test passed');
}
```

---

## FILES TO CREATE

1. **src/utils/production-health-monitor.js** - Real-time system health monitoring
2. **src/config/hot-reload-config-manager.js** - Live configuration adjustment system
3. **scripts/test-health-monitor-integration.js** - Health monitoring with real components
4. **scripts/test-config-hot-reload.js** - Configuration hot-reload testing
5. **scripts/test-health-monitor-alerting.js** - Health alerting system testing  
6. **scripts/test-invalid-config-handling.js** - Configuration validation testing

## CRITICAL SUCCESS CRITERIA

**You must RUN all tests and show me the results. Both components must:**

1. **Health Monitor**: Provide real-time visibility into all system components
2. **Config Hot-Reload**: Apply configuration changes without system restart
3. **Component Integration**: Work with existing RPC pool, backpressure, and other components
4. **Alert System**: Detect and alert on system degradation
5. **Validation**: Handle invalid configuration without system failure

**The system must be ready for Session 3 with complete production monitoring and live configuration management capabilities.**