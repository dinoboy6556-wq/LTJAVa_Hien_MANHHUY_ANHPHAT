package com.example.library.controller;

import com.example.library.entity.BookQuestion;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/books/{bookId}/questions")
@Transactional(readOnly = true)
public class BookQuestionController {
    public record QuestionInput(@NotBlank @Size(max = 1200) String question) {}
    public record AnswerInput(@NotBlank @Size(max = 1200) String answer) {}
    public record View(Long id, String reader, String question, String answer, LocalDateTime createdAt, LocalDateTime answeredAt) {}
    private final BookQuestionRepository questions;
    private final BookRepository books;
    private final UserRepository users;

    public BookQuestionController(BookQuestionRepository questions, BookRepository books, UserRepository users) {
        this.questions = questions; this.books = books; this.users = users;
    }

    @GetMapping
    public List<View> list(@PathVariable Long bookId) {
        if (!books.existsById(bookId)) throw new ResourceNotFoundException("Không tìm thấy sách.");
        return questions.findByBook_IdOrderByCreatedAtDescIdDesc(bookId).stream().map(this::view).toList();
    }

    @PostMapping @Transactional
    public View ask(@PathVariable Long bookId, Authentication auth, @Valid @RequestBody QuestionInput input) {
        var question = new BookQuestion();
        question.setBook(books.findById(bookId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách.")));
        question.setUser(users.findByEmail(auth.getName()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản.")));
        question.setQuestion(input.question().trim());
        return view(questions.save(question));
    }

    @PutMapping("/{id}/answer") @Transactional
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public View answer(@PathVariable Long bookId, @PathVariable Long id, @Valid @RequestBody AnswerInput input) {
        var question = questions.findById(id).filter(value -> value.getBook().getId().equals(bookId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy câu hỏi."));
        question.setAnswer(input.answer().trim());
        question.setAnsweredAt(LocalDateTime.now());
        return view(question);
    }

    private View view(BookQuestion question) {
        return new View(question.getId(), question.getUser().getFullName(), question.getQuestion(),
                question.getAnswer(), question.getCreatedAt(), question.getAnsweredAt());
    }
}
