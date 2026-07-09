package com.telemind.analytics.controller;

import com.telemind.analytics.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;

    public AuthController(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (!StringUtils.hasText(request.username()) || !StringUtils.hasText(request.password())) {
            return ResponseEntity.badRequest().body("Username and password are required.");
        }

        String tenantId = StringUtils.hasText(request.tenantId()) ? request.tenantId() : "tenant_1";
        
        // In a real multi-tenant SaaS application, credentials would be checked from a db table
        String token = jwtTokenProvider.generateToken(request.username(), tenantId);
        return ResponseEntity.ok(new LoginResponse(token));
    }

    public record LoginRequest(String username, String password, String tenantId) {}
    public record LoginResponse(String token) {}
}
