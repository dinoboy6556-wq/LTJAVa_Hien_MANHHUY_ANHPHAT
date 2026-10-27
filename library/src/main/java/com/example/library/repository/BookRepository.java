package com.example.library.repository;

import com.example.library.entity.Book;
import com.example.library.entity.BookStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BookRepository extends JpaRepository<Book, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Book> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.id = :id")
    java.util.Optional<Book> findForUpdate(@Param("id") Long id);

    List<Book> findByStatus(BookStatus status);
    List<Book> findByAvailableQuantityEquals(Integer quantity);

    @Query("SELECT COUNT(b) FROM Book b WHERE b.status = :status")
    long countByBookStatus(@Param("status") BookStatus status);

    @Query("SELECT b FROM Book b LEFT JOIN FETCH b.category LEFT JOIN FETCH b.author LEFT JOIN FETCH b.publisher WHERE b.status = :status")
    List<Book> findBooksByStatusWithDetails(@Param("status") BookStatus status);
}
