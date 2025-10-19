#!/bin/bash
set -euo pipefail

##############################################################################
# IP-based License Authentication Installer
# This script validates a license key before executing the actual installation
##############################################################################

# Configuration
API_BASE_URL="${API_BASE_URL:-https://api.example.com/v1}"
INSTALLER_API_KEY="${INSTALLER_API_KEY:-changeme-installer-key-here}"
LICENSE_KEY="${LICENSE_KEY:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get license key from argument or prompt
get_license_key() {
    if [ -n "${1:-}" ]; then
        LICENSE_KEY="$1"
    elif [ -z "$LICENSE_KEY" ]; then
        read -p "Enter your license key: " LICENSE_KEY
    fi
    
    if [ -z "$LICENSE_KEY" ]; then
        log_error "License key is required"
        exit 1
    fi
}

# Detect public IP address
get_public_ip() {
    local ip=""
    
    # Try multiple services
    for service in "ifconfig.me" "ipinfo.io/ip" "api.ipify.org"; do
        ip=$(curl -s --max-time 5 "https://${service}" 2>/dev/null || true)
        if [ -n "$ip" ]; then
            echo "$ip"
            return 0
        fi
    done
    
    log_error "Failed to detect public IP address"
    exit 1
}

# Get machine identifier
get_machine_id() {
    if [ -f /etc/machine-id ]; then
        cat /etc/machine-id
    elif [ -f /var/lib/dbus/machine-id ]; then
        cat /var/lib/dbus/machine-id
    else
        hostname
    fi
}

# Validate license with API
validate_license() {
    local license_key="$1"
    local public_ip="$2"
    local machine_id="$3"
    
    log_info "Validating license..."
    log_info "License Key: ${license_key:0:8}..."
    log_info "Public IP: $public_ip"
    log_info "Machine ID: ${machine_id:0:16}..."
    
    # Make API request
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "X-API-KEY: $INSTALLER_API_KEY" \
        -d "{\"license_key\":\"$license_key\",\"public_ip\":\"$public_ip\",\"machine_id\":\"$machine_id\"}" \
        "$API_BASE_URL/auth/check" 2>&1 || true)
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        local allowed=$(echo "$body" | grep -o '"allowed"[[:space:]]*:[[:space:]]*true' || true)
        if [ -n "$allowed" ]; then
            log_info "License validation successful!"
            return 0
        fi
    fi
    
    # Parse error message
    local message=$(echo "$body" | grep -o '"message"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4 || echo "Unknown error")
    log_error "License validation failed: $message"
    log_error "HTTP Status: $http_code"
    return 1
}

##############################################################################
# Main Installation Flow
##############################################################################

main() {
    echo "=========================================="
    echo "  License Authentication Installer"
    echo "=========================================="
    echo ""
    
    # Get license key
    get_license_key "${1:-}"
    
    # Get public IP
    log_info "Detecting public IP address..."
    PUBLIC_IP=$(get_public_ip)
    
    # Get machine ID
    MACHINE_ID=$(get_machine_id)
    
    # Validate license
    if ! validate_license "$LICENSE_KEY" "$PUBLIC_IP" "$MACHINE_ID"; then
        log_error "Installation aborted due to license validation failure"
        exit 1
    fi
    
    echo ""
    log_info "License validated successfully. Proceeding with installation..."
    echo ""
    
    ### BEGIN REAL INSTALL ###
    # This is where the actual installation commands would go
    # Replace this section with your real installation logic
    
    log_info "Installing application..."
    sleep 1
    
    log_info "Configuring system..."
    sleep 1
    
    log_info "Setting up services..."
    sleep 1
    
    ### END REAL INSTALL ###
    
    echo ""
    log_info "Installation completed successfully!"
    echo ""
}

# Run main function
main "$@"
