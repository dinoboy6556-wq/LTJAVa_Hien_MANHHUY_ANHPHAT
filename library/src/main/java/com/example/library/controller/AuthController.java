package com.example.library.controller;

import com.example.library.dto.*;
import com.example.library.entity.User;
import com.example.library.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public record ChangePasswordRequest(@NotBlank String currentPassword,
                                        @NotBlank @Size(min = 8, max = 128) String newPassword,
                                        @NotBlank @Size(min = 6, max = 6) String otp) {}

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<User> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/change-password/send-otp")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<java.util.Map<String, String>> sendChangePasswordOtp(Authentication authentication) {
        authService.sendPasswordChangeOtp(authentication.getName());
        return ResponseEntity.ok(java.util.Map.of("message", "Mã OTP đã được gửi tới email của bạn."));
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> changePassword(Authentication authentication,
                                                @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(authentication.getName(), request.currentPassword(), request.newPassword(), request.otp());
        return ResponseEntity.noContent().build();
    }
}
