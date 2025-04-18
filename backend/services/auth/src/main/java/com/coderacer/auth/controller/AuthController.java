package com.coderacer.auth.controller;

import com.coderacer.auth.dto.AuthDto.*;
import com.coderacer.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/google")
    public ResponseEntity<LoginResponse> googleLogin(@RequestBody OAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.getCode()));
    }

    @PostMapping("/github")
    public ResponseEntity<LoginResponse> githubLogin(@RequestBody OAuthRequest request) {
        return ResponseEntity.ok(authService.loginWithGithub(request.getCode()));
    }
}
