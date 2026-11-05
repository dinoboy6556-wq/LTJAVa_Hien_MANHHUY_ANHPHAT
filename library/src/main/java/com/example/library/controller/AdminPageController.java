package com.example.library.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
@Controller
public class AdminPageController {
    @GetMapping("/admin/login")
    public String login() { return "admin/login"; }
    @GetMapping("/admin")
    public String dashboard() { return "admin/dashboard"; }
}
