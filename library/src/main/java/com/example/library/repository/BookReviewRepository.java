package com.example.library.repository;

import com.example.library.entity.BookReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookReviewRepository extends JpaRepository<BookReview, Long> {
    List<BookReview> findByBook_IdOrderByCreatedAtDesc(Long bookId);
    Optional<BookReview> findByBook_IdAndUser_Email(Long bookId, String email);
    @org.springframework.data.jpa.repository.Query("select r.book.id, avg(r.rating), count(r) from BookReview r group by r.book.id")
    java.util.List<Object[]> ratingTotals();
}
