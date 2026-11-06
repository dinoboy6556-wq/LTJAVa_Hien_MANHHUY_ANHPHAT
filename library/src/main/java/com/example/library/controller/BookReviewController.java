package com.example.library.controller;

import com.example.library.entity.Book;
import com.example.library.entity.BookReview;
import com.example.library.entity.User;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import com.example.library.repository.BookReviewRepository;
import com.example.library.repository.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/books/{bookId}/reviews")
public class BookReviewController {
    private final BookReviewRepository reviews;
    private final BookRepository books;
    private final UserRepository users;
    private final com.example.library.service.BookParticipationService participation;
    public BookReviewController(BookReviewRepository reviews, BookRepository books, UserRepository users,
                                com.example.library.service.BookParticipationService participation) {
        this.reviews = reviews; this.books = books; this.users = users; this.participation = participation;
    }
    public record ReviewRequest(@Min(1) @Max(5) int rating, @Size(max = 1200) String comment) {}
    public record ReviewView(Long id, String reviewer, int rating, String comment, java.time.LocalDateTime createdAt) {}
    public record ReviewSummary(double average, long count, List<ReviewView> reviews) {}

    @GetMapping
    public ReviewSummary list(@PathVariable Long bookId) {
        if (!books.existsById(bookId)) throw new ResourceNotFoundException("Không tìm thấy sách");
        List<ReviewView> list = reviews.findByBook_IdOrderByCreatedAtDesc(bookId).stream()
                .map(r -> new ReviewView(r.getId(), r.getUser().getFullName(), r.getRating(), r.getComment(), r.getCreatedAt())).toList();
        double average = list.stream().mapToInt(ReviewView::rating).average().orElse(0);
        return new ReviewSummary(average, list.size(), list);
    }

    public record Eligibility(boolean canReview) {}

    @GetMapping("/eligibility")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public Eligibility eligibility(Authentication auth, @PathVariable Long bookId) {
        if (!books.existsById(bookId)) throw new ResourceNotFoundException("Không tìm thấy sách.");
        return new Eligibility(participation.canReview(auth.getName(), bookId));
    }

    @PutMapping
    @Transactional
    public ReviewView save(Authentication auth, @PathVariable Long bookId, @Valid @RequestBody ReviewRequest request) {
        User user = users.findByEmail(auth.getName()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        Book book = books.findById(bookId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách"));
        if (!participation.canReview(auth.getName(), bookId))
            throw new org.springframework.security.access.AccessDeniedException("Bạn cần mua, mượn hoặc xác nhận đã đọc sách điện tử này trước khi đánh giá. Bạn vẫn có thể đặt câu hỏi.");
        BookReview review = reviews.findByBook_IdAndUser_Email(bookId, auth.getName()).orElseGet(BookReview::new);
        review.setBook(book); review.setUser(user); review.setRating(request.rating());
        review.setComment(request.comment() == null ? "" : request.comment().trim());
        BookReview saved = reviews.save(review);
        return new ReviewView(saved.getId(), user.getFullName(), saved.getRating(), saved.getComment(), saved.getCreatedAt());
    }
}
