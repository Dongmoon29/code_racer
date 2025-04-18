package com.coderacer.auth.service;

import com.coderacer.auth.dto.GoogleUserInfo;
import com.coderacer.auth.exception.OAuthException;
import com.coderacer.auth.util.HttpEntityBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
public class GoogleOAuthClient implements OAuthClient<GoogleUserInfo> {
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final RestTemplate restTemplate;

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

    @Override
    @Retryable(value = { RestClientException.class }, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public String getAccessToken(String code) {
        MultiValueMap<String, String> body = createTokenRequestBody(code);
        HttpEntity<MultiValueMap<String, String>> request = HttpEntityBuilder
                .create()
                .withFormUrlEncodedContentType()
                .withBody(body)
                .build();

        try {
            log.debug("Sending request to Google for access token");
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    TOKEN_URL,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            return extractAccessToken(response.getBody());
        } catch (RestClientException e) {
            log.error("Error exchanging Google auth code for access token", e);
            throw new OAuthException("Failed to exchange Google auth code: " + e.getMessage());
        }
    }

    private MultiValueMap<String, String> createTokenRequestBody(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("code", code);
        body.add("redirect_uri", redirectUri);
        body.add("grant_type", "authorization_code");
        return body;
    }

    private String extractAccessToken(Map<String, Object> responseBody) {
        return Optional.ofNullable(responseBody)
                .map(body -> body.get("access_token"))
                .map(Object::toString)
                .orElseThrow(() -> new OAuthException("Failed to get access token from Google"));
    }

    @Override
    @Retryable(value = { RestClientException.class }, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public GoogleUserInfo getUserInfo(String accessToken) {
        HttpEntity<?> request = HttpEntityBuilder
                .create()
                .withBearerAuth(accessToken)
                .build();

        try {
            log.debug("Fetching user info from Google");
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    USER_INFO_URL,
                    HttpMethod.GET,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            return buildGoogleUserInfo(response.getBody());
        } catch (RestClientException e) {
            log.error("Error fetching Google user info", e);
            throw new OAuthException("Failed to fetch Google user info: " + e.getMessage());
        }
    }

    private GoogleUserInfo buildGoogleUserInfo(Map<String, Object> userInfoMap) {
        if (userInfoMap == null) {
            throw new OAuthException("Empty response from Google UserInfo endpoint");
        }

        return GoogleUserInfo.builder()
                .id(getRequiredField(userInfoMap, "sub"))
                .email(getRequiredField(userInfoMap, "email"))
                .name(getRequiredField(userInfoMap, "name"))
                .picture(getOptionalField(userInfoMap, "picture", ""))
                .build();
    }

    private String getRequiredField(Map<String, Object> map, String fieldName) {
        return Optional.ofNullable(map.get(fieldName))
                .map(Object::toString)
                .orElseThrow(
                        () -> new OAuthException("Required field '" + fieldName + "' missing from Google response"));
    }

    private String getOptionalField(Map<String, Object> map, String fieldName, String defaultValue) {
        return Optional.ofNullable(map.get(fieldName))
                .map(Object::toString)
                .orElse(defaultValue);
    }

}
