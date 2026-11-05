package com.example.library.service;

import java.math.BigDecimal;

public final class RentalPricing {
    public static final int DAYS_PER_PERIOD = 14;

    private RentalPricing() {}

    public static int periodsFor(int days) {
        if (days < 1 || days > 365) throw new IllegalArgumentException("Thời hạn mượn phải từ 1 đến 365 ngày");
        return (days + DAYS_PER_PERIOD - 1) / DAYS_PER_PERIOD;
    }

    public static BigDecimal pricePerCopy(BigDecimal basePrice, int days) {
        return basePrice.multiply(BigDecimal.valueOf(periodsFor(days)));
    }
}
