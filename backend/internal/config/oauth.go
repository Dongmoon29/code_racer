package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/Dongmoon29/code_racer/internal/util"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

// OAuthConfig holds OAuth configuration for different providers
type OAuthConfig struct {
	Google *oauth2.Config
	GitHub *oauth2.Config
}

// LoadOAuthConfig loads OAuth configuration from environment variables.
// If a provider's required variables are missing, that provider config is returned as nil.
// A non-nil error is returned only for invalid values (e.g. malformed redirect URL).
func LoadOAuthConfig() (*OAuthConfig, error) {
	googleCfg, googleMissing, err := loadProvider(
		"GOOGLE_CLIENT_ID",
		"GOOGLE_CLIENT_SECRET",
		"GOOGLE_REDIRECT_URL",
		[]string{
			"https://www.googleapis.com/auth/userinfo.email",
			"https://www.googleapis.com/auth/userinfo.profile",
		},
		google.Endpoint,
	)
	if err != nil {
		return nil, fmt.Errorf("google oauth config: %w", err)
	}

	githubCfg, githubMissing, err := loadProvider(
		"GH_CLIENT_ID",
		"GH_CLIENT_SECRET",
		"GH_REDIRECT_URL",
		[]string{
			"user:email",
			"read:user",
		},
		github.Endpoint,
	)
	if err != nil {
		return nil, fmt.Errorf("github oauth config: %w", err)
	}

	_ = googleMissing
	_ = githubMissing

	return &OAuthConfig{
		Google: googleCfg,
		GitHub: githubCfg,
	}, nil
}

func loadProvider(clientIDKey, clientSecretKey, redirectURLKey string, scopes []string, endpoint oauth2.Endpoint) (*oauth2.Config, []string, error) {
	var missing []string

	clientID := strings.TrimSpace(os.Getenv(clientIDKey))
	if clientID == "" {
		missing = append(missing, clientIDKey)
	}
	clientSecret := strings.TrimSpace(os.Getenv(clientSecretKey))
	if clientSecret == "" {
		missing = append(missing, clientSecretKey)
	}
	redirectURL := strings.TrimSpace(os.Getenv(redirectURLKey))
	if redirectURL == "" {
		missing = append(missing, redirectURLKey)
	}

	// If any required variables are missing, treat the provider as disabled.
	if len(missing) > 0 {
		return nil, missing, nil
	}

	if err := util.ValidateURL(redirectURL); err != nil {
		return nil, nil, fmt.Errorf("%s: %w", redirectURLKey, err)
	}

	return &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  redirectURL,
		Scopes:       scopes,
		Endpoint:     endpoint,
	}, nil, nil
}
