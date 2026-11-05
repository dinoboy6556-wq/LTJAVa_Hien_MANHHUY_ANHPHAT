package com.example.library.controller;

import com.example.library.entity.*;
import com.example.library.service.BookCopyService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/books/{bookId}/copies")
public class BookCopyController {
    private final BookCopyService copies;
    public BookCopyController(BookCopyService copies) { this.copies = copies; }
    public record AddCopies(@Min(1) @Max(1000) int quantity) {}
    public record ChangeStatus(@NotNull BookCopyStatus status) {}
    @GetMapping
    public List<BookCopy> list(@PathVariable Long bookId) { return copies.list(bookId); }
    @GetMapping("/{copyId}/history")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public List<CopyEvent> history(@PathVariable Long bookId, @PathVariable Long copyId) { return copies.history(bookId, copyId); }
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public List<BookCopy> add(@PathVariable Long bookId, @Valid @RequestBody AddCopies request) {
        return copies.add(bookId, request.quantity());
    }
    @PatchMapping("/{copyId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public BookCopy reconcile(@PathVariable Long bookId, @PathVariable Long copyId, @Valid @RequestBody ChangeStatus request) {
        return copies.reconcile(bookId, copyId, request.status());
    }
}
