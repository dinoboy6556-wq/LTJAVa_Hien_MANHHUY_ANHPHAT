package com.example.library.repository;

import com.example.library.entity.Loan;
import com.example.library.entity.LoanStatus;
import com.example.library.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUser(User user);
    List<Loan> findByStatus(LoanStatus status);
    long countByStatus(LoanStatus status);

    @Query("SELECT COALESCE(SUM(l.rentalFee), 0) FROM Loan l")
    BigDecimal calculateTotalRentalRevenue();

    @Query("SELECT DISTINCT l FROM Loan l JOIN FETCH l.user LEFT JOIN FETCH l.items WHERE l.status = :status")
    List<Loan> findLoansByStatusWithDetails(@Param("status") LoanStatus status);
}
