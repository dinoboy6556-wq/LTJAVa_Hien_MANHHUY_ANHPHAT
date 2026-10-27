package com.example.library.repository;

import com.example.library.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUser_EmailOrderByCreatedAtDesc(String email);
    boolean existsByUser_EmailAndBook_Id(String email, Long bookId);
    void deleteByUser_EmailAndBook_Id(String email, Long bookId);
}
