package com.coderacer.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

public class AuthDto {
    // Request DTOs
    @Getter
    @Setter
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        @NotBlank(message = "Name is required")
        private String name;
    }

    @Getter
    @Setter
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Getter
    @Builder
    public static class LoginResponse {
        private UserResponse user;
        private TokenResponse token;
    }

    @Getter
    @Setter
    public static class OAuthRequest {
        private String code;
    }

    // Response DTOs
    @Getter
    @Builder
    public static class TokenResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private long expiresIn;
    }

    @Getter
    @Builder
    public static class UserResponse {
        private UUID id;
        private String email;
        private String name;
        private String role;
        private String oauthProvider;
        private String oauthId;
        private LocalDateTime createdAt;
    }

}