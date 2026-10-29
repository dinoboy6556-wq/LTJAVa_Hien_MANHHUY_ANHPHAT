package com.example.library.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity @Table(name="borrow_payments",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","request_key"}))
@Getter @Setter @NoArgsConstructor
public class BorrowPayment {
 @Id @Column(length=32) private String id;
 @ManyToOne(optional=false) @JoinColumn(name="user_id") @com.fasterxml.jackson.annotation.JsonIgnore private User user;
 @Column(name="request_key",nullable=false,length=64) private String requestKey;
 @Column(nullable=false,precision=19,scale=2) private BigDecimal amount;
 @Column(nullable=false,length=30) private String status;
 @Column(nullable=false,columnDefinition="TEXT") @com.fasterxml.jackson.annotation.JsonIgnore private String requestJson;
 @Column(nullable=false) private LocalDateTime createdAt;
 @Column(nullable=false) private LocalDateTime expiresAt;
 @Column(nullable=false,length=20) private String method = "VNPAY";
 private String confirmedBy;
 private LocalDateTime confirmedAt;
 private Long loanId;
 private String transactionNo;
 @Column(length=1000) private String message;
 public String getPayerEmail(){return user.getEmail();}
}
