package com.coderacer.auth.service;

import com.coderacer.auth.dto.AuthDto.UserResponse;
import com.coderacer.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .oauthProvider(user.getOauthProvider())
                .oauthId(user.getOauthId())
                .createdAt(user.getCreatedAt())
                .build();
    }
}