package com.example.library.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "loans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Loan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "borrow_date", nullable = false)
    private LocalDate borrowDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Column(name = "rental_fee", nullable = false)
    private BigDecimal rentalFee;

    @Column(name = "fine_amount")
    private BigDecimal fineAmount;

    @Column(name = "renewal_count", nullable = false)
    @Builder.Default
    private Integer renewalCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanStatus status;

    @OneToMany(mappedBy = "loan", cascade = CascadeType.ALL)
    @Builder.Default
    private List<LoanItem> items = new ArrayList<>();
}
