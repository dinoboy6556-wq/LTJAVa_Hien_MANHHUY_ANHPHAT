package com.example.library.controller;

import com.example.library.dto.BookCreateRequest;
import com.example.library.entity.Book;
import com.example.library.service.BookService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks() {
        return ResponseEntity.ok(bookService.getAllBooks());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return ResponseEntity.ok(bookService.getBookById(id));
    }

    @GetMapping("/{id}/related")
    public ResponseEntity<List<Book>> getRelatedBooks(@PathVariable Long id) {
        Book source = bookService.getBookById(id);
        List<Book> related = bookService.getAllBooks().stream()
                .filter(book -> !book.getId().equals(id))
                .filter(book -> source.getCategory() != null && book.getCategory() != null
                        && source.getCategory().getId().equals(book.getCategory().getId()))
                .limit(6).toList();
        return ResponseEntity.ok(related);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @Valid @RequestBody BookCreateRequest req) {
        return ResponseEntity.ok(bookService.updateBook(id, req));
    }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Book> createBook(@Valid @RequestBody BookCreateRequest req) {
        return ResponseEntity.ok(bookService.createBook(req));
    }
}
