package com.coderacer.auth.service;

import com.coderacer.auth.dto.AuthDto.LoginRequest;
import com.coderacer.auth.dto.AuthDto.LoginResponse;
import com.coderacer.auth.dto.AuthDto.RegisterRequest;
import com.coderacer.auth.dto.AuthDto.UserResponse;

public interface AuthService {
        UserResponse register(RegisterRequest request);

        LoginResponse login(LoginRequest request);

        LoginResponse loginWithGoogle(String code);

        LoginResponse loginWithGithub(String code);
}
