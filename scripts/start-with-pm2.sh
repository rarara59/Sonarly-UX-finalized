#!/bin/bash

# PM2 Startup Script for THORP System
# Enables automatic memory-based restarts for 24/7 operation

echo "🚀 Starting THORP System with PM2 Process Manager"
echo "================================================"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it first:"
    echo "   npm install -g pm2"
    echo "   or"
    echo "   npm install pm2 && npx pm2"
    exit 1
fi

# Stop any existing PM2 processes for thorp-system
echo "🛑 Stopping any existing PM2 processes..."
pm2 stop thorp-system 2>/dev/null || true
pm2 delete thorp-system 2>/dev/null || true

# Start the system with PM2
echo "🔄 Starting system with PM2 configuration..."
pm2 start ecosystem.config.js

# Show status
echo ""
echo "📊 PM2 Process Status:"
pm2 status

# Show initial logs
echo ""
echo "📜 Initial logs (last 20 lines):"
pm2 logs thorp-system --lines 20 --nostream

echo ""
echo "✅ THORP System started with PM2!"
echo ""
echo "Useful PM2 commands:"
echo "  pm2 status          - Show process status"
echo "  pm2 logs            - View real-time logs"
echo "  pm2 monit           - Interactive monitoring"
echo "  pm2 restart thorp-system - Restart the system"
echo "  pm2 stop thorp-system    - Stop the system"
echo "  pm2 delete thorp-system  - Remove from PM2"
echo ""
echo "Memory limit: 150MB (auto-restart when exceeded)"
echo "Logs location: ./logs/pm2-*.log"