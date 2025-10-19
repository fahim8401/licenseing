# License Authentication Installer

This directory contains installer scripts that validate licenses before executing installations.

## Overview

The installer system has been redesigned to support:
1. **Pre-build configuration** - Set API URLs and keys before building
2. **Remote installation** - Execute via `bash <( curl URL )`
3. **Interactive menu** - After IP validation, users can select from available actions
4. **Action scripts** - Modular bash scripts for different installation tasks

## Quick Start

### 1. Configure the Installer

Create or edit `installer.config`:

```bash
cd installer
cp installer.config.example installer.config
nano installer.config
```

Set your configuration:
```bash
# Installer Configuration
API_BASE_URL=https://api.example.com/v1
INSTALLER_API_KEY=your-installer-api-key
```

### 2. Build the Installer

```bash
./build.sh installer.config
```

This creates:
- `build/install.sh` - Configured bash installer
- `build/installer-linux-amd64` - Go binary for Linux AMD64
- `build/installer-linux-arm64` - Go binary for Linux ARM64
- `build/installer` - Go binary for current platform
- `build/installer-bundle.tar.gz` - Complete package

### 3. Deploy the Installer

The installer can be served via the backend API:

**Option A: Copy to backend**
```bash
cp build/install.sh ../backend/installer/install.sh
```

**Option B: Use the API endpoint directly**

The backend automatically serves the installer from `/install` endpoint.

### 4. User Installation

Users can now install with a single command:

```bash
bash <( curl https://api.example.com/install ) <license-key>
```

Or interactively:
```bash
bash <( curl https://api.example.com/install )
# Will prompt for license key
```

## Components

### 1. Build System (`build.sh`)

Configures and builds the installer with embedded API settings.

**Usage:**
```bash
./build.sh [config-file]
```

**Features:**
- Embeds API URL and key into installers
- Builds for multiple platforms (Go)
- Creates deployment packages
- Validates configuration

### 2. Main Installer (`install.sh`)

The main installer script that:
1. Detects public IP address
2. Validates license via API
3. Shows interactive menu of available actions
4. Executes selected action scripts

**Environment Variables:**
- `API_BASE_URL` - Backend API base URL (embedded during build)
- `INSTALLER_API_KEY` - API key for authentication (embedded during build)
- `LICENSE_KEY` - Customer license key (provided at runtime)
- `SCRIPTS_DIR` - Directory containing action scripts (default: `/opt/installer/scripts`)

**Usage:**
```bash
# With license key argument
./install.sh "your-license-key"

# Interactive (will prompt)
./install.sh

# With environment variable
export LICENSE_KEY="your-license-key"
./install.sh
```

### 3. Action Scripts (`scripts/`)

Modular bash scripts that perform specific installation tasks.

**Available Scripts:**
- `install-app.sh` - Install and configure the main application
- `configure-system.sh` - Configure system settings and environment
- `setup-monitoring.sh` - Setup and start monitoring services
- `update-app.sh` - Update existing installation to latest version

**Creating New Actions:**

Create a new script in `scripts/` directory:

```bash
#!/bin/bash
# Description: Your action description here

set -euo pipefail

echo "Performing action..."

# Available environment variables:
# - LICENSE_KEY: The validated license key
# - PUBLIC_IP: The detected public IP
# - MACHINE_ID: The machine identifier

# Your action logic here
echo "License: $LICENSE_KEY"
echo "IP: $PUBLIC_IP"

echo "✓ Action completed!"
```

Make it executable:
```bash
chmod +x scripts/your-action.sh
```

### 4. Go Wrapper (`go/main.go`)

A compiled binary installer that provides better security through:
- Compiled binary (harder to reverse engineer)
- Embedded API credentials
- Platform-specific builds

**Build:**
```bash
cd go
go build -ldflags "\
  -X main.apiBaseURL=https://api.example.com/v1 \
  -X main.installerAPIKey=your-key" \
  -o ../installer main.go
```

**Usage:**
```bash
./installer -license "your-license-key"
```

## API Endpoints

The backend serves the installer via these endpoints:

### GET /install
Public endpoint for bash curl execution.

**Example:**
```bash
bash <( curl https://api.example.com/install )
```

### GET /v1/installer/download
Download the installer script.

**Example:**
```bash
curl -O https://api.example.com/v1/installer/download
chmod +x install.sh
./install.sh <license-key>
```

## Deployment Scenarios

### Scenario 1: Direct Remote Execution

Most convenient for users:

```bash
# One-line installation
bash <( curl https://api.example.com/install ) abc-123-def-456
```

### Scenario 2: Download and Execute

For environments where direct execution is not allowed:

```bash
# Download
curl -o install.sh https://api.example.com/v1/installer/download

# Execute
chmod +x install.sh
./install.sh abc-123-def-456
```

### Scenario 3: Binary Installer

For maximum security:

```bash
# Download binary
curl -o installer https://api.example.com/v1/installer/download-binary

# Execute
chmod +x installer
./installer -license abc-123-def-456
```

### Scenario 4: Custom Scripts Directory

Deploy with custom action scripts:

```bash
# Download installer
curl -o install.sh https://api.example.com/install

# Create scripts directory
mkdir -p /opt/installer/scripts

# Add your custom scripts
cp my-script.sh /opt/installer/scripts/

# Run installer (will show menu)
SCRIPTS_DIR=/opt/installer/scripts ./install.sh <license-key>
```

## Security Considerations

1. **HTTPS Only**: Always use HTTPS for API communication
2. **API Keys**: Embedded during build, not exposed in plain text
3. **License Validation**: IP address must be authorized
4. **Rate Limiting**: Backend enforces rate limiting on auth checks
5. **Binary Compilation**: Go wrapper provides additional obfuscation

## Customization

### Custom API Validation

Edit `install.sh` to customize the validation logic:

```bash
validate_license() {
    # Add custom validation logic
    # ...
}
```

### Custom Installation Flow

Modify the `run_default_install()` function:

```bash
run_default_install() {
    log_info "Installing application..."
    # Your custom installation commands
}
```

### Custom Menu Options

Add scripts to the `scripts/` directory and they will automatically appear in the menu.

## Troubleshooting

### Issue: Installer script not found

**Solution:** Ensure the installer is built and deployed:
```bash
./build.sh
cp build/install.sh ../backend/installer/
```

### Issue: License validation fails

**Check:**
1. API_BASE_URL is correct
2. INSTALLER_API_KEY is valid
3. License key is valid
4. IP address is authorized for the license

**Debug:**
```bash
# Test API directly
curl -X POST https://api.example.com/v1/auth/check \
  -H "X-API-KEY: your-installer-key" \
  -H "Content-Type: application/json" \
  -d '{"license_key":"abc-123","public_ip":"1.2.3.4","machine_id":"test"}'
```

### Issue: No action scripts available

**Solution:** Ensure scripts directory exists and contains executable scripts:
```bash
mkdir -p /opt/installer/scripts
cp scripts/*.sh /opt/installer/scripts/
chmod +x /opt/installer/scripts/*.sh
```

### Issue: Cannot detect public IP

**Solution:** The installer tries multiple services. Check network connectivity:
```bash
curl https://ifconfig.me
curl https://ipinfo.io/ip
curl https://api.ipify.org
```

## Development

### Testing Locally

1. Start the backend:
```bash
cd ../backend
npm run dev
```

2. Test the installer:
```bash
cd ../installer
export API_BASE_URL="http://localhost:3000/v1"
export INSTALLER_API_KEY="your-test-key"
./install.sh "test-license-key"
```

### Building for Production

1. Configure for production:
```bash
cat > installer.config <<EOF
API_BASE_URL=https://api.production.com/v1
INSTALLER_API_KEY=prod-installer-key-here
EOF
```

2. Build:
```bash
./build.sh installer.config
```

3. Deploy:
```bash
# Copy to production server
scp build/install.sh user@server:/path/to/backend/installer/
```

## Advanced Usage

### Environment Variable Override

Even with embedded values, you can override at runtime:

```bash
API_BASE_URL=https://staging.api.com/v1 ./install.sh <license-key>
```

### Custom Scripts Location

```bash
SCRIPTS_DIR=/custom/path ./install.sh <license-key>
```

### Silent Installation (No Menu)

Remove or rename the scripts directory to run default installation:

```bash
SCRIPTS_DIR=/nonexistent ./install.sh <license-key>
```

### Logging

Enable verbose logging:

```bash
bash -x install.sh <license-key> 2>&1 | tee install.log
```

## License

MIT License - see LICENSE file for details
