package com.example.library.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String toEmail, String otpCode) {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình Gmail SMTP. Thiết lập MAIL_USERNAME, MAIL_PASSWORD trước khi gửi OTP.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Mã OTP đổi mật khẩu thư viện Mộc");
        message.setText("Mã OTP đổi mật khẩu của bạn là: " + otpCode + "\n\nMã này có hiệu lực trong 5 phút. Không chia sẻ cho người khác.");
        mailSender.send(message);
    }

    public void sendPaymentSuccess(String toEmail, String loanId, String amount, String method) {
        if (fromEmail == null || fromEmail.isBlank()) {
            throw new IllegalStateException("Chưa cấu hình Gmail SMTP. Thiết lập MAIL_USERNAME, MAIL_PASSWORD trước khi gửi xác nhận thanh toán.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Xác nhận thanh toán thành công - Thư viện Mộc");
        message.setText("Thanh toán thành công!\n\n"
                + "- Phương thức: " + method + "\n"
                + "- Mã phiếu mượn: " + loanId + "\n"
                + "- Số tiền: " + amount + "\n\n"
                + "Bạn có thể xem chi tiết tại hệ thống thư viện Mộc.\n"
                + "Cảm ơn bạn đã sử dụng dịch vụ.");
        mailSender.send(message);
    }
}
