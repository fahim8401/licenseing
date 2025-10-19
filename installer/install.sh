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

# Directory containing action scripts
SCRIPTS_DIR="${SCRIPTS_DIR:-/opt/installer/scripts}"

# List available action scripts
list_actions() {
    local scripts_dir="$1"
    
    if [ ! -d "$scripts_dir" ]; then
        log_warn "Scripts directory not found: $scripts_dir"
        return 1
    fi
    
    local scripts=()
    while IFS= read -r -d '' script; do
        scripts+=("$script")
    done < <(find "$scripts_dir" -maxdepth 1 -type f -name "*.sh" -print0 | sort -z)
    
    if [ ${#scripts[@]} -eq 0 ]; then
        log_warn "No action scripts found in: $scripts_dir"
        return 1
    fi
    
    echo "${scripts[@]}"
}

# Show interactive menu of actions
show_menu() {
    local scripts_dir="$1"
    
    echo ""
    echo "=========================================="
    echo "  Available Actions"
    echo "=========================================="
    echo ""
    
    # Get list of scripts
    local scripts
    scripts=$(list_actions "$scripts_dir")
    
    if [ $? -ne 0 ] || [ -z "$scripts" ]; then
        log_error "No action scripts available"
        return 1
    fi
    
    # Convert to array
    local scripts_array=($scripts)
    
    # Display menu
    local i=1
    for script in "${scripts_array[@]}"; do
        local name=$(basename "$script" .sh)
        local desc=""
        
        # Try to extract description from script comments
        if grep -q "^# Description:" "$script"; then
            desc=$(grep "^# Description:" "$script" | head -1 | sed 's/^# Description: //')
        fi
        
        printf "%2d) %-30s %s\n" "$i" "$name" "$desc"
        ((i++))
    done
    
    echo ""
    printf "%2d) Exit\n" "0"
    echo ""
}

# Execute selected action
execute_action() {
    local script_path="$1"
    
    if [ ! -f "$script_path" ]; then
        log_error "Script not found: $script_path"
        return 1
    fi
    
    if [ ! -x "$script_path" ]; then
        chmod +x "$script_path"
    fi
    
    log_info "Executing: $(basename "$script_path")"
    echo ""
    
    # Execute the script with environment variables
    export LICENSE_KEY
    export PUBLIC_IP
    export MACHINE_ID
    
    bash "$script_path"
    local exit_code=$?
    
    echo ""
    if [ $exit_code -eq 0 ]; then
        log_info "Action completed successfully"
    else
        log_error "Action failed with exit code: $exit_code"
    fi
    
    return $exit_code
}

# Interactive action selection
interactive_menu() {
    local scripts_dir="$1"
    
    while true; do
        show_menu "$scripts_dir"
        
        # Get list of scripts
        local scripts
        scripts=$(list_actions "$scripts_dir")
        local scripts_array=($scripts)
        local max_option=${#scripts_array[@]}
        
        # Prompt for selection
        read -p "Select an action (0-$max_option): " selection
        
        # Validate input
        if ! [[ "$selection" =~ ^[0-9]+$ ]]; then
            log_error "Invalid input. Please enter a number."
            continue
        fi
        
        # Handle exit
        if [ "$selection" -eq 0 ]; then
            log_info "Exiting installer"
            break
        fi
        
        # Validate range
        if [ "$selection" -lt 1 ] || [ "$selection" -gt "$max_option" ]; then
            log_error "Invalid selection. Please choose between 0 and $max_option."
            continue
        fi
        
        # Execute selected script
        local selected_script="${scripts_array[$((selection-1))]}"
        execute_action "$selected_script"
        
        echo ""
        read -p "Press Enter to continue..." dummy
    done
}

# Run default installation
run_default_install() {
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
        log_error "Your IP ($PUBLIC_IP) is not authorized for this license"
        exit 1
    fi
    
    echo ""
    log_info "✓ License validated successfully!"
    log_info "✓ IP address: $PUBLIC_IP"
    echo ""
    
    # Check for action scripts
    if [ -d "$SCRIPTS_DIR" ] && [ "$(ls -A "$SCRIPTS_DIR"/*.sh 2>/dev/null)" ]; then
        # Show interactive menu
        interactive_menu "$SCRIPTS_DIR"
    else
        # Run default installation
        log_info "Running default installation..."
        echo ""
        run_default_install
        echo ""
        log_info "Installation completed successfully!"
    fi
    
    echo ""
}

# Run main function
main "$@"
