package com.example.library.controller;

import com.example.library.entity.User;
import com.example.library.repository.UserRepository;
import com.example.library.exception.ResourceNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {
    private final UserRepository users;

    public ProfileController(UserRepository users) {
        this.users = users;
    }

    public record ProfileResponse(String fullName, String email, String phone, String address, String avatarData, java.util.List<String> roles) {}

    public record AvatarUpdate(@jakarta.validation.constraints.Size(max = 600_000) String avatarData) {}

    public record ProfileUpdate(
            @NotBlank @Size(max = 255) String fullName,
            @Size(max = 30) @Pattern(regexp = "^[0-9+() .-]*$") String phone,
            @Size(max = 255) String address) {}

    private User currentUser(Authentication authentication) {
        return users.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
    }

    private ProfileResponse response(User user) {
        return new ProfileResponse(user.getFullName(), user.getEmail(), user.getPhone(), user.getAddress(), user.getAvatarData(),
                user.getRoles().stream().map(role -> role.getName().name()).sorted().toList());
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ProfileResponse get(Authentication authentication) {
        return response(currentUser(authentication));
    }

    @PutMapping
    @Transactional
    public ProfileResponse update(Authentication authentication, @Valid @RequestBody ProfileUpdate request) {
        User user = currentUser(authentication);
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() == null ? "" : request.phone().trim());
        user.setAddress(request.address() == null ? "" : request.address().trim());
        return response(users.save(user));
    }

    @PutMapping("/avatar")
    @Transactional
    public ProfileResponse updateAvatar(Authentication authentication, @Valid @RequestBody AvatarUpdate request) {
        User user = currentUser(authentication);
        String avatarData = request == null ? null : request.avatarData();
        if (avatarData != null && !avatarData.isBlank() && !avatarData.startsWith("data:image/jpeg;base64,")) {
            throw new IllegalArgumentException("Ảnh đại diện không đúng định dạng. Vui lòng chọn ảnh JPG, PNG hoặc WebP.");
        }
        user.setAvatarData(avatarData == null || avatarData.isBlank() ? null : avatarData);
        return response(users.save(user));
    }
}
