package com.example.library.entity;
import jakarta.persistence.*;import lombok.*;
@Entity @Table(name="library_content") @Getter @Setter @NoArgsConstructor
public class LibraryContent {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=20) private String kind;
 @Column(nullable=false) private String title;
 @Column(nullable=false,unique=true,length=120) private String slug;
 @Column(columnDefinition="LONGTEXT") private String body;
 @Column(length=500) private String link;
 private Long bookId;
 @Column(nullable=false) private boolean published;
 @Column(nullable=false) private int sortOrder;
}
