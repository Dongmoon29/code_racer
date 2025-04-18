package com.coderacer.auth.service;

import com.coderacer.auth.dto.AuthDto.LoginRequest;
import com.coderacer.auth.dto.AuthDto.LoginResponse;
import com.coderacer.auth.dto.AuthDto.RegisterRequest;
import com.coderacer.auth.dto.AuthDto.TokenResponse;
import com.coderacer.auth.dto.AuthDto.UserResponse;
import com.coderacer.auth.entity.User;
import com.coderacer.auth.exception.AuthenticationException;
import com.coderacer.auth.repository.UserRepository;
import com.coderacer.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final OAuthService oAuthService;
    private final UserMapper userMapper;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthenticationException("Email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName())
                .build();

        user = userRepository.save(user);
        return userMapper.toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthenticationException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new AuthenticationException("Invalid email or password");
        }

        return createLoginResponse(user);
    }

    @Transactional
    public LoginResponse loginWithGoogle(String code) {
        User user = oAuthService.processGoogleLogin(code);
        return createLoginResponse(user);
    }

    @Transactional
    public LoginResponse loginWithGithub(String code) {
        User user = oAuthService.processGithubLogin(code);
        return createLoginResponse(user);
    }

    private LoginResponse createLoginResponse(User user) {
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        return LoginResponse.builder()
                .user(userMapper.toUserResponse(user))
                .token(TokenResponse.builder()
                        .accessToken(token)
                        .tokenType("Bearer")
                        .expiresIn(86400000)
                        .build())
                .build();
    }
}