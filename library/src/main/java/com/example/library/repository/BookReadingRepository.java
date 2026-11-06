package com.example.library.repository;

import com.example.library.entity.BookReading;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookReadingRepository extends JpaRepository<BookReading, Long> {
    boolean existsByUser_IdAndBook_Id(Long userId, Long bookId);
}
