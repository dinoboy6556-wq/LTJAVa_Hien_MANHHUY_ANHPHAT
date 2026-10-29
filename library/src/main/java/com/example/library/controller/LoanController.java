package com.example.library.controller;

import com.example.library.dto.LoanCreateRequest;
import com.example.library.dto.LoanReturnRequest;
import com.example.library.entity.Loan;
import com.example.library.service.LoanService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequestMapping("/api/v1/loans")
public class LoanController {
    @Autowired
    private LoanService loanService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<List<Loan>> getAllLoans() {
        return ResponseEntity.ok(loanService.getAllLoans());
    }

    @GetMapping("/my-loans")
    public ResponseEntity<List<Loan>> getMyLoans() {
        return ResponseEntity.ok(loanService.getMyLoans());
    }

    @PostMapping
    public ResponseEntity<Loan> createLoan(@Valid @RequestBody LoanCreateRequest request) {
        return ResponseEntity.ok(loanService.createLoan(request));
    }

    @PostMapping("/{id}/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Loan> returnLoan(@PathVariable Long id,
                                           @RequestBody(required = false) LoanReturnRequest request) {
        return ResponseEntity.ok(loanService.returnLoan(id, request));
    }

    @PostMapping("/{id}/renew")
    public ResponseEntity<Loan> renewLoan(@PathVariable Long id) {
        return ResponseEntity.ok(loanService.renewLoan(id));
    }
}
