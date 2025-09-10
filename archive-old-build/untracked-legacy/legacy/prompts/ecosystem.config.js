/**
 * PM2 Ecosystem Configuration
 * Generated from Phase 4B memory testing data
 * Date: 2025-09-03
 * 
 * Based on memory calculations from results/pm2-memory-calculations.json:
 * - Per component memory: 60MB (50MB base + 20% safety margin)
 * - Total system memory: 420MB for 7 components
 * - Restart interval: 4 hours (14400 seconds)
 * - CPU cores available: 8
 */

module.exports = {
  apps: [
    {
      // Main RPC Connection Pool Application
      name: 'rpc-pool-main',
      script: './src/index.js',
      
      // Cluster Configuration
      instances: 4, // Use 4 instances (50% of 8 cores for balanced performance)
      exec_mode: 'cluster',
      
      // Memory Management - Based on Phase 4B Testing
      max_memory_restart: '60M', // From PM2 calculations with 20% safety margin
      
      // Restart Policy - 4 hour cycles based on memory growth projections
      cron_restart: '0 */4 * * *', // Restart every 4 hours on the hour
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      
      // Environment Variables
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        MEMORY_LIMIT_MB: 60,
        COMPONENT_MEMORY_MB: 60,
        RESTART_INTERVAL_HOURS: 4,
        NODE_OPTIONS: '--max-old-space-size=512'
      },
      
      // Logging Configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/rpc-pool-error.log',
      out_file: './logs/rpc-pool-out.log',
      combine_logs: false,
      merge_logs: false,
      time: true,
      
      // Advanced Options
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
      
      // Monitoring
      monitor: {
        memory: true,
        cpu: true
      }
    },
    
    {
      // Token Bucket Component
      name: 'token-bucket',
      script: './src/components/token-bucket.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '60M',
      cron_restart: '10 */4 * * *', // Stagger by 10 minutes
      autorestart: true,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        COMPONENT_NAME: 'TokenBucket',
        MEMORY_LIMIT_MB: 60
      },
      error_file: './logs/token-bucket-error.log',
      out_file: './logs/token-bucket-out.log',
      time: true
    },
    
    {
      // Circuit Breaker Component
      name: 'circuit-breaker',
      script: './src/components/circuit-breaker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '60M',
      cron_restart: '15 */4 * * *', // Stagger by 15 minutes
      autorestart: true,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        COMPONENT_NAME: 'CircuitBreaker',
        MEMORY_LIMIT_MB: 60,
        CIRCUIT_THRESHOLD: 5,
        CIRCUIT_TIMEOUT: 10000
      },
      error_file: './logs/circuit-breaker-error.log',
      out_file: './logs/circuit-breaker-out.log',
      time: true
    },
    
    {
      // Connection Pool Component
      name: 'connection-pool',
      script: './src/components/connection-pool.js',
      instances: 2, // Multiple instances for connection handling
      exec_mode: 'cluster',
      max_memory_restart: '60M',
      cron_restart: '20 */4 * * *', // Stagger by 20 minutes
      autorestart: true,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        COMPONENT_NAME: 'ConnectionPool',
        MEMORY_LIMIT_MB: 60,
        MAX_CONNECTIONS: 10,
        CONNECTION_TIMEOUT: 5000
      },
      error_file: './logs/connection-pool-error.log',
      out_file: './logs/connection-pool-out.log',
      time: true
    },
    
    {
      // Endpoint Selector Component
      name: 'endpoint-selector',
      script: './src/components/endpoint-selector.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '60M',
      cron_restart: '25 */4 * * *', // Stagger by 25 minutes
      autorestart: true,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        COMPONENT_NAME: 'EndpointSelector',
        MEMORY_LIMIT_MB: 60,
        HEALTH_CHECK_INTERVAL: 30000
      },
      error_file: './logs/endpoint-selector-error.log',
      out_file: './logs/endpoint-selector-out.log',
      time: true
    },
    
    {
      // Request Cache Component
      name: 'request-cache',
      script: './src/components/request-cache.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '60M',
      cron_restart: '30 */4 * * *', // Stagger by 30 minutes
      autorestart: true,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        COMPONENT_NAME: 'RequestCache',
        MEMORY_LIMIT_MB: 60,
        CACHE_SIZE_LIMIT: 1000,
        CACHE_TTL: 60000
      },
      error_file: './logs/request-cache-error.log',
      out_file: './logs/request-cache-out.log',
      time: true
    },
    
    {
      // Batch Manager Component
      name: 'batch-manager',
      script: './src/components/batch-manager.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '60M',
      cron_restart: '35 */4 * * *', // Stagger by 35 minutes
      autorestart: true,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        COMPONENT_NAME: 'BatchManager',
        MEMORY_LIMIT_MB: 60,
        BATCH_SIZE: 50,
        BATCH_INTERVAL: 100
      },
      error_file: './logs/batch-manager-error.log',
      out_file: './logs/batch-manager-out.log',
      time: true
    },
    
    {
      // Hedged Manager Component
      name: 'hedged-manager',
      script: './src/components/hedged-manager.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '60M',
      cron_restart: '40 */4 * * *', // Stagger by 40 minutes
      autorestart: true,
      restart_delay: 4000,
      env: {
        NODE_ENV: 'production',
        COMPONENT_NAME: 'HedgedManager',
        MEMORY_LIMIT_MB: 60,
        HEDGED_DELAY: 50
      },
      error_file: './logs/hedged-manager-error.log',
      out_file: './logs/hedged-manager-out.log',
      time: true
    },
    
    {
      // Development Mode Configuration
      name: 'rpc-pool-dev',
      script: './src/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '100M', // Higher limit for development
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', 'logs', 'results', '.git'],
      watch_delay: 1000,
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        DEBUG: 'rpc:*',
        MEMORY_LIMIT_MB: 100
      },
      error_file: './logs/dev-error.log',
      out_file: './logs/dev-out.log',
      time: true
    }
  ],
  
  // Deploy Configuration
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/rpc-pool.git',
      path: '/var/www/rpc-pool',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    }
  }
};

/**
 * PM2 USAGE INSTRUCTIONS
 * ======================
 * 
 * Starting Applications:
 *   pm2 start ecosystem.config.js                 # Start all apps
 *   pm2 start ecosystem.config.js --only rpc-pool-main  # Start specific app
 *   pm2 start ecosystem.config.js --env development    # Start in dev mode
 * 
 * Monitoring:
 *   pm2 monit                    # Real-time monitoring dashboard
 *   pm2 list                     # List all processes
 *   pm2 info rpc-pool-main        # Detailed info about specific app
 * 
 * Logs:
 *   pm2 logs                      # Stream all logs
 *   pm2 logs rpc-pool-main        # Logs for specific app
 *   pm2 logs --lines 100          # Last 100 lines
 * 
 * Management:
 *   pm2 restart all              # Restart all apps
 *   pm2 reload all               # Zero-downtime reload
 *   pm2 stop all                 # Stop all apps
 *   pm2 delete all               # Remove all apps from PM2
 * 
 * Persistence:
 *   pm2 save                     # Save current process list
 *   pm2 resurrect                # Restore saved process list
 *   pm2 startup                  # Generate startup script
 * 
 * MEMORY CALCULATIONS (from Phase 4B Testing)
 * ============================================
 * 
 * Test Results Summary:
 *   - Baseline memory per component: 50MB
 *   - Safety margin applied: 20%
 *   - Final limit per component: 60MB
 *   - Total for 7 components: 420MB
 * 
 * Growth Analysis:
 *   - Average growth rate: -4340.67 bytes/sec (negative = stable)
 *   - 4-hour projection: Negligible growth
 *   - Recommended restart: Every 4 hours (safety measure)
 * 
 * Cluster Sizing:
 *   - Available CPU cores: 8
 *   - Main app instances: 4 (50% of cores)
 *   - Component services: 1-2 instances each
 *   - Total PM2 footprint: ~660MB
 * 
 * Restart Schedule:
 *   - Main app: Every 4 hours at :00
 *   - Components: Staggered at :10, :15, :20, :25, :30, :35, :40
 *   - Prevents simultaneous restarts
 *   - Maintains service availability
 * 
 * VALIDATION CRITERIA MET
 * =======================
 * ✅ Memory limits based on actual Phase 4B measurements
 * ✅ 20% safety margin applied (60MB vs 50MB baseline)
 * ✅ 4-hour restart cycles configured with cron
 * ✅ All required PM2 parameters included
 * ✅ Staggered restarts prevent service disruption
 */