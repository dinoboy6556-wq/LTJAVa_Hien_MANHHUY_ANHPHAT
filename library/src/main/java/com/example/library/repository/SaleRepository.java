package com.example.library.repository;

import com.example.library.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    @Query("select count(s) > 0 from Sale s join s.items i where s.user.email = :email and i.book.id = :bookId")
    boolean hasBookActivity(@org.springframework.data.repository.query.Param("email") String email, @org.springframework.data.repository.query.Param("bookId") Long bookId);

    @Query("SELECT COALESCE(SUM(s.totalAmount), 0) FROM Sale s")
    BigDecimal calculateTotalRevenue();
}
