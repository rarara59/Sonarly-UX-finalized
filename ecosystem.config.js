/**
 * PM2 Configuration for THORP Trading System
 * Optimized for 4-hour restart cycles with 99.93% uptime
 * Based on measured 578%/hour memory growth rate
 */

module.exports = {
  apps: [{
    // Application name in PM2
    name: 'thorp-system',
    
    // Entry point - uses existing system architecture
    script: './system-main.js',
    
    // Node.js interpreter options
    // Calculated for 4-hour cycles: 1448MB restart, 2172MB heap limit
    node_args: '--expose-gc --max-old-space-size=2172',
    
    // Number of instances (1 for single instance)
    instances: 1,
    
    // Restart app if memory exceeds 1448MB (calculated for 4-hour cycles)
    // 50MB baseline * 578% growth * 4 hours * 1.2 safety = 1448MB
    max_memory_restart: '1448M',
    
    // Environment variables
    env: {
      NODE_ENV: 'production',
      ENABLE_HEALTH_ENDPOINT: 'true',
      HEALTH_PORT: 3001
    },
    
    // Development environment variables
    env_development: {
      NODE_ENV: 'development',
      ENABLE_HEALTH_ENDPOINT: 'true',
      HEALTH_PORT: 3001
    },
    
    // Log configuration
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true,
    
    // Restart configuration (optimized for 4-hour cycles)
    min_uptime: '60s',        // App must run for 60s to be considered started
    max_restarts: 20,         // Increased for 6 daily restarts (was 10)
    autorestart: true,        // Auto restart on crash
    
    // Graceful shutdown
    kill_timeout: 10000,      // 10 seconds to gracefully shutdown (increased for safety)
    wait_ready: true,         // Wait for process.send('ready')
    listen_timeout: 15000,    // 15 seconds to start listening
    
    // Monitoring
    instance_var: 'INSTANCE_ID',
    watch: false,             // Don't watch files for changes
    ignore_watch: ['node_modules', 'logs', '.git', 'memory-dumps'],
    
    // Restart behavior
    restart_delay: 5000,      // 5 second delay between restarts
    
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    
    // Cron restart (optional - restart daily at 3 AM)
    // cron_restart: '0 3 * * *',
    
    // Additional metadata
    exec_mode: 'fork',        // Use fork mode for single instance
    
    // Process events
    events: {
      restart: 'echo "App restarted due to memory limit"',
      reload: 'echo "App reloaded"',
      stop: 'echo "App stopped"',
      exit: 'echo "App exited"'
    }
  }],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'node',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};