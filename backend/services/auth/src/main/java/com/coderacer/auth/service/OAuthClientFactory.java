package com.coderacer.auth.service;

import com.coderacer.auth.config.OAuthProperties;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class OAuthClientFactory {
    private final OAuthProperties oAuthProperties;
    private final RestTemplate restTemplate;

    public OAuthClientFactory(OAuthProperties oAuthProperties, RestTemplate restTemplate) {
        this.oAuthProperties = oAuthProperties;
        this.restTemplate = restTemplate;
    }

    public GoogleOAuthClient createGoogleClient() {
        return new GoogleOAuthClient(
                oAuthProperties.getGoogle().getClientId(),
                oAuthProperties.getGoogle().getClientSecret(),
                oAuthProperties.getGoogle().getRedirectUri(),
                restTemplate);
    }

    public GithubOAuthClient createGithubClient() {
        return new GithubOAuthClient(
                oAuthProperties.getGithub().getClientId(),
                oAuthProperties.getGithub().getClientSecret(),
                oAuthProperties.getGithub().getRedirectUri(),
                restTemplate,
                com.coderacer.auth.util.HttpEntityBuilder.create());
    }
}
