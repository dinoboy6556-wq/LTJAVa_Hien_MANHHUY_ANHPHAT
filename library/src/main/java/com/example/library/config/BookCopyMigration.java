package com.example.library.config;

import com.example.library.repository.BookRepository;
import com.example.library.service.BookCopyService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(100)
@ConditionalOnProperty(name = "app.book-copies.migrate", havingValue = "true")
public class BookCopyMigration implements CommandLineRunner {
    private final BookRepository books;
    private final BookCopyService copies;
    public BookCopyMigration(BookRepository books, BookCopyService copies) { this.books = books; this.copies = copies; }
    public void run(String... args) {
        books.findAll().stream().map(b -> b.getId()).sorted().forEach(copies::initialize);
    }
}
