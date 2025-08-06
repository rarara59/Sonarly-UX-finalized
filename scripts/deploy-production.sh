#!/bin/bash
# Production deployment script with configuration validation
# Renaissance Trading System - Deployment Pipeline

set -e  # Exit on any error

echo "========================================="
echo "Renaissance Trading System - Production Deployment"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if running as production
if [ "$NODE_ENV" != "production" ]; then
    print_warning "NODE_ENV is not set to production"
    echo "Do you want to continue with deployment? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    export NODE_ENV=production
fi

# Step 1: Pre-deployment checks
echo "Step 1: Running pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
MIN_NODE_VERSION="18.0.0"

if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is below minimum required version $MIN_NODE_VERSION"
    exit 1
fi
print_success "Node.js version $NODE_VERSION meets requirements"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found"
    echo "Please create a .env file based on .env.example"
    exit 1
fi
print_success ".env file found"

# Step 2: Validate configuration
echo ""
echo "Step 2: Validating configuration..."
node scripts/validate-config.js

if [ $? -ne 0 ]; then
    print_error "Configuration validation failed"
    exit 1
fi
print_success "Configuration validation passed"

# Step 3: Run tests (if available)
echo ""
echo "Step 3: Running tests..."
if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
    npm test --silent
    if [ $? -eq 0 ]; then
        print_success "All tests passed"
    else
        print_error "Tests failed"
        exit 1
    fi
else
    print_warning "No tests configured, skipping..."
fi

# Step 4: Build (if needed)
echo ""
echo "Step 4: Building application..."
if [ -f "package.json" ] && grep -q "\"build\":" package.json; then
    npm run build
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
else
    print_success "No build step required"
fi

# Step 5: Database migrations (if needed)
echo ""
echo "Step 5: Running database migrations..."
if [ -f "scripts/migrate.js" ]; then
    node scripts/migrate.js
    if [ $? -eq 0 ]; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
else
    print_warning "No database migrations found, skipping..."
fi

# Step 6: Create required directories
echo ""
echo "Step 6: Creating required directories..."

# Create log directory if specified
if [ ! -z "$LOG_PATH" ]; then
    LOG_DIR=$(dirname "$LOG_PATH")
    mkdir -p "$LOG_DIR"
    print_success "Log directory created: $LOG_DIR"
fi

# Create data directories
mkdir -p data/backups
mkdir -p data/exports
mkdir -p data/cache
print_success "Data directories created"

# Step 7: Set up process manager (PM2)
echo ""
echo "Step 7: Setting up process manager..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not installed. Installing globally..."
    npm install -g pm2
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'thorp-trading',
    script: './src/index.js',
    instances: '${CLUSTER_WORKERS:-auto}',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--expose-gc --max-old-space-size=4096 --optimize-for-size'
    },
    error_file: '${LOG_PATH:-./logs/error.log}',
    out_file: '${LOG_PATH:-./logs/out.log}',
    merge_logs: true,
    time: true,
    max_memory_restart: '3500M',
    kill_timeout: 30000,
    listen_timeout: 10000,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    exp_backoff_restart_delay: 100
  }]
};
EOF

print_success "PM2 ecosystem file created"

# Step 8: Start the application
echo ""
echo "Step 8: Starting the application..."

# Stop any existing instances
pm2 stop thorp-trading 2>/dev/null || true
pm2 delete thorp-trading 2>/dev/null || true

# Start with PM2
pm2 start ecosystem.config.js

if [ $? -eq 0 ]; then
    print_success "Application started successfully"
    
    # Save PM2 configuration
    pm2 save
    
    # Set up PM2 startup script
    pm2 startup systemd -u $USER --hp $HOME
    
    # Show status
    echo ""
    echo "Application Status:"
    pm2 status
    
    # Show logs location
    echo ""
    echo "Logs location:"
    echo "- Application logs: ${LOG_PATH:-./logs/out.log}"
    echo "- Error logs: ${LOG_PATH:-./logs/error.log}"
    echo ""
    echo "Monitor with: pm2 monit"
    echo "View logs with: pm2 logs"
else
    print_error "Failed to start application"
    exit 1
fi

# Step 9: Post-deployment checks
echo ""
echo "Step 9: Running post-deployment checks..."

# Wait for application to start
sleep 5

# Check health endpoint
if [ ! -z "$HEALTH_CHECK_PORT" ]; then
    HEALTH_URL="http://localhost:${HEALTH_CHECK_PORT}/health"
    echo "Checking health endpoint: $HEALTH_URL"
    
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
    
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        print_success "Health check passed"
    else
        print_error "Health check failed (HTTP $HEALTH_RESPONSE)"
        echo "Check application logs for errors"
    fi
else
    print_warning "No health check port configured, skipping..."
fi

# Final summary
echo ""
echo "========================================="
print_success "DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Monitor application: pm2 monit"
echo "2. View logs: pm2 logs"
echo "3. Check metrics: http://localhost:${PROMETHEUS_PORT:-9090}/metrics"
echo "4. Verify trading functionality"
echo ""
echo "To stop the application: pm2 stop thorp-trading"
echo "To restart: pm2 restart thorp-trading"
echo "To view status: pm2 status"
echo ""
echo "Happy trading! 🚀"