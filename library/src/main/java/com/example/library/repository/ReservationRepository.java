package com.example.library.repository;
import com.example.library.entity.Reservation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ReservationRepository extends JpaRepository<Reservation,Long> {
 List<Reservation> findByUser_EmailOrderByCreatedAtAsc(String email);
 Optional<Reservation> findByUser_EmailAndBook_Id(String email,Long bookId);
}
