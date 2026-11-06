package com.example.library.service;
import com.example.library.entity.*;
import com.example.library.dto.*;
import com.example.library.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.math.BigDecimal;
import java.time.*;
@Service
public class BorrowCheckoutService {
 private final BorrowPaymentRepository payments;private final UserRepository users;private final BookRepository books;private final BookCopyRepository copies;private final LoanService loans;private final VnpayGateway gateway;private final ObjectMapper json;
 private final ApplicationEventPublisher events;
 public BorrowCheckoutService(BorrowPaymentRepository payments,UserRepository users,BookRepository books,BookCopyRepository copies,LoanService loans,VnpayGateway gateway,ObjectMapper json,ApplicationEventPublisher events){this.payments=payments;this.users=users;this.books=books;this.copies=copies;this.loans=loans;this.gateway=gateway;this.json=json;this.events=events;}
 private LocalDateTime now(){return LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh"));}
 private boolean matchesOrder(BorrowPayment payment, LoanCreateRequest request) {
  try {
   var saved = json.readValue(payment.getRequestJson(), LoanCreateRequest.class);
   saved.setDailyPricing(request.isDailyPricing());
   return saved.equals(request);
  } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
   return false;
  }
 }
 private BigDecimal quote(LoanCreateRequest request){
  if(request.getDays()==null||request.getDays()<1||request.getDays()>365||request.getItems()==null||request.getItems().isEmpty()||request.getItems().size()>50)throw new IllegalArgumentException("Giỏ tối đa 50 đầu sách, thời hạn 1–365 ngày");
  var counts=new TreeMap<Long,Integer>();for(var item:request.getItems()){if(item==null||item.getBookId()==null||item.getQuantity()==null||item.getQuantity()<1||item.getQuantity()>100)throw new IllegalArgumentException("Số lượng không hợp lệ");counts.merge(item.getBookId(),item.getQuantity(),Math::addExact);}
  BigDecimal total=BigDecimal.ZERO;
  for(var entry:counts.entrySet()){var book=books.findForUpdate(entry.getKey()).orElseThrow(()->new IllegalArgumentException("Sách không còn tồn tại"));
   if(copies.countByBookIdAndStatus(book.getId(),BookCopyStatus.AVAILABLE)<entry.getValue())throw new IllegalStateException("Không đủ quyển: "+book.getTitle());
   if(book.getRentalPrice()==null||book.getRentalPrice().signum()<0)throw new IllegalStateException("Phí sách không hợp lệ");
   total=total.add(RentalPricing.pricePerCopy(book.getRentalPrice(),request.getDays(),request.isDailyPricing()).multiply(BigDecimal.valueOf(entry.getValue())));
  }return total;
 }
 @Transactional public Map<String,Object> checkout(String email,LoanCreateRequest request,String key,String ip){
  gateway.requireConfigured();if(key==null||!key.matches("[A-Za-z0-9-]{16,64}"))throw new IllegalArgumentException("Thiếu mã yêu cầu thanh toán");
  var user=users.findForUpdateByEmail(email).orElseThrow();
  if(!user.isEnabled())throw new IllegalStateException("Tài khoản đã bị khóa");
  String payload;try{payload=json.writeValueAsString(request);}catch(Exception e){throw new IllegalArgumentException("Giỏ không hợp lệ");}
  var existing=payments.findByUser_IdAndRequestKey(user.getId(),key);
  BorrowPayment payment;
  if(existing.isPresent()){payment=existing.get();if(!"VNPAY".equals(payment.getMethod())||!matchesOrder(payment,request))throw new IllegalStateException("Mã yêu cầu đã dùng cho giỏ khác");if(!payment.getStatus().equals("PENDING")||!payment.getExpiresAt().isAfter(now()))throw new IllegalStateException("Giao dịch đã xử lý/hết hạn. Kiểm tra danh sách thanh toán trước khi tạo lại.");}
  else{if(payments.findByUser_EmailOrderByCreatedAtDesc(email).stream().anyMatch(p -> p.getStatus().equals("PENDING") && p.getExpiresAt().isAfter(now())))throw new IllegalStateException("Bạn đang có giao dịch chờ xác nhận. Kiểm tra giao dịch trước khi thanh toán lại.");
   BigDecimal amount=quote(request);if(amount.compareTo(BigDecimal.valueOf(5000))<0||amount.compareTo(new BigDecimal("999999999"))>0||amount.stripTrailingZeros().scale()>0)throw new IllegalArgumentException("VNPay yêu cầu tổng phí từ 5.000 đ, số tiền VND nguyên");
   payment=new BorrowPayment();payment.setId(UUID.randomUUID().toString().replace("-",""));payment.setUser(user);payment.setRequestKey(key);payment.setRequestJson(payload);payment.setAmount(amount);payment.setStatus("PENDING");payment.setCreatedAt(now());payment.setExpiresAt(now().plusMinutes(15));payment.setMessage("Chờ xác nhận từ VNPay");payments.save(payment);}
  return Map.of("id",payment.getId(),"amount",payment.getAmount(),"url",gateway.paymentUrl(payment,ip));
 }
 @Transactional public Map<String,Object> cashCheckout(String email,LoanCreateRequest request,String key){
  if(key==null||!key.matches("[A-Za-z0-9-]{16,64}"))throw new IllegalArgumentException("Thiếu mã yêu cầu thanh toán");
  var user=users.findForUpdateByEmail(email).orElseThrow();
  if(!user.isEnabled())throw new IllegalStateException("Tài khoản đã bị khóa");
  String payload;try{payload=json.writeValueAsString(request);}catch(Exception e){throw new IllegalArgumentException("Giỏ không hợp lệ");}
  var existing=payments.findByUser_IdAndRequestKey(user.getId(),key);
  if(existing.isPresent()){
   var p=existing.get();if(!"CASH".equals(p.getMethod())||!matchesOrder(p,request))throw new IllegalStateException("Mã yêu cầu đã dùng cho giỏ hoặc phương thức khác");
   return Map.of("id",p.getId(),"loanId",p.getLoanId(),"amount",p.getAmount());
  }
  if(payments.findByUser_EmailOrderByCreatedAtDesc(email).stream().anyMatch(p->"PENDING".equals(p.getStatus())&&("PAYOS".equals(p.getMethod())||p.getExpiresAt().isAfter(now()))))throw new IllegalStateException("Bạn đang có giao dịch chuyển khoản chờ xác nhận. Kiểm tra trước khi đặt lại tại quầy.");
  var amount=quote(request);var loan=loans.createForUser(request,email);
  var payment=new BorrowPayment();payment.setId(UUID.randomUUID().toString().replace("-",""));payment.setUser(user);payment.setRequestKey(key);payment.setRequestJson(payload);payment.setAmount(amount);payment.setMethod("CASH");payment.setStatus("UNPAID");payment.setCreatedAt(now());payment.setExpiresAt(now());payment.setLoanId(loan.getId());payment.setMessage("Chờ thanh toán trực tiếp tại thư viện");payments.save(payment);
  return Map.of("id",payment.getId(),"loanId",loan.getId(),"amount",amount);
 }
 @Transactional public BorrowPayment confirmCash(String id,String admin){
  var payment=payments.lock(id).orElseThrow(()->new IllegalArgumentException("Không tìm thấy giao dịch"));
  if(!"CASH".equals(payment.getMethod()))throw new IllegalArgumentException("Chỉ xác nhận tiền mặt tại quầy; chuyển khoản được xác nhận tự động");
  if("PAID".equals(payment.getStatus()))return payment;
  if(!"UNPAID".equals(payment.getStatus()))throw new IllegalStateException("Trạng thái giao dịch không hợp lệ");
  payment.setStatus("PAID");payment.setConfirmedBy(admin);payment.setConfirmedAt(now());payment.setMessage("Đã thu tiền trực tiếp tại thư viện");return payment;
 }
 private Map<String,String> reply(String code,String message){return Map.of("RspCode",code,"Message",message);}
 @Transactional public Map<String,String> ipn(Map<String,String> params){
  if(!gateway.valid(params)||!gateway.merchant().equals(params.get("vnp_TmnCode")))return reply("97","Invalid signature");
  var found=payments.lock(params.getOrDefault("vnp_TxnRef",""));if(found.isEmpty())return reply("01","Order not found");var payment=found.get();
  if(!"VNPAY".equals(payment.getMethod()))return reply("01","Order not found");
  if(!payment.getAmount().multiply(BigDecimal.valueOf(100)).toBigIntegerExact().toString().equals(params.get("vnp_Amount")))return reply("04","Invalid amount");
  if(!payment.getStatus().equals("PENDING"))return reply("02","Already confirmed");
  if(!"00".equals(params.get("vnp_ResponseCode"))||!"00".equals(params.get("vnp_TransactionStatus"))){payment.setStatus("FAILED");payment.setMessage("VNPay báo giao dịch không thành công");return reply("00","Confirmed");}
  payment.setTransactionNo(params.get("vnp_TransactionNo"));
  LoanCreateRequest request;try{request=json.readValue(payment.getRequestJson(),LoanCreateRequest.class);}catch(Exception e){throw new IllegalStateException("Invalid stored order",e);}
  try{if(!payment.getUser().isEnabled()||quote(request).compareTo(payment.getAmount())!=0)throw new IllegalStateException("Tài khoản hoặc giá sách đã thay đổi");}
  catch(IllegalStateException|IllegalArgumentException e){payment.setStatus("REVIEW_REQUIRED");payment.setMessage("Đã nhận thanh toán nhưng chưa tạo phiếu: "+e.getMessage()+". Liên hệ thư viện để xử lý/hoàn tiền.");return reply("00","Confirmed for review");}
  var loan=loans.createForUser(request,payment.getUser().getEmail());payment.setLoanId(loan.getId());payment.setStatus("PAID");payment.setMessage("Đã thanh toán và tạo phiếu #"+loan.getId());
  events.publishEvent(ReaderEmail.paymentConfirmed(payment.getUser().getEmail(), payment.getId(), payment.getAmount(), loan.getId()));
  return reply("00","Confirmed");
 }

 @Transactional public BorrowPayment preparePayos(String email,LoanCreateRequest request,String key){
  if(key==null||!key.matches("[A-Za-z0-9-]{16,64}"))throw new IllegalArgumentException("Thiếu mã yêu cầu thanh toán");
  var user=users.findForUpdateByEmail(email).orElseThrow();if(!user.isEnabled())throw new IllegalStateException("Tài khoản đã bị khóa");
  String payload;try{payload=json.writeValueAsString(request);}catch(Exception e){throw new IllegalArgumentException("Giỏ không hợp lệ");}
  var old=payments.findByUser_IdAndRequestKey(user.getId(),key);
  if(old.isPresent()){var p=old.get();if(!"PAYOS".equals(p.getMethod())||!matchesOrder(p,request))throw new IllegalStateException("Mã yêu cầu đã dùng cho giỏ khác");if(!"PENDING".equals(p.getStatus()))throw new IllegalStateException("Giao dịch đã xử lý. Kiểm tra trạng thái trước khi tạo lại.");return p;}
  if(payments.findByUser_EmailOrderByCreatedAtDesc(email).stream().anyMatch(p->"PENDING".equals(p.getStatus())))throw new IllegalStateException("Bạn còn giao dịch chờ xác nhận. Hãy kiểm tra trạng thái trước khi tạo giao dịch mới.");
  var amount=quote(request);if(amount.signum()<=0||amount.compareTo(new BigDecimal("999999999"))>0||amount.stripTrailingZeros().scale()>0)throw new IllegalArgumentException("Chuyển khoản yêu cầu số tiền VND nguyên từ 1 đến 999.999.999 đ");
  var p=new BorrowPayment();p.setId("PO"+new java.math.BigInteger(UUID.randomUUID().toString().replace("-",""),16).mod(new java.math.BigInteger("8000000000000000")).add(java.math.BigInteger.ONE));p.setUser(user);p.setRequestKey(key);p.setRequestJson(payload);p.setAmount(amount);p.setMethod("PAYOS");p.setStatus("PENDING");p.setCreatedAt(now());p.setExpiresAt(now().plusMinutes(15));p.setMessage("Chờ xác nhận chuyển khoản ngân hàng");return payments.saveAndFlush(p);
 }
 @Transactional(readOnly=true) public BorrowPayment ownedPayos(String id,String email){var p=payments.findById(id).orElseThrow(()->new IllegalArgumentException("Không tìm thấy giao dịch"));if(!p.getUser().getEmail().equals(email))throw new org.springframework.security.access.AccessDeniedException("Không có quyền truy cập");if(!"PAYOS".equals(p.getMethod()))throw new IllegalArgumentException("Không phải giao dịch chuyển khoản");return p;}
 @Transactional(readOnly=true) public LoanCreateRequest payosOrder(String id,String email){var p=ownedPayos(id,email);try{return json.readValue(p.getRequestJson(),LoanCreateRequest.class);}catch(Exception e){throw new IllegalStateException("Không đọc được danh sách sách đã đặt");}}
 @Transactional public BorrowPayment preparePayosRetry(String email,String id){
  users.findForUpdateByEmail(email).orElseThrow();var old=ownedPayos(id,email);if(!"FAILED".equals(old.getStatus()))throw new IllegalStateException("Chỉ tiếp tục giao dịch đã hủy hoặc hết hạn, chưa nhận tiền");
  var request=payosOrder(id,email);String key="retry-"+id;var existing=payments.findByUser_IdAndRequestKey(old.getUser().getId(),key);
  if(existing.isPresent()){if(!"PENDING".equals(existing.get().getStatus()))throw new IllegalStateException("Lần thanh toán tiếp theo đã xử lý. Xem giao dịch mới nhất trong danh sách.");return existing.get();}
  if(quote(request).compareTo(old.getAmount())!=0)throw new IllegalStateException("Phí hoặc tồn kho đã thay đổi. Xem lại sách trong giỏ và xác nhận đơn mới.");
  return preparePayos(email,request,key);
 }
 @Transactional public void abandonPayos(String id,String email){var p=payments.lock(id).orElseThrow();if(!p.getUser().getEmail().equals(email))throw new org.springframework.security.access.AccessDeniedException("Không có quyền truy cập");if(!"PAYOS".equals(p.getMethod()))throw new IllegalArgumentException("Không phải giao dịch chuyển khoản");if("CANCELLED".equals(p.getStatus()))return;if(!"FAILED".equals(p.getStatus()))throw new IllegalStateException("Giao dịch chưa được xác nhận hủy hoặc đã nhận tiền, không thể hủy yêu cầu");p.setStatus("CANCELLED");p.setMessage("Người đọc đã hủy yêu cầu. Có thể đặt đơn mới hoặc chọn phương thức khác.");}
 @Transactional public void reconcilePayos(String id,com.fasterxml.jackson.databind.JsonNode data){
  var found=payments.lock(id);if(found.isEmpty())return;var p=found.get();if(!"PAYOS".equals(p.getMethod()))throw new IllegalArgumentException("Phương thức không hợp lệ");
  if(!data.path("orderCode").isIntegralNumber()||!id.equals("PO"+data.path("orderCode").asLong())||data.path("amount").decimalValue().compareTo(p.getAmount())!=0)throw new IllegalArgumentException("Thông tin giao dịch không khớp");
  String state=data.path("status").asText();
  if("PAID".equals(p.getStatus())||"REVIEW_REQUIRED".equals(p.getStatus()))return;
  if(List.of("CANCELLED","EXPIRED").contains(state)){if(data.path("amountPaid").decimalValue().signum()>0){p.setStatus("REVIEW_REQUIRED");p.setMessage("Giao dịch hủy nhưng đã nhận một phần tiền. Liên hệ thư viện để đối soát trước khi chuyển thêm.");return;}if("PENDING".equals(p.getStatus())){p.setStatus("FAILED");p.setMessage("Giao dịch đã hủy hoặc hết hạn tại ngân hàng");}return;}
  if(!"PAID".equals(state))return;
  if(!data.has("amountPaid")||data.path("amountPaid").decimalValue().compareTo(p.getAmount())<0)throw new IllegalArgumentException("Ngân hàng chưa nhận đủ tiền");
  p.setTransactionNo(data.path("id").asText());p.setConfirmedAt(now());p.setConfirmedBy("PAYOS");
  if(!"PENDING".equals(p.getStatus())||data.path("amountPaid").decimalValue().compareTo(p.getAmount())!=0){p.setStatus("REVIEW_REQUIRED");p.setMessage("Đã nhận tiền nhưng trạng thái hoặc số tiền cần thư viện kiểm tra/hoàn tiền");return;}
  LoanCreateRequest request;try{request=json.readValue(p.getRequestJson(),LoanCreateRequest.class);}catch(Exception e){throw new IllegalStateException("Dữ liệu giao dịch không hợp lệ");}
  try{if(!p.getUser().isEnabled()||quote(request).compareTo(p.getAmount())!=0)throw new IllegalStateException("Tài khoản hoặc phí sách đã thay đổi");}
  catch(IllegalStateException|IllegalArgumentException e){p.setStatus("REVIEW_REQUIRED");p.setMessage("Đã nhận tiền nhưng sách hoặc tài khoản không còn đủ điều kiện. Liên hệ thư viện để xử lý/hoàn tiền.");return;}
  var loan=loans.createForUser(request,p.getUser().getEmail());p.setLoanId(loan.getId());p.setStatus("PAID");p.setMessage("Đã chuyển khoản và tạo phiếu #"+loan.getId());
  events.publishEvent(ReaderEmail.paymentConfirmed(p.getUser().getEmail(), p.getId(), p.getAmount(), loan.getId()));
 }
}
