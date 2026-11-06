package com.example.library.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "book_readings", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "book_id"}))
@Getter @Setter
public class BookReading {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional = false) @JoinColumn(name = "user_id", nullable = false) private User user;
    @ManyToOne(optional = false) @JoinColumn(name = "book_id", nullable = false) private Book book;
    @Column(nullable = false) private LocalDateTime readAt = LocalDateTime.now();
}
