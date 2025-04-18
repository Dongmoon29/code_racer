package com.coderacer.auth.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties("spring.security.oauth2.client.registration")
public class OAuthProperties {
    private ProviderProperties google = new ProviderProperties();
    private ProviderProperties github = new ProviderProperties();

    @Data
    public static class ProviderProperties {
        private String clientId;
        private String clientSecret;
        private String redirectUri;
    }
}