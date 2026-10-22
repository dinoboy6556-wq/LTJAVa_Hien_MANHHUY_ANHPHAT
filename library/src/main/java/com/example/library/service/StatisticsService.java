package com.example.library.service;

import com.example.library.dto.StatisticsSummaryDTO;
import com.example.library.entity.*;
import com.example.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class StatisticsService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private LoanRepository loanRepository;

    public StatisticsSummaryDTO getSummary() {
        long totalBooks = bookRepository.count();
        long outOfStockBooks = bookRepository.findByStatus(BookStatus.OUT_OF_STOCK).size();
        long totalUsers = userRepository.count();

        List<Sale> sales = saleRepository.findAll();
        long totalSales = sales.size();
        BigDecimal salesRev = sales.stream()
                .map(Sale::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Loan> loans = loanRepository.findAll();
        long activeLoans = loans.stream().filter(l -> l.getStatus() == LoanStatus.BORROWED).count();
        BigDecimal loansRev = loans.stream()
                .map(Loan::getRentalFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return StatisticsSummaryDTO.builder()
                .totalBooks(totalBooks)
                .outOfStockBooks(outOfStockBooks)
                .totalUsers(totalUsers)
                .totalSales(totalSales)
                .totalSalesRevenue(salesRev)
                .activeLoans(activeLoans)
                .totalLoansRevenue(loansRev)
                .build();
    }

    public List<Book> getOutOfStockBooks() {
        return bookRepository.findByStatus(BookStatus.OUT_OF_STOCK);
    }

    public List<Loan> getActiveLoans() {
        return loanRepository.findByStatus(LoanStatus.BORROWED);
    }
}
