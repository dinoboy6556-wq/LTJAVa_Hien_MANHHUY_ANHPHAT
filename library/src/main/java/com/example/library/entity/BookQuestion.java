package com.example.library.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_questions")
@Getter @Setter
public class BookQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(optional = false) @JoinColumn(name = "book_id", nullable = false) private Book book;
    @Column(nullable = false, length = 1200) private String question;
    @Column(length = 1200) private String answer;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime answeredAt;
}
