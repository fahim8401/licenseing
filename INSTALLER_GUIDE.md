# Installer Quick Start Guide

This guide walks you through setting up and using the new installer system.

## Overview

The installer system has been refactored to support:

1. **Pre-build configuration** - Set API URLs and keys before building
2. **Remote installation** - Execute via `bash <( curl URL )`
3. **Interactive menu** - After IP validation, users can select from available actions
4. **Modular actions** - Custom bash scripts for different installation tasks

## Setup (Administrator)

### Step 1: Configure Your Installer

Create a configuration file with your API settings:

```bash
cd installer

# Create configuration file
cat > installer.config <<EOF
API_BASE_URL=https://your-api.example.com/v1
INSTALLER_API_KEY=your-installer-api-key
EOF
```

### Step 2: Build the Installer

Run the build script to create configured installers:

```bash
./build.sh installer.config
```

This creates:
- `build/install.sh` - Configured bash installer
- `build/installer-linux-amd64` - Go binary for Linux AMD64
- `build/installer-linux-arm64` - Go binary for Linux ARM64
- `build/installer` - Go binary for current platform
- `build/installer-bundle.tar.gz` - Complete package

### Step 3: Deploy the Backend

The backend automatically serves the installer. Just make sure the installer script is accessible:

```bash
# The backend will look for installer/install.sh relative to its location
# If using the built version, copy it to the installer directory:
cp build/install.sh install.sh

# Or ensure your build directory is properly structured
```

Start the backend:

```bash
cd ../backend
npm run dev  # Development
# or
npm start    # Production
```

The installer will be available at:
- `http://your-api.example.com/install` - For bash execution
- `http://your-api.example.com/v1/installer/download` - For download

### Step 4: Create Action Scripts (Optional)

Create custom installation scripts that will appear in the menu:

```bash
# Create scripts directory
mkdir -p /opt/installer/scripts

# Create a custom action
cat > /opt/installer/scripts/my-custom-action.sh <<'EOF'
#!/bin/bash
# Description: Install and configure my application

echo "Running custom installation..."

# Available environment variables:
# - LICENSE_KEY: The validated license key
# - PUBLIC_IP: The detected public IP
# - MACHINE_ID: The machine identifier

# Your installation logic here
echo "Installing application for license: $LICENSE_KEY"
echo "Authorized IP: $PUBLIC_IP"

# Example commands
# apt-get update
# apt-get install -y myapp
# systemctl enable myapp
# systemctl start myapp

echo "✓ Installation complete!"
EOF

chmod +x /opt/installer/scripts/my-custom-action.sh
```

## Usage (End User)

### Method 1: One-Line Remote Installation (Recommended)

```bash
bash <( curl https://api.example.com/install ) <your-license-key>
```

**What happens:**
1. Script downloads and executes
2. Detects your public IP automatically
3. Validates license key against IP
4. Shows interactive menu of available actions
5. You select which actions to run

### Method 2: Download and Execute

```bash
# Download the installer
curl -o install.sh https://api.example.com/v1/installer/download

# Make executable
chmod +x install.sh

# Run
./install.sh <your-license-key>
```

### Method 3: Binary Installer (Go)

```bash
# Download binary
curl -o installer https://api.example.com/v1/installer/download-binary

# Make executable
chmod +x installer

# Run
./installer -license <your-license-key>
```

### Method 4: With Custom Scripts Directory

```bash
# Run with custom scripts location
SCRIPTS_DIR=/opt/installer/scripts bash <( curl https://api.example.com/install ) <license-key>
```

## Interactive Menu

After successful license validation, you'll see:

```
==========================================
  License Authentication Installer
==========================================

[INFO] Detecting public IP address...
[INFO] Validating license...
[INFO] ✓ License validated successfully!
[INFO] ✓ IP address: 1.2.3.4

==========================================
  Available Actions
==========================================

 1) install-app              Install and configure the main application
 2) configure-system         Configure system settings and environment
 3) setup-monitoring         Setup and start monitoring services
 4) update-app              Update existing installation to latest version
 
 0) Exit

Select an action (0-4):
```

Select a number to execute that action. The installer will:
- Execute the selected script
- Show progress and output
- Return to the menu when complete
- Allow you to run multiple actions sequentially

## Troubleshooting

### "License validation failed"

**Cause:** Your IP address is not authorized for the license.

**Solution:**
1. Check your public IP: `curl https://ifconfig.me`
2. Add your IP to the license in the admin panel
3. Try again

### "No action scripts available"

**Cause:** No scripts found in the scripts directory.

**Solution:**
- Check if scripts exist: `ls /opt/installer/scripts/`
- Copy example scripts: `cp installer/scripts/*.sh /opt/installer/scripts/`
- Or run with custom location: `SCRIPTS_DIR=/path/to/scripts ./install.sh`

### "Installer not found" when accessing endpoint

**Cause:** Backend cannot find the installer script.

**Solution:**
1. Ensure installer/install.sh exists in the backend's parent directory
2. Check file permissions: `chmod 644 installer/install.sh`
3. Verify backend is running in the correct directory

### Build script fails

**Cause:** Configuration file missing or invalid.

**Solution:**
1. Create configuration: `cp installer.config.example installer.config`
2. Edit with your values
3. Run build again: `./build.sh`

## Advanced Usage

### Environment Variable Override

Override embedded values at runtime:

```bash
API_BASE_URL=https://staging.api.com/v1 ./install.sh <license-key>
```

### Silent Installation (No Menu)

Run default installation without menu:

```bash
SCRIPTS_DIR=/nonexistent ./install.sh <license-key>
```

### Logging

Enable verbose logging:

```bash
bash -x install.sh <license-key> 2>&1 | tee install.log
```

### Building for Multiple Environments

```bash
# Production
cat > installer.config.prod <<EOF
API_BASE_URL=https://api.production.com/v1
INSTALLER_API_KEY=prod-key-here
EOF

./build.sh installer.config.prod
mv build build-prod

# Staging
cat > installer.config.staging <<EOF
API_BASE_URL=https://api.staging.com/v1
INSTALLER_API_KEY=staging-key-here
EOF

./build.sh installer.config.staging
mv build build-staging
```

## Security Best Practices

1. **Use HTTPS** - Always use HTTPS for API endpoints
2. **Rotate Keys** - Regularly rotate API keys
3. **IP Whitelisting** - Only authorize specific IP addresses
4. **Audit Logs** - Monitor authentication logs regularly
5. **Binary Distribution** - Use Go binaries for better security
6. **Rate Limiting** - Backend enforces rate limits automatically

## Next Steps

- Review the [installer README](installer/README.md) for detailed documentation
- Check the [API documentation](API.md) for endpoint details
- See [deployment guide](DEPLOYMENT.md) for production setup
- Explore example action scripts in `installer/scripts/`

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f api`
- Review backend logs for API errors
- Test API directly: `curl -X POST https://api.example.com/v1/auth/check ...`
- Open an issue on GitHub
