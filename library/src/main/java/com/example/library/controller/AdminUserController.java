package com.example.library.controller;

import com.example.library.entity.Role;
import com.example.library.entity.RoleName;
import com.example.library.entity.User;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.RoleRepository;
import com.example.library.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final UserRepository users;
    private final RoleRepository roles;
    public AdminUserController(UserRepository users, RoleRepository roles) { this.users = users; this.roles = roles; }

    public record UserView(Long id, String email, String fullName, String phone, String address,
                           boolean enabled, Set<String> roles) {}
    public record UserUpdate(Boolean enabled, @NotEmpty Set<RoleName> roles) {}

    private UserView view(User user) {
        return new UserView(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(), user.getAddress(),
                user.isEnabled(), user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()));
    }

    @GetMapping
    public List<UserView> list() { return users.findAll().stream().map(this::view).toList(); }

    @PutMapping("/{id}")
    @Transactional
    public UserView update(@PathVariable Long id, @Valid @RequestBody UserUpdate request, Authentication auth) {
        User user = users.findForUpdateById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        if (user.getEmail().equals(auth.getName()) && (Boolean.FALSE.equals(request.enabled()) || !request.roles().contains(RoleName.ROLE_ADMIN)))
            throw new IllegalArgumentException("Không thể tự khóa hoặc gỡ quyền quản trị của chính mình");
        boolean admin = user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ROLE_ADMIN);
        if (admin && (Boolean.FALSE.equals(request.enabled()) || !request.roles().contains(RoleName.ROLE_ADMIN)))
            throw new IllegalArgumentException("Không thể khóa hoặc gỡ quyền của tài khoản quản trị");
        if (request.roles().contains(RoleName.ROLE_ADMIN) && (Boolean.FALSE.equals(request.enabled()) || (request.enabled() == null && !user.isEnabled())))
            throw new IllegalArgumentException("Tài khoản quản trị phải ở trạng thái hoạt động");
        if (request.enabled() != null) user.setEnabled(request.enabled());
        Set<Role> resolved = request.roles().stream().map(name -> roles.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + name))).collect(Collectors.toSet());
        user.setRoles(resolved);
        return view(users.save(user));
    }
    public record StatusUpdate(@jakarta.validation.constraints.NotNull Boolean enabled) {}

    @PatchMapping("/{id}/status")
    @Transactional
    public UserView setStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdate request) {
        User user = users.findForUpdateById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        if (!request.enabled() && user.getRoles().stream().anyMatch(role -> role.getName() == RoleName.ROLE_ADMIN))
            throw new IllegalArgumentException("Không thể khóa tài khoản quản trị");
        user.setEnabled(request.enabled());
        return view(users.save(user));
    }

}
