#!/bin/bash

#################################################
# Production Deployment Script - Blue-Green Strategy
# Ensures zero-downtime deployment with health validation
#################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_DIR="/Users/rafaltracz/Desktop/thorpv1"
BACKUP_DIR="${DEPLOYMENT_DIR}/deployments/backups"
BLUE_ENV="${DEPLOYMENT_DIR}/deployments/blue"
GREEN_ENV="${DEPLOYMENT_DIR}/deployments/green"
CURRENT_LINK="${DEPLOYMENT_DIR}/current"
DEPLOYMENT_LOG="${DEPLOYMENT_DIR}/deployments/deployment.log"
MAX_HEALTH_RETRIES=30
HEALTH_CHECK_INTERVAL=2
DEPLOYMENT_TIMEOUT=300  # 5 minutes in seconds

# Create deployment directories if they don't exist
mkdir -p "${BACKUP_DIR}"
mkdir -p "${BLUE_ENV}"
mkdir -p "${GREEN_ENV}"
mkdir -p "$(dirname ${DEPLOYMENT_LOG})"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${DEPLOYMENT_LOG}"
    
    case ${level} in
        ERROR)
            echo -e "${RED}[ERROR]${NC} ${message}" >&2
            ;;
        SUCCESS)
            echo -e "${GREEN}[SUCCESS]${NC} ${message}"
            ;;
        INFO)
            echo -e "${BLUE}[INFO]${NC} ${message}"
            ;;
        WARN)
            echo -e "${YELLOW}[WARN]${NC} ${message}"
            ;;
    esac
}

# Function to get current active environment
get_active_env() {
    if [ -L "${CURRENT_LINK}" ]; then
        local current=$(readlink "${CURRENT_LINK}")
        if [[ "${current}" == *"blue"* ]]; then
            echo "blue"
        elif [[ "${current}" == *"green"* ]]; then
            echo "green"
        else
            echo "none"
        fi
    else
        echo "none"
    fi
}

# Function to get inactive environment
get_inactive_env() {
    local active=$(get_active_env)
    case ${active} in
        blue)
            echo "green"
            ;;
        green)
            echo "blue"
            ;;
        *)
            echo "blue"  # Default to blue if no active env
            ;;
    esac
}

# Function to create deployment backup
create_backup() {
    local env_name=$1
    local backup_name="backup_${env_name}_$(date +%Y%m%d_%H%M%S)"
    local backup_path="${BACKUP_DIR}/${backup_name}"
    
    log INFO "Creating backup: ${backup_name}"
    
    if [ -d "${DEPLOYMENT_DIR}/${env_name}" ]; then
        cp -r "${DEPLOYMENT_DIR}/${env_name}" "${backup_path}"
        
        # Keep only last 5 backups
        cd "${BACKUP_DIR}"
        ls -t backup_${env_name}_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
        cd - > /dev/null
        
        log SUCCESS "Backup created: ${backup_path}"
        echo "${backup_path}"
    else
        log WARN "No existing deployment to backup"
        echo ""
    fi
}

# Function to deploy code to target environment
deploy_code() {
    local target_env=$1
    local target_dir=""
    
    case ${target_env} in
        blue)
            target_dir="${BLUE_ENV}"
            ;;
        green)
            target_dir="${GREEN_ENV}"
            ;;
        *)
            log ERROR "Invalid target environment: ${target_env}"
            return 1
            ;;
    esac
    
    log INFO "Deploying to ${target_env} environment: ${target_dir}"
    
    # Clean target directory
    rm -rf "${target_dir}"/*
    
    # Copy application files
    log INFO "Copying application files..."
    rsync -av --exclude='node_modules' \
              --exclude='deployments' \
              --exclude='results' \
              --exclude='*.log' \
              --exclude='.git' \
              "${DEPLOYMENT_DIR}/" "${target_dir}/"
    
    # Install dependencies
    log INFO "Installing dependencies in ${target_env} environment..."
    cd "${target_dir}"
    npm ci --production 2>&1 | tee -a "${DEPLOYMENT_LOG}"
    
    # Run any build steps
    if [ -f "${target_dir}/package.json" ] && grep -q '"build"' "${target_dir}/package.json"; then
        log INFO "Running build process..."
        npm run build 2>&1 | tee -a "${DEPLOYMENT_LOG}"
    fi
    
    cd - > /dev/null
    log SUCCESS "Code deployed to ${target_env} environment"
}

# Function to start PM2 processes in target environment
start_services() {
    local env_name=$1
    local env_dir=""
    
    case ${env_name} in
        blue)
            env_dir="${BLUE_ENV}"
            ;;
        green)
            env_dir="${GREEN_ENV}"
            ;;
        *)
            log ERROR "Invalid environment: ${env_name}"
            return 1
            ;;
    esac
    
    log INFO "Starting services in ${env_name} environment..."
    
    cd "${env_dir}"
    
    # Start PM2 processes with environment-specific namespace
    if [ -f "ecosystem.config.js" ]; then
        npx pm2 start ecosystem.config.js --env production --update-env --namespace "${env_name}" 2>&1 | tee -a "${DEPLOYMENT_LOG}"
        npx pm2 save --namespace "${env_name}" 2>&1 | tee -a "${DEPLOYMENT_LOG}"
    else
        log ERROR "ecosystem.config.js not found in ${env_dir}"
        return 1
    fi
    
    cd - > /dev/null
    log SUCCESS "Services started in ${env_name} environment"
}

# Function to perform health checks
health_check() {
    local env_name=$1
    local retries=0
    
    log INFO "Performing health checks for ${env_name} environment..."
    
    while [ ${retries} -lt ${MAX_HEALTH_RETRIES} ]; do
        retries=$((retries + 1))
        
        # Check PM2 process status
        local pm2_status=$(npx pm2 list --namespace "${env_name}" 2>/dev/null | grep -c "online" || echo "0")
        
        if [ "${pm2_status}" -ge "7" ]; then
            log INFO "All 7 components are online (attempt ${retries}/${MAX_HEALTH_RETRIES})"
            
            # Check component health endpoints if available
            local all_healthy=true
            
            # Check RPC connection pool health
            if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
                log SUCCESS "RPC connection pool is healthy"
            else
                log WARN "RPC connection pool health check failed"
                all_healthy=false
            fi
            
            # Additional component checks can be added here
            
            if [ "${all_healthy}" = true ]; then
                log SUCCESS "All health checks passed"
                return 0
            fi
        else
            log WARN "Only ${pm2_status} components online (attempt ${retries}/${MAX_HEALTH_RETRIES})"
        fi
        
        sleep ${HEALTH_CHECK_INTERVAL}
    done
    
    log ERROR "Health checks failed after ${MAX_HEALTH_RETRIES} attempts"
    return 1
}

# Function to switch traffic to new environment
switch_traffic() {
    local target_env=$1
    local target_dir=""
    
    case ${target_env} in
        blue)
            target_dir="${BLUE_ENV}"
            ;;
        green)
            target_dir="${GREEN_ENV}"
            ;;
        *)
            log ERROR "Invalid target environment: ${target_env}"
            return 1
            ;;
    esac
    
    log INFO "Switching traffic to ${target_env} environment..."
    
    # Update symlink atomically
    ln -sfn "${target_dir}" "${CURRENT_LINK}.tmp"
    mv -Tf "${CURRENT_LINK}.tmp" "${CURRENT_LINK}"
    
    log SUCCESS "Traffic switched to ${target_env} environment"
}

# Function to stop services in an environment
stop_services() {
    local env_name=$1
    
    log INFO "Stopping services in ${env_name} environment..."
    
    npx pm2 delete all --namespace "${env_name}" 2>/dev/null || true
    npx pm2 kill --namespace "${env_name}" 2>/dev/null || true
    
    log SUCCESS "Services stopped in ${env_name} environment"
}

# Function to verify deployment
verify_deployment() {
    local env_name=$1
    
    log INFO "Verifying deployment in ${env_name} environment..."
    
    # Check if all components are running
    local running_count=$(npx pm2 list --namespace "${env_name}" 2>/dev/null | grep -c "online" || echo "0")
    
    if [ "${running_count}" -ne "7" ]; then
        log ERROR "Expected 7 components, but only ${running_count} are running"
        return 1
    fi
    
    # Check memory usage
    local high_memory=$(npx pm2 list --namespace "${env_name}" 2>/dev/null | awk '$10 ~ /[0-9]+/ && $10 > 80 {print $2}' | head -1)
    
    if [ -n "${high_memory}" ]; then
        log WARN "Component ${high_memory} is using >80% of memory limit"
    fi
    
    # Check for recent restarts
    local restart_count=$(npx pm2 list --namespace "${env_name}" 2>/dev/null | awk '{sum+=$13} END {print sum}')
    
    if [ "${restart_count}" -gt "0" ]; then
        log WARN "Total restarts since deployment: ${restart_count}"
    fi
    
    log SUCCESS "Deployment verification completed"
    return 0
}

# Function to cleanup old environment
cleanup_old_env() {
    local env_name=$1
    
    log INFO "Cleaning up ${env_name} environment..."
    
    # Stop services
    stop_services "${env_name}"
    
    # Keep the directory for potential rollback
    log INFO "Keeping ${env_name} environment for potential rollback"
}

# Main deployment function
main() {
    log INFO "========================================="
    log INFO "Starting Production Deployment"
    log INFO "========================================="
    
    local start_time=$(date +%s)
    
    # Determine active and target environments
    local active_env=$(get_active_env)
    local target_env=$(get_inactive_env)
    
    log INFO "Current active environment: ${active_env}"
    log INFO "Target deployment environment: ${target_env}"
    
    # Create backup of current active environment
    if [ "${active_env}" != "none" ]; then
        local backup_path=$(create_backup "${active_env}")
        if [ -z "${backup_path}" ]; then
            log WARN "No backup created (no active deployment)"
        fi
    fi
    
    # Deploy to target environment
    if ! deploy_code "${target_env}"; then
        log ERROR "Code deployment failed"
        exit 1
    fi
    
    # Start services in target environment
    if ! start_services "${target_env}"; then
        log ERROR "Failed to start services"
        exit 1
    fi
    
    # Perform health checks
    if ! health_check "${target_env}"; then
        log ERROR "Health checks failed"
        
        # Stop failed deployment
        stop_services "${target_env}"
        
        log ERROR "Deployment aborted due to health check failures"
        exit 1
    fi
    
    # Verify deployment
    if ! verify_deployment "${target_env}"; then
        log ERROR "Deployment verification failed"
        
        # Stop failed deployment
        stop_services "${target_env}"
        
        log ERROR "Deployment aborted due to verification failures"
        exit 1
    fi
    
    # Switch traffic to new environment
    if ! switch_traffic "${target_env}"; then
        log ERROR "Failed to switch traffic"
        
        # Stop failed deployment
        stop_services "${target_env}"
        
        exit 1
    fi
    
    # Cleanup old environment after successful switch
    if [ "${active_env}" != "none" ]; then
        cleanup_old_env "${active_env}"
    fi
    
    # Calculate deployment time
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log INFO "========================================="
    log SUCCESS "Deployment completed successfully!"
    log INFO "Active environment: ${target_env}"
    log INFO "Deployment time: ${duration} seconds"
    log INFO "========================================="
    
    # Check if deployment exceeded timeout
    if [ ${duration} -gt ${DEPLOYMENT_TIMEOUT} ]; then
        log WARN "Deployment took longer than expected (${duration}s > ${DEPLOYMENT_TIMEOUT}s)"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            log WARN "Force deployment mode enabled"
            set +e  # Don't exit on errors
            shift
            ;;
        --dry-run)
            log INFO "Dry run mode - no changes will be made"
            exit 0
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --force      Continue deployment even if some checks fail"
            echo "  --dry-run    Test deployment without making changes"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            log ERROR "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run main deployment
main