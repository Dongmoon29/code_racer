package com.coderacer.auth.controller;

import com.coderacer.auth.dto.AuthDto;
import com.coderacer.auth.dto.AuthDto.*;
import com.coderacer.auth.security.JwtTokenProvider;
import com.coderacer.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${frontend.domain}")
    private String frontendDomain;

    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        LoginResponse loginResponse = authService.login(request);

        // 쿠키 생성 및 설정
        ResponseCookie cookie = jwtTokenProvider.createCookie(loginResponse.getToken().getAccessToken());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/oauth/google")
    public ResponseEntity<LoginResponse> googleLogin(@RequestBody AuthDto.OAuthRequest request,
            HttpServletResponse response) {
        LoginResponse loginResponse = authService.loginWithGoogle(request.getCode());

        // 쿠키 생성 및 설정
        ResponseCookie cookie = jwtTokenProvider.createCookie(loginResponse.getToken().getAccessToken());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        // 쿠키 삭제
        ResponseCookie cookie = ResponseCookie.from("authToken", "")
                .domain(frontendDomain)
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok().build();
    }
}
