package com.example.library.service;

import com.example.library.dto.*;
import com.example.library.entity.*;
import com.example.library.repository.*;
import com.example.library.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private LoginAttemptService loginAttempts;

    @Autowired
    private PasswordChangeOtpRepository passwordChangeOtpRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ApplicationEventPublisher events;

    public JwtResponse login(LoginRequest loginRequest) {
        String attemptKey = loginRequest.getEmail();
        if (loginAttempts.isBlocked(attemptKey)) throw new LoginRateLimitException();
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    loginRequest.getEmail(), loginRequest.getPassword()));
            loginAttempts.succeeded(attemptKey);
        } catch (AuthenticationException ex) {
            loginAttempts.failed(attemptKey);
            if (loginAttempts.isBlocked(attemptKey)) throw new LoginRateLimitException();
            throw ex;
        }

        String jwt = tokenProvider.generateToken(authentication);
        User user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());

        return JwtResponse.builder()
                .token(jwt)
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }

    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    @Transactional
    public void sendPasswordChangeOtp(String email) {
        User user = userRepository.findForUpdateByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));

        String otpCode = String.format("%06d", OTP_RANDOM.nextInt(1000000));
        LocalDateTime now = LocalDateTime.now();

        if (passwordChangeOtpRepository.findTopByEmailOrderByCreatedAtDesc(email)
                .filter(otp -> otp.getCreatedAt().plusMinutes(1).isAfter(now)).isPresent()) {
            throw new IllegalStateException("Vui lòng chờ một phút trước khi yêu cầu mã mới.");
        }
        passwordChangeOtpRepository.deleteAllByEmail(email);
        passwordChangeOtpRepository.save(PasswordChangeOtp.builder()
                .email(email)
                .otpCode(otpCode)
                .createdAt(now)
                .expiresAt(now.plusMinutes(5))
                .used(false)
                .build());

        emailService.sendOtp(user.getEmail(), otpCode);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        changePassword(email, currentPassword, newPassword, null);
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword, String otpCode) {
        User user = userRepository.findForUpdateByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản"));
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new org.springframework.security.authentication.BadCredentialsException("Mật khẩu hiện tại không đúng");
        }

        if (otpCode != null && !otpCode.isBlank()) {
            PasswordChangeOtp otpRecord = passwordChangeOtpRepository.findByEmailAndOtpCodeAndUsedFalse(email, otpCode)
                    .orElseThrow(() -> new BadCredentialsException("Mã OTP không đúng hoặc đã hết hạn"));
            if (otpRecord.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new BadCredentialsException("Mã OTP đã hết hạn, vui lòng gửi lại mã mới");
            }
            otpRecord.setUsed(true);
            passwordChangeOtpRepository.save(otpRecord);
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        events.publishEvent(ReaderEmail.passwordChanged(user.getEmail()));
    }

    public User register(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        Role userRole = roleRepository.findByName(RoleName.ROLE_USER)
                .orElseGet(() -> roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build()));

        User user = User.builder()
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .fullName(registerRequest.getFullName())
                .phone(registerRequest.getPhone())
                .address(registerRequest.getAddress())
                .roles(Collections.singleton(userRole))
                .build();

        return userRepository.save(user);
    }
}
