package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"
)

const (
	defaultAPIBase = "https://api.example.com/v1"
)

var (
	// These can be set via ldflags at build time
	apiBaseURL      = defaultAPIBase
	installerAPIKey = "changeme-installer-key-here"
)

type AuthCheckRequest struct {
	LicenseKey string `json:"license_key"`
	PublicIP   string `json:"public_ip"`
	MachineID  string `json:"machine_id"`
}

type AuthCheckResponse struct {
	Allowed bool   `json:"allowed"`
	Message string `json:"message"`
}

func main() {
	var licenseKey string
	var apiBase string
	var apiKey string

	flag.StringVar(&licenseKey, "license", "", "License key")
	flag.StringVar(&apiBase, "api", apiBaseURL, "API base URL")
	flag.StringVar(&apiKey, "key", installerAPIKey, "Installer API key")
	flag.Parse()

	// Override from environment if set
	if env := os.Getenv("API_BASE_URL"); env != "" {
		apiBase = env
	}
	if env := os.Getenv("INSTALLER_API_KEY"); env != "" {
		apiKey = env
	}
	if env := os.Getenv("LICENSE_KEY"); env != "" && licenseKey == "" {
		licenseKey = env
	}

	// Prompt for license key if not provided
	if licenseKey == "" {
		fmt.Print("Enter your license key: ")
		fmt.Scanln(&licenseKey)
	}

	if licenseKey == "" {
		fmt.Println("Error: License key is required")
		os.Exit(1)
	}

	fmt.Println("==========================================")
	fmt.Println("  License Authentication Installer")
	fmt.Println("==========================================")
	fmt.Println()

	// Get public IP
	fmt.Println("[INFO] Detecting public IP address...")
	publicIP, err := getPublicIP()
	if err != nil {
		fmt.Printf("[ERROR] Failed to detect public IP: %v\n", err)
		os.Exit(1)
	}

	// Get machine ID
	machineID := getMachineID()

	// Validate license
	fmt.Println("[INFO] Validating license...")
	fmt.Printf("[INFO] License Key: %s...\n", licenseKey[:8])
	fmt.Printf("[INFO] Public IP: %s\n", publicIP)
	fmt.Printf("[INFO] Machine ID: %s...\n", machineID[:16])

	if err := validateLicense(apiBase, apiKey, licenseKey, publicIP, machineID); err != nil {
		fmt.Printf("[ERROR] License validation failed: %v\n", err)
		fmt.Println("[ERROR] Installation aborted")
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("[INFO] License validated successfully. Proceeding with installation...")
	fmt.Println()

	// Run the actual installation
	if err := runInstallation(); err != nil {
		fmt.Printf("[ERROR] Installation failed: %v\n", err)
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("[INFO] Installation completed successfully!")
	fmt.Println()
}

func getPublicIP() (string, error) {
	services := []string{
		"https://ifconfig.me",
		"https://ipinfo.io/ip",
		"https://api.ipify.org",
	}

	client := &http.Client{Timeout: 5 * time.Second}

	for _, service := range services {
		resp, err := client.Get(service)
		if err != nil {
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == 200 {
			body, err := io.ReadAll(resp.Body)
			if err == nil {
				ip := strings.TrimSpace(string(body))
				if ip != "" {
					return ip, nil
				}
			}
		}
	}

	return "", fmt.Errorf("all IP detection services failed")
}

func getMachineID() string {
	// Try to read /etc/machine-id
	paths := []string{
		"/etc/machine-id",
		"/var/lib/dbus/machine-id",
	}

	for _, path := range paths {
		if data, err := os.ReadFile(path); err == nil {
			return strings.TrimSpace(string(data))
		}
	}

	// Fallback to hostname
	if hostname, err := os.Hostname(); err == nil {
		return hostname
	}

	return "unknown"
}

func validateLicense(apiBase, apiKey, licenseKey, publicIP, machineID string) error {
	url := fmt.Sprintf("%s/auth/check", apiBase)

	reqBody := AuthCheckRequest{
		LicenseKey: licenseKey,
		PublicIP:   publicIP,
		MachineID:  machineID,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-KEY", apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var authResp AuthCheckResponse
	if err := json.Unmarshal(body, &authResp); err != nil {
		return fmt.Errorf("failed to parse response (status %d): %s", resp.StatusCode, string(body))
	}

	if resp.StatusCode != 200 || !authResp.Allowed {
		return fmt.Errorf("%s (status: %d)", authResp.Message, resp.StatusCode)
	}

	return nil
}

func runInstallation() error {
	// This is where the actual installation commands would be executed
	// For demonstration, we'll just run some simple commands

	fmt.Println("[INFO] Installing application...")
	time.Sleep(1 * time.Second)

	fmt.Println("[INFO] Configuring system...")
	time.Sleep(1 * time.Second)

	fmt.Println("[INFO] Setting up services...")
	time.Sleep(1 * time.Second)

	// Example: You can execute embedded scripts or commands here
	// cmd := exec.Command("bash", "-c", "echo 'Running actual installation'")
	// cmd.Stdout = os.Stdout
	// cmd.Stderr = os.Stderr
	// return cmd.Run()

	return nil
}

// Embedded installation script (optional)
// You can embed the actual installation script here and execute it
const installScript = `
#!/bin/bash
# Your actual installation script here
echo "Running embedded installation script"
# Add your installation commands
`

func runEmbeddedScript() error {
	cmd := exec.Command("bash", "-c", installScript)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
