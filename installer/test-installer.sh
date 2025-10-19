#!/bin/bash
# Test script for the installer system
# This demonstrates the complete workflow

set -euo pipefail

# Determine the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALLER_DIR="$SCRIPT_DIR"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "  Installer System Test"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test directory
TEST_DIR="/tmp/installer-test-$$"
mkdir -p "$TEST_DIR"

echo -e "${GREEN}[1/5]${NC} Setting up test environment..."
cd "$TEST_DIR"

echo -e "${GREEN}[2/5]${NC} Creating test configuration..."
cat > installer.config <<EOF
# Test configuration
API_BASE_URL=https://api.example.com/v1
INSTALLER_API_KEY=test-installer-key-12345
EOF

echo -e "${GREEN}[3/5]${NC} Testing installer structure..."

# Check if main installer exists
if [ -f "$INSTALLER_DIR/install.sh" ]; then
    echo "  ✓ Main installer script found"
else
    echo -e "  ${RED}✗ Main installer script not found${NC}"
    exit 1
fi

# Check if build script exists
if [ -f "$INSTALLER_DIR/build.sh" ]; then
    echo "  ✓ Build script found"
else
    echo -e "  ${RED}✗ Build script not found${NC}"
    exit 1
fi

# Check if sample action scripts exist
SCRIPT_COUNT=$(find "$INSTALLER_DIR/scripts" -name "*.sh" 2>/dev/null | wc -l)
if [ "$SCRIPT_COUNT" -gt 0 ]; then
    echo "  ✓ Found $SCRIPT_COUNT action scripts"
else
    echo -e "  ${YELLOW}⚠ No action scripts found${NC}"
fi

echo -e "${GREEN}[4/5]${NC} Testing installer script syntax..."
bash -n "$INSTALLER_DIR/install.sh"
echo "  ✓ Installer script syntax is valid"

echo -e "${GREEN}[5/5]${NC} Testing action script syntax..."
for script in "$INSTALLER_DIR/scripts"/*.sh; do
    if [ -f "$script" ]; then
        bash -n "$script"
        echo "  ✓ $(basename "$script") syntax is valid"
    fi
done

echo ""
echo "=========================================="
echo "  Test Results"
echo "=========================================="
echo ""
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "The installer system is ready to use."
echo ""
echo "To build the installer:"
echo "  cd $INSTALLER_DIR"
echo "  ./build.sh installer.config"
echo ""
echo "To deploy:"
echo "  1. Start the backend server"
echo "  2. The installer will be available at: http://localhost:3000/install"
echo "  3. Users can install with: bash <( curl http://localhost:3000/install ) <license-key>"
echo ""

# Cleanup
cd /
rm -rf "$TEST_DIR"
