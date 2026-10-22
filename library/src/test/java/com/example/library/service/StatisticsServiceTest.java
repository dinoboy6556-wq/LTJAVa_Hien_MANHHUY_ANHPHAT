package com.example.library.service;

import com.example.library.dto.StatisticsSummaryDTO;
import com.example.library.entity.Book;
import com.example.library.entity.BookStatus;
import com.example.library.entity.Loan;
import com.example.library.entity.LoanStatus;
import com.example.library.repository.BookRepository;
import com.example.library.repository.LoanRepository;
import com.example.library.repository.SaleRepository;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceTest {
    @Mock private BookRepository bookRepository;
    @Mock private UserRepository userRepository;
    @Mock private SaleRepository saleRepository;
    @Mock private LoanRepository loanRepository;
    @InjectMocks private StatisticsService statisticsService;

    @Test
    void summaryReturnsCountsAndRevenues() {
        when(bookRepository.count()).thenReturn(12L);
        when(bookRepository.countByBookStatus(BookStatus.OUT_OF_STOCK)).thenReturn(2L);
        when(userRepository.count()).thenReturn(7L);
        when(saleRepository.count()).thenReturn(4L);
        when(saleRepository.calculateTotalRevenue()).thenReturn(new BigDecimal("350000"));
        when(loanRepository.countByStatus(LoanStatus.BORROWED)).thenReturn(3L);
        when(loanRepository.calculateTotalRentalRevenue()).thenReturn(new BigDecimal("45000"));

        StatisticsSummaryDTO result = statisticsService.getSummary();

        assertEquals(12L, result.getTotalBooks());
        assertEquals(2L, result.getOutOfStockBooks());
        assertEquals(7L, result.getTotalUsers());
        assertEquals(4L, result.getTotalSales());
        assertEquals(new BigDecimal("350000"), result.getTotalSalesRevenue());
        assertEquals(3L, result.getActiveLoans());
        assertEquals(new BigDecimal("45000"), result.getTotalLoansRevenue());
    }

    @Test
    void outOfStockUsesRepositoryQuery() {
        when(bookRepository.findBooksByStatusWithDetails(BookStatus.OUT_OF_STOCK)).thenReturn(List.of(new Book()));
        assertEquals(1, statisticsService.getOutOfStockBooks().size());
        verify(bookRepository).findBooksByStatusWithDetails(BookStatus.OUT_OF_STOCK);
    }

    @Test
    void activeLoansUsesRepositoryQuery() {
        when(loanRepository.findLoansByStatusWithDetails(LoanStatus.BORROWED)).thenReturn(List.of(new Loan()));
        assertEquals(1, statisticsService.getActiveLoans().size());
        verify(loanRepository).findLoansByStatusWithDetails(LoanStatus.BORROWED);
    }
}
