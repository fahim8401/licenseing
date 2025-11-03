#!/bin/bash
set -euo pipefail

##############################################################################
# Installer Build Script
# This script configures and builds the installer with embedded API settings
##############################################################################

# Configuration file path
CONFIG_FILE="${1:-installer.config}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "Configuration file not found: $CONFIG_FILE"
    log_info "Creating example configuration file..."
    
    cat > "$CONFIG_FILE" <<'EOF'
# Installer Configuration
# Edit these values before building the installer

# API Configuration
API_BASE_URL=https://api.example.com/v1
INSTALLER_API_KEY=changeme-installer-key-here

# Optional: Encryption key for additional security
# ENCRYPTION_KEY=your-encryption-key-here
EOF
    
    log_info "Configuration file created: $CONFIG_FILE"
    log_warn "Please edit the configuration file and run the build script again"
    exit 0
fi

echo "=========================================="
echo "  Installer Build System"
echo "=========================================="
echo ""

# Load configuration
log_step "Loading configuration from: $CONFIG_FILE"
source "$CONFIG_FILE"

# Validate configuration
if [ -z "${API_BASE_URL:-}" ]; then
    log_error "API_BASE_URL is not set in configuration file"
    exit 1
fi

if [ -z "${INSTALLER_API_KEY:-}" ]; then
    log_error "INSTALLER_API_KEY is not set in configuration file"
    exit 1
fi

log_info "API Base URL: $API_BASE_URL"
log_info "API Key: ${INSTALLER_API_KEY:0:10}..."

# Create build directory
BUILD_DIR="./build"
mkdir -p "$BUILD_DIR"

# Build Bash Installer
log_step "Building Bash installer..."

# Create configured installer script
sed -e "s|API_BASE_URL=\"\${API_BASE_URL:-https://api.example.com/v1}\"|API_BASE_URL=\"${API_BASE_URL}\"|g" \
    -e "s|INSTALLER_API_KEY=\"\${INSTALLER_API_KEY:-changeme-installer-key-here}\"|INSTALLER_API_KEY=\"${INSTALLER_API_KEY}\"|g" \
    install.sh > "$BUILD_DIR/install.sh"

chmod +x "$BUILD_DIR/install.sh"
log_info "Bash installer built: $BUILD_DIR/install.sh"

# Build Go Installer
log_step "Building Go installer..."

if command -v go &> /dev/null; then
    cd go
    
    # Build for Linux AMD64
    log_info "Building for Linux AMD64..."
    GOOS=linux GOARCH=amd64 go build \
        -ldflags "-X main.apiBaseURL=$API_BASE_URL -X main.installerAPIKey=$INSTALLER_API_KEY" \
        -o "../$BUILD_DIR/installer-linux-amd64" main.go
    
    # Build for Linux ARM64
    log_info "Building for Linux ARM64..."
    GOOS=linux GOARCH=arm64 go build \
        -ldflags "-X main.apiBaseURL=$API_BASE_URL -X main.installerAPIKey=$INSTALLER_API_KEY" \
        -o "../$BUILD_DIR/installer-linux-arm64" main.go
    
    # Build for current platform
    log_info "Building for current platform..."
    go build \
        -ldflags "-X main.apiBaseURL=$API_BASE_URL -X main.installerAPIKey=$INSTALLER_API_KEY" \
        -o "../$BUILD_DIR/installer" main.go
    
    cd ..
    
    log_info "Go installers built successfully"
else
    log_warn "Go is not installed. Skipping Go installer build."
fi

# Create deployment package
log_step "Creating deployment package..."

# Create tarball
tar -czf "$BUILD_DIR/installer-bundle.tar.gz" -C "$BUILD_DIR" .

log_info "Deployment package created: $BUILD_DIR/installer-bundle.tar.gz"

echo ""
echo "=========================================="
echo "  Build Complete!"
echo "=========================================="
echo ""
log_info "Built files are in: $BUILD_DIR/"
echo ""
log_info "To deploy:"
echo "  1. Copy $BUILD_DIR/install.sh to your web server"
echo "  2. Make it accessible via: https://api.example.com/install"
echo "  3. Users can install with: bash <( curl https://api.example.com/install ) <license-key>"
echo ""
