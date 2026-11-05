package com.example.library.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_reviews", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "book_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(optional = false, fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(optional = false) @JoinColumn(name = "book_id", nullable = false)
    private Book book;
    @Column(nullable = false)
    private int rating;
    @Column(length = 1200)
    private String comment;
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = LocalDateTime.now(); }
}
