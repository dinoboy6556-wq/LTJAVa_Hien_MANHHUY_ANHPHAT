package com.example.library.repository;

import com.example.library.entity.Book;
import com.example.library.entity.BookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByStatus(BookStatus status);
}
