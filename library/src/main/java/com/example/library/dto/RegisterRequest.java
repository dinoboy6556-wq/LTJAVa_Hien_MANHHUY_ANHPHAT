package com.example.library.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank @Email
    @jakarta.validation.constraints.Size(max=255)
    private String email;

    @NotBlank
    @jakarta.validation.constraints.Size(min=8,max=72)
    private String password;

    @NotBlank
    @jakarta.validation.constraints.Size(max=255)
    private String fullName;

    @jakarta.validation.constraints.Size(max=30) @jakarta.validation.constraints.Pattern(regexp="^[0-9+() .-]*$")
    private String phone;
    @jakarta.validation.constraints.Size(max=255)
    private String address;
}
