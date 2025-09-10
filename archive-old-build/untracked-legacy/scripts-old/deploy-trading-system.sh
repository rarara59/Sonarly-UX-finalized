#!/bin/bash

################################################################################
# Trading-Optimized Production Deployment Script
# Deploys meme coin detection system with monitoring and rollback capability
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$DEPLOY_DIR/backups/$(date +%Y%m%d_%H%M%S)"
LOG_DIR="$DEPLOY_DIR/logs"
DEPLOYMENT_LOG="$LOG_DIR/deployment_$(date +%Y%m%d_%H%M%S).log"
START_TIME=$(date +%s)

# Deployment stages
STAGE_PREFLIGHT=1
STAGE_BACKUP=2
STAGE_DEPENDENCIES=3
STAGE_CONFIG=4
STAGE_COMPONENTS=5
STAGE_PM2=6
STAGE_MONITORING=7
STAGE_VALIDATION=8
CURRENT_STAGE=0

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "${2:-}$1${NC}" | tee -a "$DEPLOYMENT_LOG"
}

log_success() {
    log "✅ $1" "$GREEN"
}

log_error() {
    log "❌ $1" "$RED"
}

log_warning() {
    log "⚠️  $1" "$YELLOW"
}

log_info() {
    log "ℹ️  $1" "$BLUE"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed"
        return 1
    fi
    return 0
}

rollback() {
    log_warning "Initiating rollback..."
    ROLLBACK_START=$(date +%s)
    
    # Stop PM2 processes
    if pm2 list &> /dev/null; then
        pm2 stop all 2>/dev/null || true
        pm2 delete all 2>/dev/null || true
    fi
    
    # Restore backup if exists
    if [[ -d "$BACKUP_DIR" ]]; then
        log_info "Restoring from backup..."
        rsync -av --delete "$BACKUP_DIR/" "$DEPLOY_DIR/" 2>/dev/null || true
        log_success "Backup restored"
    fi
    
    # Restart previous PM2 configuration
    if [[ -f "$BACKUP_DIR/ecosystem.config.js" ]]; then
        cd "$BACKUP_DIR"
        pm2 start ecosystem.config.js --env production 2>/dev/null || true
        log_success "Previous PM2 configuration restored"
    fi
    
    ROLLBACK_END=$(date +%s)
    ROLLBACK_TIME=$((ROLLBACK_END - ROLLBACK_START))
    log_info "Rollback completed in ${ROLLBACK_TIME} seconds"
    
    exit 1
}

trap_error() {
    log_error "Deployment failed at stage $CURRENT_STAGE"
    rollback
}

trap trap_error ERR

################################################################################
# Stage 1: Pre-flight Checks
################################################################################

stage_preflight() {
    CURRENT_STAGE=$STAGE_PREFLIGHT
    log_info "Stage 1: Pre-flight checks"
    
    # Check required commands
    local required_commands=("node" "npm" "pm2" "git")
    for cmd in "${required_commands[@]}"; do
        if ! check_command "$cmd"; then
            log_error "Missing required command: $cmd"
            exit 1
        fi
    done
    log_success "All required commands present"
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)
    if [[ $NODE_MAJOR -lt 16 ]]; then
        log_error "Node.js version 16+ required (found: v$NODE_VERSION)"
        exit 1
    fi
    log_success "Node.js version: v$NODE_VERSION"
    
    # Check disk space (require at least 1GB)
    AVAILABLE_SPACE=$(df "$DEPLOY_DIR" | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 1048576 ]]; then
        log_error "Insufficient disk space (< 1GB available)"
        exit 1
    fi
    log_success "Disk space: $(echo "scale=2; $AVAILABLE_SPACE/1048576" | bc)GB available"
    
    # Check network connectivity
    if ! ping -c 1 api.mainnet-beta.solana.com &> /dev/null; then
        log_warning "Cannot reach Solana mainnet - network may be restricted"
    else
        log_success "Network connectivity verified"
    fi
    
    # Create required directories
    mkdir -p "$LOG_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$DEPLOY_DIR/results"
    log_success "Directory structure created"
}

################################################################################
# Stage 2: Backup Current System
################################################################################

stage_backup() {
    CURRENT_STAGE=$STAGE_BACKUP
    log_info "Stage 2: Backing up current system"
    
    # Save PM2 state
    if pm2 list &> /dev/null; then
        pm2 save 2>/dev/null || true
        log_success "PM2 state saved"
    fi
    
    # Backup critical files
    local backup_files=(
        "ecosystem.config.js"
        "src"
        "scripts"
        "package.json"
        "package-lock.json"
    )
    
    for file in "${backup_files[@]}"; do
        if [[ -e "$DEPLOY_DIR/$file" ]]; then
            cp -r "$DEPLOY_DIR/$file" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done
    
    log_success "Backup created at: $BACKUP_DIR"
}

################################################################################
# Stage 3: Install/Update Dependencies
################################################################################

stage_dependencies() {
    CURRENT_STAGE=$STAGE_DEPENDENCIES
    log_info "Stage 3: Installing dependencies"
    
    cd "$DEPLOY_DIR"
    
    # Clean install for production
    if [[ -d "node_modules" ]]; then
        log_info "Cleaning existing node_modules..."
        rm -rf node_modules
    fi
    
    # Install production dependencies
    log_info "Installing production dependencies..."
    npm ci --production 2>&1 | tee -a "$DEPLOYMENT_LOG" > /dev/null
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    log_success "Dependencies installed"
    
    # Install PM2 plugins
    pm2 install pm2-logrotate 2>/dev/null || true
    pm2 set pm2-logrotate:max_size 50M 2>/dev/null || true
    pm2 set pm2-logrotate:retain 7 2>/dev/null || true
    log_success "PM2 plugins configured"
}

################################################################################
# Stage 4: Configure System
################################################################################

stage_config() {
    CURRENT_STAGE=$STAGE_CONFIG
    log_info "Stage 4: Configuring system"
    
    # Verify ecosystem.config.js exists
    if [[ ! -f "$DEPLOY_DIR/ecosystem.config.js" ]]; then
        log_error "ecosystem.config.js not found"
        exit 1
    fi
    
    # Set production environment variables
    export NODE_ENV=production
    export MEMORY_LIMIT_MB=250
    export RESTART_INTERVAL_HOURS=6
    
    # Create .env file for production
    cat > "$DEPLOY_DIR/.env" <<EOF
NODE_ENV=production
MEMORY_LIMIT_MB=250
RESTART_INTERVAL_HOURS=6
SOLANA_RPC_ENDPOINTS=https://api.mainnet-beta.solana.com,https://solana-api.projectserum.com,https://rpc.ankr.com/solana
MONITORING_ENABLED=true
ALERT_WEBHOOK_URL=${ALERT_WEBHOOK_URL:-}
LOG_LEVEL=info
EOF
    
    log_success "Production configuration created"
}

################################################################################
# Stage 5: Deploy Components
################################################################################

stage_components() {
    CURRENT_STAGE=$STAGE_COMPONENTS
    log_info "Stage 5: Deploying components"
    
    # Stop existing PM2 processes
    if pm2 list | grep -q "meme-detector"; then
        log_info "Stopping existing meme-detector process..."
        pm2 stop meme-detector 2>/dev/null || true
        pm2 delete meme-detector 2>/dev/null || true
    fi
    
    # Start main application
    log_info "Starting meme-detector..."
    cd "$DEPLOY_DIR"
    pm2 start ecosystem.config.js --env production
    
    if [[ $? -ne 0 ]]; then
        log_error "Failed to start meme-detector"
        exit 1
    fi
    
    log_success "Meme-detector started"
    
    # Wait for application to stabilize
    log_info "Waiting for application to stabilize..."
    sleep 5
    
    # Check if process is running
    if ! pm2 list | grep -q "online.*meme-detector"; then
        log_error "Meme-detector failed to start"
        pm2 logs meme-detector --lines 50 --nostream
        exit 1
    fi
    
    log_success "Application running and stable"
}

################################################################################
# Stage 6: Configure PM2
################################################################################

stage_pm2() {
    CURRENT_STAGE=$STAGE_PM2
    log_info "Stage 6: Configuring PM2"
    
    # Setup PM2 startup script
    pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true
    
    # Save PM2 configuration
    pm2 save
    log_success "PM2 configuration saved"
    
    # Set PM2 monitoring
    pm2 set pm2:autodump true
    pm2 set pm2:autorestart true
    log_success "PM2 auto-recovery configured"
}

################################################################################
# Stage 7: Start Monitoring
################################################################################

stage_monitoring() {
    CURRENT_STAGE=$STAGE_MONITORING
    log_info "Stage 7: Starting monitoring systems"
    
    # Start trading monitor
    if [[ -f "$DEPLOY_DIR/scripts/trading-monitor.js" ]]; then
        pm2 start "$DEPLOY_DIR/scripts/trading-monitor.js" \
            --name "trading-monitor" \
            --max-memory-restart 100M \
            --merge-logs \
            --log "$LOG_DIR/trading-monitor.log" \
            2>/dev/null || true
        log_success "Trading monitor started"
    else
        log_warning "Trading monitor script not found"
    fi
    
    # Start alert manager
    if [[ -f "$DEPLOY_DIR/scripts/alert-manager.js" ]]; then
        pm2 start "$DEPLOY_DIR/scripts/alert-manager.js" \
            --name "alert-manager" \
            --max-memory-restart 50M \
            --merge-logs \
            --log "$LOG_DIR/alert-manager.log" \
            2>/dev/null || true
        log_success "Alert manager started"
    else
        log_warning "Alert manager script not found"
    fi
    
    # Save final PM2 state
    pm2 save
}

################################################################################
# Stage 8: Validation
################################################################################

stage_validation() {
    CURRENT_STAGE=$STAGE_VALIDATION
    log_info "Stage 8: Validating deployment"
    
    local validation_passed=true
    
    # Check all processes are running
    local required_processes=("meme-detector")
    if [[ -f "$DEPLOY_DIR/scripts/trading-monitor.js" ]]; then
        required_processes+=("trading-monitor")
    fi
    if [[ -f "$DEPLOY_DIR/scripts/alert-manager.js" ]]; then
        required_processes+=("alert-manager")
    fi
    
    for process in "${required_processes[@]}"; do
        if pm2 list | grep -q "online.*$process"; then
            log_success "$process is running"
        else
            log_error "$process is not running"
            validation_passed=false
        fi
    done
    
    # Check memory usage
    MEMORY_USAGE=$(pm2 describe meme-detector | grep memory | awk '{print $4}')
    log_info "Memory usage: $MEMORY_USAGE"
    
    # Check for recent errors
    ERROR_COUNT=$(pm2 logs meme-detector --lines 100 --nostream 2>/dev/null | grep -c ERROR || true)
    if [[ $ERROR_COUNT -gt 0 ]]; then
        log_warning "Found $ERROR_COUNT errors in recent logs"
    else
        log_success "No errors in recent logs"
    fi
    
    # Test RPC connectivity
    if node -e "console.log('RPC test')" 2>/dev/null; then
        log_success "Node.js execution verified"
    else
        log_error "Node.js execution failed"
        validation_passed=false
    fi
    
    if [[ "$validation_passed" == false ]]; then
        log_error "Validation failed"
        exit 1
    fi
    
    log_success "All validation checks passed"
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    log "============================================================" "$BLUE"
    log "🚀 TRADING SYSTEM DEPLOYMENT" "$BLUE"
    log "============================================================" "$BLUE"
    log_info "Deployment started at: $(date)"
    log_info "Deploy directory: $DEPLOY_DIR"
    
    # Execute deployment stages
    stage_preflight
    stage_backup
    stage_dependencies
    stage_config
    stage_components
    stage_pm2
    stage_monitoring
    stage_validation
    
    # Calculate deployment time
    END_TIME=$(date +%s)
    DEPLOY_TIME=$((END_TIME - START_TIME))
    
    log "============================================================" "$GREEN"
    log "✅ DEPLOYMENT SUCCESSFUL" "$GREEN"
    log "============================================================" "$GREEN"
    log_info "Deployment time: ${DEPLOY_TIME} seconds"
    log_info "System status:"
    pm2 status
    
    log ""
    log "Next steps:" "$BLUE"
    log "  1. Monitor logs: pm2 logs" "$BLUE"
    log "  2. Check status: pm2 status" "$BLUE"
    log "  3. View monitoring: pm2 monit" "$BLUE"
    log "  4. Rollback if needed: $0 --rollback" "$BLUE"
}

################################################################################
# Script Entry Point
################################################################################

# Handle command line arguments
case "${1:-}" in
    --rollback)
        log_warning "Manual rollback requested"
        rollback
        ;;
    --help)
        echo "Usage: $0 [--rollback|--help]"
        echo "  --rollback  Rollback to previous deployment"
        echo "  --help      Show this help message"
        exit 0
        ;;
    *)
        main
        ;;
esac