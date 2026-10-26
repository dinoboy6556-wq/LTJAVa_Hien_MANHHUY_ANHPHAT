package com.example.library.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "loan_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoanItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "loan_id", nullable = false)
    private Loan loan;

    @ManyToOne
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @ManyToOne
    @JoinColumn(name = "book_copy_id")
    private BookCopy copy;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "rental_price", nullable = false)
    private BigDecimal rentalPrice;
}
