package com.coderacer.auth.service;

import com.coderacer.auth.dto.GithubUserInfo;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
public class GithubOAuthClient implements OAuthClient<GithubUserInfo> {
    private final String clientId;
    private final String clientSecret;
    private final String redirectUri;
    private final RestTemplate restTemplate;
    private final HttpEntityBuilder httpEntityBuilder;

    private static final String TOKEN_URL = "https://github.com/login/oauth/access_token";
    private static final String USER_INFO_URL = "https://api.github.com/user";
    private static final String USER_EMAILS_URL = "https://api.github.com/user/emails";

    @Override
    @Retryable(value = { RestClientException.class }, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public String getAccessToken(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", clientId);
        body.add("client_secret", clientSecret);
        body.add("code", code);
        body.add("redirect_uri", redirectUri);

        HttpEntity<MultiValueMap<String, String>> request = httpEntityBuilder
                .create()
                .withFormUrlEncodedContentType()
                .withJsonAcceptHeader()
                .withBody(body)
                .build();

        try {
            log.debug("Sending request to GitHub for access token");
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    TOKEN_URL,
                    HttpMethod.POST,
                    request,
                    new ParameterizedTypeReference<Map<String, Object>>() {
                    });

            return Optional.ofNullable(response.getBody())
                    .map(map -> map.get("access_token"))
                    .map(Object::toString)
                    .orElseThrow(() -> new OAuthException("Failed to get access token from GitHub"));
        } catch (RestClientException e) {
            log.error("Error exchanging GitHub auth code for access token", e);
            throw new OAuthException("Failed to exchange GitHub auth code: " + e.getMessage());
        }
    }

    @Override
    @Retryable(value = { RestClientException.class }, maxAttempts = 3, backoff = @Backoff(delay = 1000))
    public GithubUserInfo getUserInfo(String accessToken) {
        try {
            // 사용자 기본 정보 가져오기
            Map<String, Object> userInfoMap = fetchUserInfoFromGithub(accessToken);

            // 이메일 정보 가져오기
            String email = fetchAndExtractPrimaryEmail(accessToken);

            return buildGithubUserInfo(userInfoMap, email);
        } catch (RestClientException e) {
            log.error("Error fetching GitHub user info", e);
            throw new OAuthException("Failed to fetch GitHub user info: " + e.getMessage());
        }
    }

    private Map<String, Object> fetchUserInfoFromGithub(String accessToken) {
        HttpEntity<?> entity = httpEntityBuilder
                .create()
                .withBearerAuth(accessToken)
                .withJsonAcceptHeader()
                .build();

        ResponseEntity<Map<String, Object>> userResponse = restTemplate.exchange(
                USER_INFO_URL,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {
                });

        return Optional.ofNullable(userResponse.getBody())
                .orElseThrow(() -> new OAuthException("Empty response from GitHub UserInfo endpoint"));
    }

    private String fetchAndExtractPrimaryEmail(String accessToken) {
        HttpEntity<?> entity = httpEntityBuilder
                .create()
                .withBearerAuth(accessToken)
                .withJsonAcceptHeader()
                .build();

        ResponseEntity<List<Map<String, Object>>> emailsResponse = restTemplate.exchange(
                USER_EMAILS_URL,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<List<Map<String, Object>>>() {
                });

        List<Map<String, Object>> emails = Optional.ofNullable(emailsResponse.getBody())
                .orElseThrow(() -> new OAuthException("No email information available from GitHub"));

        return extractPrimaryEmail(emails);
    }

    private String extractPrimaryEmail(List<Map<String, Object>> emails) {
        return emails.stream()
                .filter(email -> Boolean.TRUE.equals(email.get("primary"))
                        && Boolean.TRUE.equals(email.get("verified")))
                .findFirst()
                .map(email -> email.get("email").toString())
                .orElseThrow(() -> new OAuthException("No verified primary email found"));
    }

    private GithubUserInfo buildGithubUserInfo(Map<String, Object> userInfoMap, String email) {
        String name = Optional.ofNullable(userInfoMap.get("name"))
                .map(Object::toString)
                .orElseGet(() -> userInfoMap.get("login").toString());

        String avatarUrl = Optional.ofNullable(userInfoMap.get("avatar_url"))
                .map(Object::toString)
                .orElse(null);

        return GithubUserInfo.builder()
                .id(userInfoMap.get("id").toString())
                .email(email)
                .name(name)
                .avatarUrl(avatarUrl)
                .build();
    }
}
