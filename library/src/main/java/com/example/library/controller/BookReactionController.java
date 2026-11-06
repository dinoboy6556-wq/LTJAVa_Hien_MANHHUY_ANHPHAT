package com.example.library.controller;

import com.example.library.entity.BookReaction;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookReactionRepository;
import com.example.library.repository.BookRepository;
import com.example.library.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/books/{bookId}/reactions")
public class BookReactionController {
    private final BookReactionRepository reactions;
    private final BookRepository books;
    private final UserRepository users;

    public BookReactionController(BookReactionRepository reactions, BookRepository books, UserRepository users) {
        this.reactions = reactions; this.books = books; this.users = users;
    }

    public record ReactionSummary(long likes, long dislikes, String mine) {}
    public record ReactionRequest(String reaction) {}

    @GetMapping
    public ReactionSummary summary(@PathVariable Long bookId, Authentication auth) {
        if (!books.existsById(bookId)) throw new ResourceNotFoundException("Không tìm thấy sách");
        String mine = auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName()) ? null
                : reactions.findByBook_IdAndUser_Email(bookId, auth.getName()).map(BookReaction::getReaction).orElse(null);
        return new ReactionSummary(reactions.countByBook_IdAndReaction(bookId, "LIKE"),
                reactions.countByBook_IdAndReaction(bookId, "DISLIKE"), mine);
    }

    @PutMapping
    @Transactional
    public ReactionSummary react(Authentication auth, @PathVariable Long bookId, @RequestBody ReactionRequest request) {
        String value = request == null || request.reaction() == null ? "" : request.reaction().toUpperCase(Locale.ROOT);
        if (!value.equals("LIKE") && !value.equals("DISLIKE")) throw new IllegalArgumentException("Chọn thích hoặc không thích");
        var user = users.findForUpdateByEmail(auth.getName()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        var book = books.findById(bookId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách"));
        var existing = reactions.findByBook_IdAndUser_Email(bookId, auth.getName());
        if (existing.isPresent()) {
            if (existing.get().getReaction().equals(value)) reactions.delete(existing.get());
            else existing.get().setReaction(value);
        } else reactions.save(BookReaction.builder().book(book).user(user).reaction(value).build());
        return new ReactionSummary(reactions.countByBook_IdAndReaction(bookId, "LIKE"),
                reactions.countByBook_IdAndReaction(bookId, "DISLIKE"),
                reactions.findByBook_IdAndUser_Email(bookId, auth.getName()).map(BookReaction::getReaction).orElse(null));
    }
}
