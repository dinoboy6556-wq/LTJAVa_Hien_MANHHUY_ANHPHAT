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
 public Map<String,Object> resume(String id,String email){var p=checkout.ownedPayos(id,email);if(!java.util.List.of("PENDING","FAILED").contains(p.getStatus()))throw new IllegalStateException("Giao dịch đã xử lý, không thanh toán thêm");var remote=gateway.lookup(p);checkout.reconcilePayos(id,remote);String state=remote.path("status").asText();if(java.util.List.of("CANCELLED","EXPIRED").contains(state)&&remote.path("amountPaid").decimalValue().signum()==0){p=checkout.preparePayosRetry(email,id);}else if(!"PENDING".equals(state))throw new IllegalStateException("Ngân hàng đã nhận hoặc đang xử lý tiền. Kiểm tra trạng thái, không chuyển thêm.");return link(p,email); }
 private Map<String,Object> link(com.example.library.entity.BorrowPayment p,String email){var data=gateway.create(p);if(data.path("orderCode").asLong()!=gateway.orderCode(p)||data.path("amount").decimalValue().compareTo(p.getAmount())!=0)throw new IllegalArgumentException("Ngân hàng trả về giao dịch không khớp");if(!"PENDING".equals(data.path("status").asText())){sync(p.getId(),email);throw new IllegalStateException("Giao dịch đã xử lý. Hãy kiểm tra trạng thái thanh toán.");}return Map.of("id",p.getId(),"amount",p.getAmount(),"requestKey",p.getRequestKey(),"order",checkout.payosOrder(p.getId(),email),"url",gateway.checkoutUrl(data));}
 public void cancel(String id,String email){var p=checkout.ownedPayos(id,email);if("CANCELLED".equals(p.getStatus()))return;if(!java.util.List.of("PENDING","FAILED").contains(p.getStatus()))throw new IllegalStateException("Giao dịch đã nhận tiền hoặc cần đối soát; không thể hủy yêu cầu");var data=gateway.lookup(p);checkout.reconcilePayos(id,data);String state=data.path("status").asText();if(data.path("amountPaid").decimalValue().signum()>0||"PAID".equals(state))throw new IllegalStateException("Đã có tiền chuyển vào, cần đối soát trước khi đổi phương thức");if("PENDING".equals(state)){data=gateway.cancel(p);checkout.reconcilePayos(id,data);state=data.path("status").asText();}if(!java.util.List.of("CANCELLED","EXPIRED").contains(state)||data.path("amountPaid").decimalValue().signum()>0)throw new IllegalStateException("Ngân hàng chưa xác nhận hủy; vui lòng kiểm tra lại trạng thái");checkout.abandonPayos(id,email);}
 public void sync(String id,String email){var p=checkout.ownedPayos(id,email);if(!"PAID".equals(p.getStatus())&&!"REVIEW_REQUIRED".equals(p.getStatus()))checkout.reconcilePayos(id,gateway.lookup(p));}
 public void webhook(JsonNode body){var data=gateway.verified(body);if(!"00".equals(data.path("code").asText())||!"VND".equals(data.path("currency").asText())||!data.path("orderCode").isIntegralNumber())throw new IllegalArgumentException("Dữ liệu chuyển khoản không hợp lệ");var p=payments.findById("PO"+data.path("orderCode").asLong());if(p.isEmpty())return; // payOS sends a signed example when registering the webhook.
  if(!"PAYOS".equals(p.get().getMethod()))throw new IllegalArgumentException("Giao dịch không hợp lệ");
  // Re-fetch signed provider state to handle partial transfers and duplicated callbacks consistently.
  checkout.reconcilePayos(p.get().getId(),gateway.lookup(p.get()));
 }
}
