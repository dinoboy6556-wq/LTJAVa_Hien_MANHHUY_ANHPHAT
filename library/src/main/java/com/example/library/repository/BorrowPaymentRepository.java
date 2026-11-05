package com.example.library.repository;
import com.example.library.entity.BorrowPayment;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.*;
public interface BorrowPaymentRepository extends JpaRepository<BorrowPayment,String> {
 Optional<BorrowPayment> findByUser_IdAndRequestKey(Long id,String key);
 List<BorrowPayment> findByUser_EmailOrderByCreatedAtDesc(String email);
 List<BorrowPayment> findAllByOrderByCreatedAtDesc();
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select p from BorrowPayment p where p.id=:id")
 Optional<BorrowPayment> lock(@Param("id") String id);
}
