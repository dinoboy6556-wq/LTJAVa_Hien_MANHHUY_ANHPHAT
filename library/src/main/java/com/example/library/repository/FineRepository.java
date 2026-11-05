package com.example.library.repository;

import com.example.library.entity.Fine;
import com.example.library.entity.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FineRepository extends JpaRepository<Fine, Long> {
    List<Fine> findByLoan(Loan loan);
    List<Fine> findByLoan_User_EmailOrderByCreatedAtDesc(String email);
}
