package com.example.library.controller;
import com.example.library.entity.*;
import com.example.library.repository.*;
import com.example.library.exception.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api/v1/reservations")
public class ReservationController {
 private final ReservationRepository reservations; private final UserRepository users; private final BookRepository books;
 public ReservationController(ReservationRepository reservations,UserRepository users,BookRepository books){this.reservations=reservations;this.users=users;this.books=books;}
 @GetMapping public List<Reservation> list(Authentication auth){return reservations.findByUser_EmailOrderByCreatedAtAsc(auth.getName());}
 @PutMapping("/{bookId}") @Transactional
 public Reservation reserve(Authentication auth,@PathVariable Long bookId){
  User user=users.findForUpdateByEmail(auth.getName()).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy tài khoản"));
  var existing=reservations.findByUser_EmailAndBook_Id(auth.getName(),bookId);if(existing.isPresent())return existing.get();
  Book book=books.findForUpdate(bookId).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy sách"));
  if(book.getAvailableQuantity()>0)throw new IllegalStateException("Sách đang có sẵn, bạn có thể mượn trực tiếp");
  Reservation reservation=new Reservation();reservation.setUser(user);reservation.setBook(book);reservation.setCreatedAt(java.time.LocalDateTime.now());
  return reservations.save(reservation);
 }
 @DeleteMapping("/{bookId}") @Transactional
 public void cancel(Authentication auth,@PathVariable Long bookId){
  users.findForUpdateByEmail(auth.getName()).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy tài khoản"));
  reservations.findByUser_EmailAndBook_Id(auth.getName(),bookId).ifPresent(reservations::delete);
 }
}
