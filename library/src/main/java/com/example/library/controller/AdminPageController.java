package com.example.library.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.access.prepost.PreAuthorize;
@Controller
public class AdminPageController {
    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public String dashboard() { return "admin/dashboard"; }
}
