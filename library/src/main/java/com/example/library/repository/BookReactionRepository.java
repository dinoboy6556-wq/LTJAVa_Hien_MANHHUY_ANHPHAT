package com.example.library.repository;

import com.example.library.entity.BookReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BookReactionRepository extends JpaRepository<BookReaction, Long> {
    long countByBook_IdAndReaction(Long bookId, String reaction);
    Optional<BookReaction> findByBook_IdAndUser_Email(Long bookId, String email);
}
