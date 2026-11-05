package com.example.library.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="reservations",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","book_id"}))
@Getter @Setter @NoArgsConstructor
public class Reservation {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @com.fasterxml.jackson.annotation.JsonIgnore @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
 @ManyToOne(optional=false) @JoinColumn(name="book_id") private Book book;
 @Column(nullable=false) private LocalDateTime createdAt;
}
