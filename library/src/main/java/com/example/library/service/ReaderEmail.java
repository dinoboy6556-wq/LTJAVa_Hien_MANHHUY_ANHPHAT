package com.example.library.service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

public record ReaderEmail(String recipient, String subject, String body) {
    static ReaderEmail paymentConfirmed(String recipient, String reference, BigDecimal amount, Long loanId) {
        String total = NumberFormat.getCurrencyInstance(Locale.forLanguageTag("vi-VN")).format(amount);
        return new ReaderEmail(recipient, "Mộc Library | Chuyển khoản thành công", """
                Thư viện Mộc đã xác nhận thanh toán phí mượn sách.
                Mã giao dịch: %s
                Số tiền: %s
                Mã phiếu mượn: #%s

                Bạn có thể xem hạn trả trong mục Sách đang mượn.
                """.formatted(reference, total, loanId));
    }

    static ReaderEmail passwordChanged(String recipient) {
        return new ReaderEmail(recipient, "Mộc Library | Mật khẩu đã được thay đổi", """
                Mật khẩu tài khoản của bạn tại Thư viện Mộc vừa được thay đổi thành công.

                Nếu bạn không thực hiện thay đổi này, hãy liên hệ thư viện để được hỗ trợ.
                """);
    }
}
