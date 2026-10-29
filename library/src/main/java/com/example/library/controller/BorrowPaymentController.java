package com.example.library.controller;
import com.example.library.dto.LoanCreateRequest;
import com.example.library.entity.BorrowPayment;
import com.example.library.repository.BorrowPaymentRepository;
import com.example.library.service.BorrowCheckoutService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.validation.Valid;
import java.util.*;
@RestController @RequestMapping("/api/v1/payments")
public class BorrowPaymentController {
 private final BorrowCheckoutService service;private final BorrowPaymentRepository payments;
 public BorrowPaymentController(BorrowCheckoutService service,BorrowPaymentRepository payments){this.service=service;this.payments=payments;}
 @PostMapping("/checkout") public Map<String,Object> checkout(Authentication auth,@Valid @RequestBody LoanCreateRequest request,@RequestHeader("Idempotency-Key") String key,jakarta.servlet.http.HttpServletRequest http){return service.checkout(auth.getName(),request,key,http.getRemoteAddr());}
 @PostMapping("/cash") public Map<String,Object> cash(Authentication auth,@Valid @RequestBody LoanCreateRequest request,@RequestHeader("Idempotency-Key") String key){return service.cashCheckout(auth.getName(),request,key);}
 @PostMapping("/{id}/confirm-cash") @PreAuthorize("hasRole('ADMIN')") public BorrowPayment confirmCash(@PathVariable String id,Authentication auth){return service.confirmCash(id,auth.getName());}
 @GetMapping("/my") public List<BorrowPayment> mine(Authentication auth){return payments.findByUser_EmailOrderByCreatedAtDesc(auth.getName());}
 @GetMapping @PreAuthorize("hasRole('ADMIN')") public List<BorrowPayment> all(){return payments.findAllByOrderByCreatedAtDesc();}
 @GetMapping("/vnpay/ipn") public Map<String,String> ipn(jakarta.servlet.http.HttpServletRequest request){
  Map<String,String> params=new TreeMap<>();for(var e:request.getParameterMap().entrySet()){if(e.getValue().length!=1)return Map.of("RspCode","97","Message","Ambiguous parameters");params.put(e.getKey(),e.getValue()[0]);}return service.ipn(params);
 }
}
