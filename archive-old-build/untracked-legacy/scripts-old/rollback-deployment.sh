#!/bin/bash

#################################################
# Production Rollback Script - Fast Recovery
# Reverts to previous deployment in <30 seconds
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
ROLLBACK_LOG="${DEPLOYMENT_DIR}/deployments/rollback.log"
ROLLBACK_TIMEOUT=30  # 30 seconds maximum
MAX_HEALTH_RETRIES=10  # Fewer retries for fast rollback
HEALTH_CHECK_INTERVAL=1

# Create necessary directories
mkdir -p "$(dirname ${ROLLBACK_LOG})"

# Logging function
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${ROLLBACK_LOG}"
    
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
        URGENT)
            echo -e "${RED}[URGENT]${NC} ${message}"
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

# Function to get previous environment (opposite of current)
get_previous_env() {
    local active=$(get_active_env)
    case ${active} in
        blue)
            echo "green"
            ;;
        green)
            echo "blue"
            ;;
        *)
            log ERROR "No active environment found"
            return 1
            ;;
    esac
}

# Function to quickly check if environment is viable
quick_health_check() {
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
            return 1
            ;;
    esac
    
    # Check if directory exists and has required files
    if [ ! -d "${env_dir}" ]; then
        log ERROR "${env_name} environment directory does not exist"
        return 1
    fi
    
    if [ ! -f "${env_dir}/package.json" ]; then
        log ERROR "${env_name} environment missing package.json"
        return 1
    fi
    
    if [ ! -f "${env_dir}/ecosystem.config.js" ]; then
        log ERROR "${env_name} environment missing ecosystem.config.js"
        return 1
    fi
    
    return 0
}

# Function to switch traffic immediately
emergency_switch() {
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
    
    log URGENT "Emergency traffic switch to ${target_env} environment..."
    
    # Update symlink atomically
    ln -sfn "${target_dir}" "${CURRENT_LINK}.tmp"
    mv -Tf "${CURRENT_LINK}.tmp" "${CURRENT_LINK}"
    
    log SUCCESS "Traffic switched to ${target_env} environment"
}

# Function to start services quickly
quick_start_services() {
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
            return 1
            ;;
    esac
    
    log INFO "Starting services in ${env_name} environment..."
    
    cd "${env_dir}"
    
    # Start PM2 processes quickly without saves
    npx pm2 start ecosystem.config.js --env production --namespace "${env_name}" 2>&1 | tee -a "${ROLLBACK_LOG}"
    
    cd - > /dev/null
}

# Function to verify rollback success
verify_rollback() {
    local env_name=$1
    local retries=0
    
    while [ ${retries} -lt ${MAX_HEALTH_RETRIES} ]; do
        retries=$((retries + 1))
        
        # Quick check for running processes
        local pm2_status=$(npx pm2 list --namespace "${env_name}" 2>/dev/null | grep -c "online" || echo "0")
        
        if [ "${pm2_status}" -ge "7" ]; then
            log SUCCESS "All 7 components are online"
            return 0
        else
            log WARN "Only ${pm2_status} components online (attempt ${retries}/${MAX_HEALTH_RETRIES})"
        fi
        
        sleep ${HEALTH_CHECK_INTERVAL}
    done
    
    log ERROR "Rollback verification failed"
    return 1
}

# Function to stop services in failed environment
stop_failed_env() {
    local env_name=$1
    
    log INFO "Stopping services in failed ${env_name} environment..."
    
    npx pm2 delete all --namespace "${env_name}" 2>/dev/null || true
}

# Function to restore from backup
restore_from_backup() {
    local env_name=$1
    local backup_pattern="backup_${env_name}_*"
    
    log INFO "Looking for backups of ${env_name} environment..."
    
    # Find most recent backup
    local latest_backup=$(ls -t "${BACKUP_DIR}"/${backup_pattern} 2>/dev/null | head -1)
    
    if [ -z "${latest_backup}" ]; then
        log ERROR "No backup found for ${env_name} environment"
        return 1
    fi
    
    log INFO "Found backup: ${latest_backup}"
    
    # Get target directory
    local target_dir=""
    case ${env_name} in
        blue)
            target_dir="${BLUE_ENV}"
            ;;
        green)
            target_dir="${GREEN_ENV}"
            ;;
        *)
            return 1
            ;;
    esac
    
    # Restore backup
    log INFO "Restoring from backup..."
    rm -rf "${target_dir}"
    cp -r "${latest_backup}" "${target_dir}"
    
    log SUCCESS "Backup restored to ${env_name} environment"
    return 0
}

# Main rollback function - FAST PATH
fast_rollback() {
    local start_time=$(date +%s)
    
    log URGENT "========================================="
    log URGENT "EMERGENCY ROLLBACK INITIATED"
    log URGENT "========================================="
    
    # Get current and previous environments
    local current_env=$(get_active_env)
    local previous_env=$(get_previous_env)
    
    if [ $? -ne 0 ]; then
        log ERROR "Cannot determine previous environment"
        return 1
    fi
    
    log INFO "Current environment: ${current_env}"
    log INFO "Rolling back to: ${previous_env}"
    
    # Check if previous environment is viable
    if quick_health_check "${previous_env}"; then
        log SUCCESS "Previous environment ${previous_env} is viable"
        
        # Switch traffic immediately
        emergency_switch "${previous_env}"
        
        # Start services if not running
        local pm2_status=$(npx pm2 list --namespace "${previous_env}" 2>/dev/null | grep -c "online" || echo "0")
        if [ "${pm2_status}" -lt "7" ]; then
            quick_start_services "${previous_env}"
        fi
        
        # Verify rollback
        if verify_rollback "${previous_env}"; then
            # Stop failed environment
            stop_failed_env "${current_env}"
            
            local end_time=$(date +%s)
            local duration=$((end_time - start_time))
            
            log SUCCESS "========================================="
            log SUCCESS "ROLLBACK COMPLETED SUCCESSFULLY"
            log SUCCESS "Active environment: ${previous_env}"
            log SUCCESS "Rollback time: ${duration} seconds"
            log SUCCESS "========================================="
            
            if [ ${duration} -gt ${ROLLBACK_TIMEOUT} ]; then
                log WARN "Rollback took longer than 30 seconds (${duration}s)"
            fi
            
            return 0
        else
            log ERROR "Rollback verification failed"
            return 1
        fi
    else
        log ERROR "Previous environment is not viable"
        return 1
    fi
}

# Backup restoration rollback - SLOWER PATH
backup_rollback() {
    local start_time=$(date +%s)
    local target_env=$1
    
    log WARN "========================================="
    log WARN "BACKUP RESTORATION ROLLBACK"
    log WARN "========================================="
    
    if [ -z "${target_env}" ]; then
        # Try to use opposite of current
        local current_env=$(get_active_env)
        case ${current_env} in
            blue)
                target_env="green"
                ;;
            green)
                target_env="blue"
                ;;
            *)
                target_env="blue"
                ;;
        esac
    fi
    
    log INFO "Restoring ${target_env} environment from backup..."
    
    # Stop services in target environment
    stop_failed_env "${target_env}"
    
    # Restore from backup
    if ! restore_from_backup "${target_env}"; then
        log ERROR "Failed to restore from backup"
        return 1
    fi
    
    # Start services
    quick_start_services "${target_env}"
    
    # Verify services are running
    if ! verify_rollback "${target_env}"; then
        log ERROR "Failed to start restored services"
        return 1
    fi
    
    # Switch traffic
    emergency_switch "${target_env}"
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log SUCCESS "========================================="
    log SUCCESS "BACKUP RESTORATION COMPLETED"
    log SUCCESS "Active environment: ${target_env}"
    log SUCCESS "Restoration time: ${duration} seconds"
    log SUCCESS "========================================="
    
    return 0
}

# Status check function
check_status() {
    log INFO "========================================="
    log INFO "Deployment Status Check"
    log INFO "========================================="
    
    local active_env=$(get_active_env)
    log INFO "Active environment: ${active_env}"
    
    # Check blue environment
    log INFO "Blue environment:"
    if [ -d "${BLUE_ENV}" ]; then
        local blue_procs=$(npx pm2 list --namespace "blue" 2>/dev/null | grep -c "online" || echo "0")
        log INFO "  - Directory exists"
        log INFO "  - Running processes: ${blue_procs}/7"
    else
        log INFO "  - Not deployed"
    fi
    
    # Check green environment
    log INFO "Green environment:"
    if [ -d "${GREEN_ENV}" ]; then
        local green_procs=$(npx pm2 list --namespace "green" 2>/dev/null | grep -c "online" || echo "0")
        log INFO "  - Directory exists"
        log INFO "  - Running processes: ${green_procs}/7"
    else
        log INFO "  - Not deployed"
    fi
    
    # Check backups
    log INFO "Available backups:"
    ls -lt "${BACKUP_DIR}"/backup_* 2>/dev/null | head -5 | while read line; do
        echo "  - ${line}"
    done
    
    log INFO "========================================="
}

# Main execution
main() {
    case ${1:-fast} in
        fast)
            # Default - try fast rollback first
            if ! fast_rollback; then
                log WARN "Fast rollback failed, attempting backup restoration..."
                backup_rollback
            fi
            ;;
        backup)
            # Force backup restoration
            backup_rollback "${2}"
            ;;
        status)
            # Check current status
            check_status
            ;;
        help|--help)
            echo "Usage: $0 [MODE] [OPTIONS]"
            echo ""
            echo "Modes:"
            echo "  fast     Quick rollback to previous environment (default)"
            echo "  backup   Restore from backup [environment]"
            echo "  status   Check deployment status"
            echo "  help     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0              # Fast rollback to previous environment"
            echo "  $0 fast         # Explicit fast rollback"
            echo "  $0 backup       # Restore from latest backup"
            echo "  $0 backup blue  # Restore blue environment from backup"
            echo "  $0 status       # Check current deployment status"
            exit 0
            ;;
        *)
            log ERROR "Unknown mode: $1"
            echo "Use '$0 help' for usage information"
            exit 1
            ;;
    esac
}

# Check for timeout wrapper
if [ -n "${ROLLBACK_ENFORCE_TIMEOUT}" ]; then
    # Use timeout command if available
    if command -v timeout &> /dev/null; then
        timeout ${ROLLBACK_TIMEOUT} "$0" "$@"
        exit_code=$?
        if [ ${exit_code} -eq 124 ]; then
            log ERROR "Rollback exceeded ${ROLLBACK_TIMEOUT} second timeout"
            exit 1
        fi
        exit ${exit_code}
    fi
fi

# Run main function
main "$@"