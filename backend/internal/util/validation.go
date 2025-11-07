package util

import (
	"fmt"
	"net/url"
	"strconv"
	"strings"
)

// ValidatePort validates that a port string is a valid port number (1-65535)
func ValidatePort(portStr string) error {
	port, err := strconv.Atoi(portStr)
	if err != nil {
		return fmt.Errorf("invalid port format: %s", portStr)
	}
	if port < 1 || port > 65535 {
		return fmt.Errorf("port must be between 1 and 65535, got %d", port)
	}
	return nil
}

// ValidateURL validates that a string is a valid URL
func ValidateURL(urlStr string) error {
	if urlStr == "" {
		return fmt.Errorf("URL cannot be empty")
	}
	_, err := url.Parse(urlStr)
	if err != nil {
		return fmt.Errorf("invalid URL format: %s", urlStr)
	}
	return nil
}

// ValidateNonEmpty validates that a string is not empty
func ValidateNonEmpty(value, name string) error {
	if strings.TrimSpace(value) == "" {
		return fmt.Errorf("%s cannot be empty", name)
	}
	return nil
}

