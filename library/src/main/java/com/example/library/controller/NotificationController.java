package com.example.library.controller;
import com.example.library.entity.*;
import com.example.library.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;
@RestController @RequestMapping("/api/v1/notifications")
public class NotificationController {
 private final LoanRepository loans;private final UserRepository users;private final ReservationRepository reservations;
 public NotificationController(LoanRepository loans,UserRepository users,ReservationRepository reservations){this.loans=loans;this.users=users;this.reservations=reservations;}
 public record Notice(String type,String message,String href){}
 @GetMapping @Transactional(readOnly=true)
 public List<Notice> list(Authentication auth){
  var user=users.findByEmail(auth.getName()).orElseThrow();List<Notice> result=new ArrayList<>();
  for(Loan loan:loans.findByUser(user)){
   if(loan.getStatus()==LoanStatus.RETURNED)continue;
   long days=ChronoUnit.DAYS.between(LocalDate.now(),loan.getDueDate());
   if(days<=3)result.add(new Notice(days<0?"OVERDUE":"DUE_SOON","Phiếu #"+loan.getId()+(days<0?" quá hạn "+(-days)+" ngày":days==0?" đến hạn trả hôm nay":" còn "+days+" ngày đến hạn trả"),"/user/borrowed"));
  }
  for(Reservation r:reservations.findByUser_EmailOrderByCreatedAtAsc(auth.getName()))
   if(r.getBook().getAvailableQuantity()>0)result.add(new Notice("BOOK_AVAILABLE","Sách đã có lại: "+r.getBook().getTitle()+". Bạn có thể vào mượn; sách chưa được giữ riêng.","/user/books/"+r.getBook().getId()));
  return result;
 }
}
