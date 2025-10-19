package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

const (
	defaultAPIBase    = "https://api.example.com/v1"
	defaultScriptsDir = "/opt/installer/scripts"
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
	var scriptsDir string

	flag.StringVar(&licenseKey, "license", "", "License key")
	flag.StringVar(&apiBase, "api", apiBaseURL, "API base URL")
	flag.StringVar(&apiKey, "key", installerAPIKey, "Installer API key")
	flag.StringVar(&scriptsDir, "scripts", defaultScriptsDir, "Scripts directory")
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
	if env := os.Getenv("SCRIPTS_DIR"); env != "" {
		scriptsDir = env
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
	fmt.Printf("[INFO] License Key: %s...\n", licenseKey[:min(8, len(licenseKey))])
	fmt.Printf("[INFO] Public IP: %s\n", publicIP)
	fmt.Printf("[INFO] Machine ID: %s...\n", machineID[:min(16, len(machineID))])

	if err := validateLicense(apiBase, apiKey, licenseKey, publicIP, machineID); err != nil {
		fmt.Printf("[ERROR] License validation failed: %v\n", err)
		fmt.Printf("[ERROR] Your IP (%s) is not authorized for this license\n", publicIP)
		fmt.Println("[ERROR] Installation aborted")
		os.Exit(1)
	}

	fmt.Println()
	fmt.Println("[INFO] ✓ License validated successfully!")
	fmt.Printf("[INFO] ✓ IP address: %s\n", publicIP)
	fmt.Println()

	// Set environment variables for scripts
	os.Setenv("LICENSE_KEY", licenseKey)
	os.Setenv("PUBLIC_IP", publicIP)
	os.Setenv("MACHINE_ID", machineID)

	// Check for action scripts
	if hasActionScripts(scriptsDir) {
		// Show interactive menu
		if err := interactiveMenu(scriptsDir); err != nil {
			fmt.Printf("[ERROR] Menu error: %v\n", err)
			os.Exit(1)
		}
	} else {
		// Run default installation
		fmt.Println("[INFO] Running default installation...")
		fmt.Println()
		if err := runInstallation(); err != nil {
			fmt.Printf("[ERROR] Installation failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println()
		fmt.Println("[INFO] Installation completed successfully!")
	}

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

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

// Check if scripts directory has action scripts
func hasActionScripts(scriptsDir string) bool {
	if _, err := os.Stat(scriptsDir); os.IsNotExist(err) {
		return false
	}

	files, err := os.ReadDir(scriptsDir)
	if err != nil {
		return false
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sh") {
			return true
		}
	}

	return false
}

// List available action scripts
func listActionScripts(scriptsDir string) ([]string, error) {
	files, err := os.ReadDir(scriptsDir)
	if err != nil {
		return nil, err
	}

	var scripts []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sh") {
			scriptPath := fmt.Sprintf("%s/%s", scriptsDir, file.Name())
			scripts = append(scripts, scriptPath)
		}
	}

	return scripts, nil
}

// Extract description from script
func getScriptDescription(scriptPath string) string {
	file, err := os.Open(scriptPath)
	if err != nil {
		return ""
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "# Description:") {
			return strings.TrimSpace(strings.TrimPrefix(line, "# Description:"))
		}
	}

	return ""
}

// Show interactive menu
func interactiveMenu(scriptsDir string) error {
	reader := bufio.NewReader(os.Stdin)

	for {
		// Get list of scripts
		scripts, err := listActionScripts(scriptsDir)
		if err != nil || len(scripts) == 0 {
			return fmt.Errorf("no action scripts available")
		}

		// Display menu
		fmt.Println()
		fmt.Println("==========================================")
		fmt.Println("  Available Actions")
		fmt.Println("==========================================")
		fmt.Println()

		for i, script := range scripts {
			name := strings.TrimSuffix(filepath.Base(script), ".sh")
			desc := getScriptDescription(script)
			fmt.Printf("%2d) %-30s %s\n", i+1, name, desc)
		}

		fmt.Println()
		fmt.Printf("%2d) Exit\n", 0)
		fmt.Println()

		// Get user selection
		fmt.Print("Select an action (0-", len(scripts), "): ")
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(input)

		selection, err := strconv.Atoi(input)
		if err != nil {
			fmt.Println("[ERROR] Invalid input. Please enter a number.")
			continue
		}

		// Handle exit
		if selection == 0 {
			fmt.Println("[INFO] Exiting installer")
			break
		}

		// Validate range
		if selection < 1 || selection > len(scripts) {
			fmt.Printf("[ERROR] Invalid selection. Please choose between 0 and %d.\n", len(scripts))
			continue
		}

		// Execute selected script
		selectedScript := scripts[selection-1]
		if err := executeScript(selectedScript); err != nil {
			fmt.Printf("[ERROR] Script execution failed: %v\n", err)
		}

		fmt.Println()
		fmt.Print("Press Enter to continue...")
		reader.ReadString('\n')
	}

	return nil
}

// Execute a script
func executeScript(scriptPath string) error {
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		return fmt.Errorf("script not found: %s", scriptPath)
	}

	// Make executable
	os.Chmod(scriptPath, 0755)

	fmt.Printf("[INFO] Executing: %s\n", filepath.Base(scriptPath))
	fmt.Println()

	cmd := exec.Command("bash", scriptPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Env = os.Environ()

	err := cmd.Run()

	fmt.Println()
	if err != nil {
		fmt.Printf("[ERROR] Action failed with exit code: %v\n", err)
		return err
	}

	fmt.Println("[INFO] ✓ Action completed successfully")
	return nil
}
