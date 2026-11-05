package com.example.library.service;
import com.example.library.dto.LoanCreateRequest;
import com.example.library.repository.BorrowPaymentRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;
import java.util.Map;
@Service
public class PayosPaymentService {
 private final BorrowCheckoutService checkout;private final PayosGateway gateway;private final BorrowPaymentRepository payments;
 public PayosPaymentService(BorrowCheckoutService checkout,PayosGateway gateway,BorrowPaymentRepository payments){this.checkout=checkout;this.gateway=gateway;this.payments=payments;}
 // Local order commits before HTTP: retries reuse the same order even after a timeout.
 public Map<String,Object> create(String email,LoanCreateRequest request,String key){gateway.requireConfigured();var p=checkout.preparePayos(email,request,key);return link(p,email);}
 public Map<String,Object> resume(String id,String email){var p=checkout.ownedPayos(id,email);if(!"PENDING".equals(p.getStatus()))throw new IllegalStateException("Giao dịch đã xử lý");return link(p,email);}
 private Map<String,Object> link(com.example.library.entity.BorrowPayment p,String email){var data=gateway.create(p);if(data.path("orderCode").asLong()!=gateway.orderCode(p)||data.path("amount").decimalValue().compareTo(p.getAmount())!=0)throw new IllegalArgumentException("Ngân hàng trả về giao dịch không khớp");if(!"PENDING".equals(data.path("status").asText())){sync(p.getId(),email);throw new IllegalStateException("Giao dịch đã xử lý. Hãy kiểm tra trạng thái thanh toán.");}return Map.of("id",p.getId(),"amount",p.getAmount(),"url",gateway.checkoutUrl(data));}
 public void sync(String id,String email){var p=checkout.ownedPayos(id,email);if(!"PAID".equals(p.getStatus())&&!"REVIEW_REQUIRED".equals(p.getStatus()))checkout.reconcilePayos(id,gateway.lookup(p));}
 public void webhook(JsonNode body){var data=gateway.verified(body);if(!"00".equals(data.path("code").asText())||!"VND".equals(data.path("currency").asText())||!data.path("orderCode").isIntegralNumber())throw new IllegalArgumentException("Dữ liệu chuyển khoản không hợp lệ");var p=payments.findById("PO"+data.path("orderCode").asLong());if(p.isEmpty())return; // payOS sends a signed example when registering the webhook.
  if(!"PAYOS".equals(p.get().getMethod()))throw new IllegalArgumentException("Giao dịch không hợp lệ");
  // Re-fetch signed provider state to handle partial transfers and duplicated callbacks consistently.
  checkout.reconcilePayos(p.get().getId(),gateway.lookup(p.get()));
 }
}
