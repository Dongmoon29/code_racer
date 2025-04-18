package com.coderacer.auth.service;

import com.coderacer.auth.entity.User;

public interface OAuthService {
    User processGoogleLogin(String code);
    User processGithubLogin(String code);
}