module.exports = {
  "apps": [
    {
      "name": "thorp-system",
      "script": "./system-main.js",
      "node_args": "--expose-gc --max-old-space-size=2172",
      "instances": 1,
      "max_memory_restart": "1448M",
      "env": {
        "NODE_ENV": "production",
        "ENABLE_HEALTH_ENDPOINT": "true",
        "HEALTH_PORT": 3001
      },
      "min_uptime": "60s",
      "max_restarts": 20,
      "autorestart": true,
      "kill_timeout": 10000,
      "restart_delay": 5000,
      "exp_backoff_restart_delay": 100,
      "exec_mode": "fork",
      "log_date_format": "YYYY-MM-DD HH:mm:ss",
      "error_file": "./logs/pm2-error.log",
      "out_file": "./logs/pm2-out.log",
      "merge_logs": true,
      "watch": false,
      "ignore_watch": [
        "node_modules",
        "logs",
        ".git",
        "memory-dumps"
      ]
    }
  ]
};