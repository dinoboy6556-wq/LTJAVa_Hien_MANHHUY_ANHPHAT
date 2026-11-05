package com.example.library.repository;

import com.example.library.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface LoanItemRepository extends JpaRepository<LoanItem, Long> {
    @Query("select i from LoanItem i where i.book.id = :id and i.loan.status <> com.example.library.entity.LoanStatus.RETURNED and i.returnedAt is null and i.copy is null order by i.id")
    List<LoanItem> findLegacyActive(@Param("id") Long bookId);
    @org.springframework.data.jpa.repository.Query("select i.book.id, sum(i.quantity) from LoanItem i group by i.book.id")
    java.util.List<Object[]> borrowTotals();
}
