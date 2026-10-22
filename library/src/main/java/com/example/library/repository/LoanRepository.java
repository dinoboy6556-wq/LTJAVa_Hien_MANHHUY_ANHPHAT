package com.example.library.repository;

import com.example.library.entity.Loan;
import com.example.library.entity.LoanStatus;
import com.example.library.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByUser(User user);
    List<Loan> findByStatus(LoanStatus status);
}
