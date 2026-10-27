package com.example.library.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "book_copies", indexes = @Index(name = "idx_copy_book_status", columnList = "book_id,status"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookCopy {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 64)
    private String code;
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private BookCopyStatus status;
}
