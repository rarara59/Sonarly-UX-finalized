#!/bin/bash

# PM2 Production Setup for THORP System
# Configures PM2 for automatic startup and 24/7 operation

echo "🚀 PM2 Production Setup for THORP System"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PM2 is installed
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}❌ PM2 is not installed${NC}"
        echo "Please install PM2 first:"
        echo "  npm install -g pm2"
        exit 1
    fi
    echo -e "${GREEN}✅ PM2 is installed${NC}"
    pm2 --version
    echo ""
}

# Setup PM2 startup script
setup_startup() {
    echo "📦 Setting up PM2 startup script..."
    
    # Generate startup script
    pm2 startup
    
    echo -e "${YELLOW}⚠️  Please run the command shown above with sudo if required${NC}"
    echo "This will ensure PM2 starts automatically on system boot"
    echo ""
    
    read -p "Press Enter after running the startup command..."
}

# Start the THORP system
start_system() {
    echo "🔄 Starting THORP system with PM2..."
    
    # Stop any existing instance
    pm2 stop thorp-system 2>/dev/null || true
    pm2 delete thorp-system 2>/dev/null || true
    
    # Start with ecosystem config
    pm2 start ecosystem.config.js --env production
    
    echo -e "${GREEN}✅ System started${NC}"
    echo ""
}

# Save PM2 process list
save_processes() {
    echo "💾 Saving PM2 process list..."
    pm2 save
    echo -e "${GREEN}✅ Process list saved${NC}"
    echo "PM2 will now restore this process list on system reboot"
    echo ""
}

# Configure PM2 monitoring
setup_monitoring() {
    echo "📊 PM2 Monitoring Configuration"
    echo "================================"
    
    # Show current status
    pm2 status
    echo ""
    
    # Show memory and CPU info
    pm2 info thorp-system
    echo ""
    
    echo "Available monitoring commands:"
    echo "  pm2 monit           - Real-time monitoring dashboard"
    echo "  pm2 logs            - View application logs"
    echo "  pm2 status          - Quick status check"
    echo "  pm2 describe thorp-system - Detailed process info"
    echo ""
}

# Setup log rotation
setup_log_rotation() {
    echo "📜 Setting up log rotation..."
    
    # Install pm2-logrotate module
    pm2 install pm2-logrotate
    
    # Configure log rotation
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    pm2 set pm2-logrotate:compress true
    pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
    
    echo -e "${GREEN}✅ Log rotation configured${NC}"
    echo "  Max file size: 10MB"
    echo "  Retention: 30 files"
    echo "  Compression: enabled"
    echo "  Rotation: daily at midnight"
    echo ""
}

# Setup PM2 web dashboard (optional)
setup_web_dashboard() {
    echo "🌐 PM2 Web Dashboard Setup (Optional)"
    echo "====================================="
    
    read -p "Do you want to setup PM2 web dashboard? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Install PM2 web dashboard
        pm2 install pm2-web
        
        echo -e "${GREEN}✅ PM2 web dashboard installed${NC}"
        echo "Access at: http://localhost:9615"
        echo ""
    fi
}

# Health check endpoint verification
verify_health_endpoint() {
    echo "🏥 Verifying health endpoint..."
    
    # Wait for system to start
    sleep 5
    
    # Check if health endpoint is responding
    if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Health endpoint is responding${NC}"
        echo "Health check URL: http://localhost:3001/health"
        
        # Show health data
        echo ""
        echo "Current health status:"
        curl -s http://localhost:3001/health | python3 -m json.tool 2>/dev/null || \
        curl -s http://localhost:3001/health
        echo ""
    else
        echo -e "${YELLOW}⚠️  Health endpoint not responding${NC}"
        echo "This is optional and can be enabled with ENABLE_HEALTH_ENDPOINT=true"
    fi
}

# Main setup flow
main() {
    echo "This script will configure PM2 for production deployment"
    echo "including automatic startup, monitoring, and log rotation"
    echo ""
    
    # Step 1: Check PM2
    check_pm2
    
    # Step 2: Setup startup script
    read -p "Setup PM2 startup script? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_startup
    fi
    
    # Step 3: Start system
    start_system
    
    # Step 4: Save processes
    save_processes
    
    # Step 5: Setup log rotation
    read -p "Setup log rotation? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_log_rotation
    fi
    
    # Step 6: Optional web dashboard
    setup_web_dashboard
    
    # Step 7: Verify health endpoint
    verify_health_endpoint
    
    # Step 8: Show monitoring info
    setup_monitoring
    
    echo ""
    echo "=========================================="
    echo -e "${GREEN}✅ PM2 Production Setup Complete!${NC}"
    echo "=========================================="
    echo ""
    echo "Key Information:"
    echo "  Process name: thorp-system"
    echo "  Memory limit: 150MB (auto-restart)"
    echo "  Logs: ./logs/pm2-*.log"
    echo "  Config: ./ecosystem.config.js"
    echo ""
    echo "Useful commands:"
    echo "  pm2 restart thorp-system  - Restart the system"
    echo "  pm2 reload thorp-system   - Zero-downtime reload"
    echo "  pm2 stop thorp-system     - Stop the system"
    echo "  pm2 logs thorp-system     - View logs"
    echo "  pm2 monit                 - Interactive monitoring"
    echo ""
    echo "The system will now:"
    echo "  ✅ Start automatically on boot"
    echo "  ✅ Restart if memory exceeds 150MB"
    echo "  ✅ Restart on crash"
    echo "  ✅ Rotate logs automatically"
    echo ""
}

# Run main setup
main