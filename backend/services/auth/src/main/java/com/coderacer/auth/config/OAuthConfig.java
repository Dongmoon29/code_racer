package com.coderacer.auth.config;

import com.coderacer.auth.service.GoogleOAuthClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class OAuthConfig {

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    @Value("${spring.security.oauth2.client.registration.google.redirect-uri}")
    private String googleRedirectUri;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public GoogleOAuthClient googleOAuthClient(RestTemplate restTemplate) {
        return new GoogleOAuthClient(
                googleClientId,
                googleClientSecret,
                googleRedirectUri,
                restTemplate);
    }
}
