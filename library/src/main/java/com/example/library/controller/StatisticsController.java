package com.example.library.controller;

import com.example.library.dto.StatisticsSummaryDTO;
import com.example.library.entity.Book;
import com.example.library.entity.Loan;
import com.example.library.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/statistics")
@PreAuthorize("hasRole('ADMIN')")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @GetMapping("/summary")
    public ResponseEntity<StatisticsSummaryDTO> getSummary() {
        return ResponseEntity.ok(statisticsService.getSummary());
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Book>> getOutOfStockBooks() {
        return ResponseEntity.ok(statisticsService.getOutOfStockBooks());
    }

    @GetMapping("/customers-borrowing")
    public ResponseEntity<List<Loan>> getCustomersBorrowing() {
        return ResponseEntity.ok(statisticsService.getActiveLoans());
    }

    @GetMapping("/active-loans")
    public ResponseEntity<List<Loan>> getActiveLoans() {
        return ResponseEntity.ok(statisticsService.getActiveLoans());
    }
}
