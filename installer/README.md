# License Authentication Installer

This directory contains installer scripts that validate licenses before executing installations.

## Components

### 1. Shell Script Installer (`install.sh`)

A pure Bash installer that validates licenses via API before running installation commands.

**Usage:**
```bash
# Using environment variables
export API_BASE_URL="https://api.example.com/v1"
export INSTALLER_API_KEY="your-installer-key"
export LICENSE_KEY="your-license-key"
./install.sh

# Or pass license key as argument
./install.sh "your-license-key"
```

**Features:**
- Detects public IP automatically
- Reads machine ID from `/etc/machine-id`
- Validates license via REST API
- Only proceeds with installation if license is valid

### 2. Go Wrapper (`go/main.go`)

A compiled binary installer that provides better security through obfuscation.

**Build:**
```bash
cd go
go build -o ../installer main.go

# Build with embedded API key (more secure)
go build -ldflags "-X main.apiBaseURL=https://api.example.com/v1 -X main.installerAPIKey=your-key" -o ../installer main.go

# Build for different platforms
GOOS=linux GOARCH=amd64 go build -o ../installer-linux-amd64 main.go
GOOS=linux GOARCH=arm64 go build -o ../installer-linux-arm64 main.go
```

**Usage:**
```bash
# Run with flags
./installer -license "your-license-key"

# Or with environment variables
export LICENSE_KEY="your-license-key"
./installer
```

### 3. Obfuscated Shell Script (using `shc`)

Compile the shell script into a binary for light obfuscation.

**Install shc:**
```bash
# Ubuntu/Debian
sudo apt-get install shc

# CentOS/RHEL
sudo yum install shc
```

**Compile:**
```bash
shc -f install.sh -o installer.bin
```

**Note:** `shc` provides only basic obfuscation and can be reversed. For production use, consider the Go wrapper or signed license files.

## Security Considerations

1. **HTTPS Only**: Always use HTTPS for API communication
2. **API Keys**: Store API keys securely, use environment variables
3. **Rate Limiting**: The backend enforces rate limiting on auth checks
4. **IP Validation**: Combine license key + IP + machine ID for better security
5. **Binary Compilation**: Use Go wrapper for better protection of API keys

## Customization

Replace the section between `### BEGIN REAL INSTALL ###` and `### END REAL INSTALL ###` with your actual installation commands.

For the Go wrapper, modify the `runInstallation()` function to execute your installation logic.

## API Configuration

Update these environment variables:
- `API_BASE_URL` - Backend API base URL
- `INSTALLER_API_KEY` - API key for installer authentication
- `LICENSE_KEY` - Customer license key (can be provided at runtime)
