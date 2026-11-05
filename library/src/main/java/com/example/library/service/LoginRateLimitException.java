package com.example.library.service;

public class LoginRateLimitException extends RuntimeException {
    public LoginRateLimitException() { super("Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút."); }
}
