package com.example.library.repository;

import com.example.library.entity.BookQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookQuestionRepository extends JpaRepository<BookQuestion, Long> {
    List<BookQuestion> findByBook_IdOrderByCreatedAtDescIdDesc(Long bookId);
}
