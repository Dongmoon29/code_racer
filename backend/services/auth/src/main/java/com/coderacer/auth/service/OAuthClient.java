package com.coderacer.auth.service;

public interface OAuthClient<T> {
    String getAccessToken(String code);
    T getUserInfo(String accessToken);
}