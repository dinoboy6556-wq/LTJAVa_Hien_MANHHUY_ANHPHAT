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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class StatisticsService {
    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final SaleRepository saleRepository;
    private final LoanRepository loanRepository;

    public StatisticsService(BookRepository bookRepository, UserRepository userRepository,
                             SaleRepository saleRepository, LoanRepository loanRepository) {
        this.bookRepository = bookRepository;
        this.userRepository = userRepository;
        this.saleRepository = saleRepository;
        this.loanRepository = loanRepository;
    }

    @Transactional(readOnly = true)
    public StatisticsSummaryDTO getSummary() {
        long totalBooks = bookRepository.count();
        long outOfStockBooks = bookRepository.countByBookStatus(BookStatus.OUT_OF_STOCK);
        long totalUsers = userRepository.count();
        long totalSales = saleRepository.count();
        BigDecimal salesRevenue = saleRepository.calculateTotalRevenue();
        long activeLoans = loanRepository.countByStatus(LoanStatus.BORROWED);
        BigDecimal rentalRevenue = loanRepository.calculateTotalRentalRevenue();

        return StatisticsSummaryDTO.builder()
                .totalBooks(totalBooks)
                .outOfStockBooks(outOfStockBooks)
                .totalUsers(totalUsers)
                .totalSales(totalSales)
                .totalSalesRevenue(salesRevenue == null ? BigDecimal.ZERO : salesRevenue)
                .activeLoans(activeLoans)
                .totalLoansRevenue(rentalRevenue == null ? BigDecimal.ZERO : rentalRevenue)
                .build();
    }

    @Transactional(readOnly = true)
    public List<Book> getOutOfStockBooks() {
        return bookRepository.findBooksByStatusWithDetails(BookStatus.OUT_OF_STOCK);
    }

    @Transactional(readOnly = true)
    public List<Loan> getActiveLoans() {
        return loanRepository.findLoansByStatusWithDetails(LoanStatus.BORROWED);
    }
}
