package com.example.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class StatisticsSummaryDTO {
    private long totalBooks;
    private long outOfStockBooks;
    private long totalUsers;
    private long totalSales;
    private BigDecimal totalSalesRevenue;
    private long activeLoans;
    private BigDecimal totalLoansRevenue;
}
