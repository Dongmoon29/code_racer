package com.coderacer.auth.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GithubUserInfo {
    private String id;
    private String email;
    private String name;
    private String avatarUrl;
}
