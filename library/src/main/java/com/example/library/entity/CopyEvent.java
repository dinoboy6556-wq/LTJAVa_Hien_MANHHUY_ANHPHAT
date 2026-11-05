package com.example.library.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
@Entity @Table(name="copy_events") @Getter @Setter @NoArgsConstructor
public class CopyEvent {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false) private Long copyId;
 @Column(nullable=false) private String action;
 private String previousStatus;
 @Column(nullable=false) private String newStatus;
 @Column(nullable=false) private String actor;
 @Column(nullable=false) private LocalDateTime createdAt;
}
