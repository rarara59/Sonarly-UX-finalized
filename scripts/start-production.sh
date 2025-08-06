#!/bin/bash
# Production startup script with GC optimization
# Renaissance-grade memory management for high-frequency trading

echo "🚀 Starting Thorp Trading System with GC Optimization"
echo "📊 Renaissance-grade memory management enabled"
echo ""

# Set production environment
export NODE_ENV=production

# Optimal NODE_OPTIONS for trading systems
export NODE_OPTIONS="--expose-gc --max-old-space-size=4096 --optimize-for-size"

# Additional V8 performance flags for detailed monitoring (optional)
# Uncomment for debugging memory issues
# export V8_FLAGS="--trace-gc --trace-gc-verbose"

# Check if required environment variables are set
if [ -z "$SESSION_SECRET" ]; then
    echo "❌ ERROR: SESSION_SECRET is not set"
    echo "Please set all required production environment variables"
    exit 1
fi

if [ -z "$CORS_ORIGIN" ]; then
    echo "❌ ERROR: CORS_ORIGIN is not set"
    echo "Please set all required production environment variables"
    exit 1
fi

# Validate configuration before starting
echo "🔍 Validating configuration..."
node -e "import('./src/config/validation.js').then(m => m.environmentValidator.validate()).catch(e => process.exit(1))"

if [ $? -ne 0 ]; then
    echo "❌ Configuration validation failed"
    exit 1
fi

# Log configuration
echo "✅ Environment: $NODE_ENV"
echo "✅ NODE_OPTIONS: $NODE_OPTIONS"
echo "✅ Configuration validated"
echo "✅ Starting with intelligent GC management..."
echo ""

# Start the main application
node src/index.js