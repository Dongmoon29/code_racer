package config

import "testing"

func TestLoadOAuthConfig_MissingVars_ProvidersDisabled(t *testing.T) {
	t.Setenv("GOOGLE_CLIENT_ID", "")
	t.Setenv("GOOGLE_CLIENT_SECRET", "")
	t.Setenv("GOOGLE_REDIRECT_URL", "")
	t.Setenv("GH_CLIENT_ID", "")
	t.Setenv("GH_CLIENT_SECRET", "")
	t.Setenv("GH_REDIRECT_URL", "")

	cfg, err := LoadOAuthConfig()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if cfg == nil {
		t.Fatalf("expected config, got nil")
	}
	if cfg.Google != nil {
		t.Fatalf("expected Google config to be nil when env is missing")
	}
	if cfg.GitHub != nil {
		t.Fatalf("expected GitHub config to be nil when env is missing")
	}
}

func TestLoadOAuthConfig_GoogleConfigured(t *testing.T) {
	t.Setenv("GOOGLE_CLIENT_ID", "id")
	t.Setenv("GOOGLE_CLIENT_SECRET", "secret")
	t.Setenv("GOOGLE_REDIRECT_URL", "http://localhost:8080/callback")

	cfg, err := LoadOAuthConfig()
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if cfg.Google == nil {
		t.Fatalf("expected Google config to be non-nil")
	}
}

func TestLoadOAuthConfig_InvalidRedirectURL_ReturnsError(t *testing.T) {
	t.Setenv("GH_CLIENT_ID", "id")
	t.Setenv("GH_CLIENT_SECRET", "secret")
	t.Setenv("GH_REDIRECT_URL", "://bad-url")

	_, err := LoadOAuthConfig()
	if err == nil {
		t.Fatalf("expected error, got nil")
	}
}
