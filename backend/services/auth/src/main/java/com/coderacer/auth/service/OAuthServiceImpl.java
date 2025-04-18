package com.coderacer.auth.service;

import com.coderacer.auth.dto.GithubUserInfo;
import com.coderacer.auth.dto.GoogleUserInfo;
import com.coderacer.auth.entity.User;
import com.coderacer.auth.exception.OAuthException;
import com.coderacer.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class OAuthServiceImpl implements OAuthService {
    private final UserRepository userRepository;
    private final OAuthClientFactory oAuthClientFactory;

    @Transactional
    @Override
    public User processGoogleLogin(String code) {
        return processOAuthLogin(
                () -> oAuthClientFactory.createGoogleClient().getAccessToken(code),
                accessToken -> oAuthClientFactory.createGoogleClient().getUserInfo(accessToken),
                this::createGoogleUser);
    }

    @Transactional
    @Override
    public User processGithubLogin(String code) {
        return processOAuthLogin(
                () -> oAuthClientFactory.createGithubClient().getAccessToken(code),
                accessToken -> oAuthClientFactory.createGithubClient().getUserInfo(accessToken),
                this::createGithubUser);
    }

    private <T> User processOAuthLogin(
            Supplier<String> accessTokenSupplier,
            java.util.function.Function<String, T> userInfoFetcher,
            java.util.function.Function<T, User> userCreator) {
        String accessToken = accessTokenSupplier.get();
        T userInfo = userInfoFetcher.apply(accessToken);
        String email = getEmailFromUserInfo(userInfo);

        return userRepository.findByEmail(email)
                .orElseGet(() -> userCreator.apply(userInfo));
    }

    private String getEmailFromUserInfo(Object userInfo) {
        if (userInfo instanceof GoogleUserInfo) {
            return ((GoogleUserInfo) userInfo).getEmail();
        } else if (userInfo instanceof GithubUserInfo) {
            return ((GithubUserInfo) userInfo).getEmail();
        }
        throw new OAuthException("Unsupported user info type: " + userInfo.getClass().getName());
    }

    private User createGoogleUser(GoogleUserInfo googleUser) {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(googleUser.getEmail())
                .name(googleUser.getName())
                .oauthProvider("google")
                .oauthId(googleUser.getId())
                .profileImage(googleUser.getPicture())
                .build();

        return userRepository.save(user);
    }

    private User createGithubUser(GithubUserInfo githubUser) {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(githubUser.getEmail())
                .name(githubUser.getName())
                .oauthProvider("github")
                .oauthId(githubUser.getId())
                .profileImage(githubUser.getAvatarUrl())
                .build();

        return userRepository.save(user);
    }
}
