package com.example.library.repository;

import com.example.library.entity.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookCopyRepository extends JpaRepository<BookCopy, Long> {
    List<BookCopy> findByBookIdOrderByIdAsc(Long bookId);
    List<BookCopy> findByBookIdAndStatusOrderByIdAsc(Long bookId, BookCopyStatus status);
    long countByBookId(Long bookId);
    long countByBookIdAndStatus(Long bookId, BookCopyStatus status);
}
