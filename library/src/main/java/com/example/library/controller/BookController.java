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

    @Autowired private com.example.library.service.CatalogService catalog;
    @GetMapping("/catalog")
    public org.springframework.data.domain.Page<Book> catalog(@RequestParam(defaultValue="") String q,@RequestParam(defaultValue="") String author,@RequestParam(defaultValue="") String category,@RequestParam(required=false) java.math.BigDecimal min,@RequestParam(required=false) java.math.BigDecimal max,@RequestParam(defaultValue="") String status,@RequestParam(defaultValue="title") String sort,@RequestParam(defaultValue="0") int page){return catalog.search(q,author,category,min,max,status,sort,page);}

    @Autowired private com.example.library.service.HomeSelectionService homeSelections;
    @GetMapping("/home-selections")
    public com.example.library.service.HomeSelectionService.Selection homeSelections(){return homeSelections.get();}

    @Autowired private com.example.library.repository.BookReviewRepository bookReviews;
    @GetMapping("/ratings")
    public java.util.Map<Long, RatingSummary> ratings() {
        return bookReviews.ratingTotals().stream().collect(java.util.stream.Collectors.toMap(
                row -> ((Number) row[0]).longValue(),
                row -> new RatingSummary(((Number) row[1]).doubleValue(), ((Number) row[2]).longValue())
        ));
    }
    public record RatingSummary(double average, long count) {}

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
    @Autowired private com.example.library.service.DeletionService deletion;
    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<Void> delete(@PathVariable Long id){deletion.deleteBook(id);return ResponseEntity.noContent().build();}
}
