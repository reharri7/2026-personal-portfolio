package com.rhettharrison.portfolio.controller;

import com.rhettharrison.portfolio.event.UserRegisteredEvent;
import com.rhettharrison.portfolio.model.User;
import com.rhettharrison.portfolio.repository.UserRepository;
import com.rhettharrison.portfolio.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final PasswordResetService passwordResetService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy();
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> registrationData) {
        String email = registrationData.get("email");
        String password = registrationData.get("password");
        String displayName = registrationData.get("displayName");

        if (email == null || password == null || displayName == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email, password, and display name are required"));
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setDisplayName(displayName);
        user.setIsAdmin(false);

        userRepository.save(user);
        eventPublisher.publishEvent(new UserRegisteredEvent(email, displayName));

        return ResponseEntity.ok(Map.of("message", "Registration successful", "email", email));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        // Always succeed (non-enumerating): never reveal whether an account exists.
        if (email != null && !email.isBlank()) {
            passwordResetService.requestReset(email.trim());
        }
        return ResponseEntity.ok(Map.of("message", "If that account exists, a reset link is on its way"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String password = body.get("password");
        if (token == null || password == null || password.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("message", "Token and a password of 8+ characters are required"));
        }
        passwordResetService.resetPassword(token, password);
        return ResponseEntity.ok(Map.of("message", "Password updated"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials, HttpServletRequest request, HttpServletResponse response) {
        String email = credentials.get("email");
        String password = credentials.get("password");

        UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.unauthenticated(email, password);
        Authentication authentication = authenticationManager.authenticate(token);

        SecurityContext context = securityContextHolderStrategy.createEmptyContext();
        context.setAuthentication(authentication);
        securityContextHolderStrategy.setContext(context);
        securityContextRepository.saveContext(context, request, response);

        return ResponseEntity.ok(Map.of("message", "Login successful", "user", email));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        request.getSession().invalidate();
        
        return ResponseEntity.ok(Map.of("message", "Logout successful"));
    }
    
    @GetMapping("/csrf")
    public ResponseEntity<?> csrf(HttpServletRequest request) {
        CsrfToken token = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (token == null) {
            return ResponseEntity.ok(Map.of());
        }
        return ResponseEntity.ok(Map.of(
            "headerName", token.getHeaderName(),
            "token", token.getToken()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body(Map.of("message", "Not authenticated"));
        }
        
        return ResponseEntity.ok(Map.of(
            "email", authentication.getName(),
            "authorities", authentication.getAuthorities()
        ));
    }
}
