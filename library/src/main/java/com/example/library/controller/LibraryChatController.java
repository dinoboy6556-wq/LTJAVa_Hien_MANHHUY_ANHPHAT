package com.example.library.controller;

import com.example.library.service.LibraryChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/library-chat")
public class LibraryChatController {
    public record Turn(@NotBlank @Pattern(regexp = "user|assistant") String role,
                       @NotBlank @Size(max = 1000) String content) {}
    public record ChatRequest(@NotBlank @Size(max = 500) String message,
                              @NotNull @Size(max = 6) List<@NotNull @Valid Turn> history) {}

    private final LibraryChatService chat;

    public LibraryChatController(LibraryChatService chat) {
        this.chat = chat;
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public org.springframework.http.ResponseEntity<?> status(org.springframework.web.server.ResponseStatusException error) {
        return org.springframework.http.ResponseEntity.status(error.getStatusCode())
                .body(java.util.Map.of("message", error.getReason()));
    }

    @PostMapping
    public LibraryChatService.Reply ask(Authentication user, @Valid @RequestBody ChatRequest request) {
        return chat.ask(user.getName(), request);
    }
}
