package config

import (
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

// OAuthConfig holds OAuth configuration for different providers
type OAuthConfig struct {
	Google *oauth2.Config
	GitHub *oauth2.Config
}

// LoadOAuthConfig loads OAuth configuration from environment variables
func LoadOAuthConfig() *OAuthConfig {
	return &OAuthConfig{
		Google: &oauth2.Config{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		},
		GitHub: &oauth2.Config{
			ClientID:     os.Getenv("GH_CLIENT_ID"),
			ClientSecret: os.Getenv("GH_CLIENT_SECRET"),
			RedirectURL:  os.Getenv("GH_REDIRECT_URL"),
			Scopes: []string{
				"user:email",
				"read:user",
			},
			Endpoint: github.Endpoint,
		},
	}
}
