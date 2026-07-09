package com.telemind.analytics.controller;

import com.telemind.analytics.security.JwtTokenProvider;
import com.telemind.analytics.security.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider jwtTokenProvider,
                          UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // Validate input
            if (request.username() == null || request.username().isBlank() ||
                request.password() == null || request.password().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Username and password are required"));
            }

            // Authenticate using BCrypt via DaoAuthenticationProvider
            Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            // Fetch tenant ID from database
            String tenantId = userRepository.findByUsername(request.username())
                    .map(u -> u.getTenantId())
                    .orElse("tenant_1");

            // Generate JWT token
            String token = jwtTokenProvider.generateToken(request.username(), tenantId);
            log.info("Login successful for user: {} (tenant: {})", request.username(), tenantId);

            return ResponseEntity.ok(Map.of(
                "token", token,
                "username", request.username(),
                "tenantId", tenantId
            ));

        } catch (BadCredentialsException e) {
            log.warn("Failed login attempt for user: {}", request.username());
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        } catch (Exception e) {
            log.error("Login error for user: {}", request.username(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Authentication failed"));
        }
    }

    public record LoginRequest(String username, String password) {}
}
