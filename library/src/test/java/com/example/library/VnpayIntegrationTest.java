package com.example.library;
import com.example.library.entity.*;import com.example.library.dto.*;import com.example.library.repository.*;import com.example.library.service.*;
import org.junit.jupiter.api.*;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.transaction.annotation.Transactional;
import java.util.*;import java.math.BigDecimal;import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:payment_test;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop","app.seed.enabled=false","app.vnpay.tmn-code=TEST1234","app.vnpay.hash-secret=unit-test-secret-not-real"})
@Transactional
class VnpayIntegrationTest {
 @Autowired BorrowCheckoutService checkout;@Autowired VnpayGateway gateway;@Autowired UserRepository users;@Autowired BookRepository books;@Autowired BookCopyService inventory;@Autowired BorrowPaymentRepository payments;@Autowired LoanRepository loans;
 Book book;LoanCreateRequest request;
 @BeforeEach void setup(){users.save(User.builder().email("payer@test.com").fullName("Payer").password("unused").build());book=books.save(Book.builder().title("Java").totalQuantity(2).availableQuantity(2).status(BookStatus.AVAILABLE).rentalPrice(new BigDecimal("10000")).salePrice(new BigDecimal("50000")).build());inventory.initialize(book.getId());var item=new LoanItemRequest();item.setBookId(book.getId());item.setQuantity(2);request=new LoanCreateRequest();request.setDays(14);request.setItems(List.of(item));}
 String order(){return (String)checkout.checkout("payer@test.com",request,"request-key-123456","127.0.0.1").get("id");}
 Map<String,String> callback(String id,String amount,String code){var p=new TreeMap<String,String>();p.put("vnp_TmnCode","TEST1234");p.put("vnp_TxnRef",id);p.put("vnp_Amount",amount);p.put("vnp_ResponseCode",code);p.put("vnp_TransactionStatus",code);p.put("vnp_TransactionNo","12345");p.put("vnp_SecureHash",gateway.sign(p));return p;}
 @Test void signedPaymentCreatesOneLoanAndDuplicateIsIdempotent(){String id=order();assertEquals(id,order());assertEquals(0,loans.count());var params=callback(id,"2000000","00");assertEquals("00",checkout.ipn(params).get("RspCode"));assertEquals("02",checkout.ipn(params).get("RspCode"));assertEquals(1,loans.count());assertEquals("PAID",payments.findById(id).orElseThrow().getStatus());assertEquals(0,book.getAvailableQuantity());}
 @Test void invalidSignatureOrAmountCannotCreateLoan(){String id=order();var params=callback(id,"2000000","00");params.put("vnp_Amount","100");assertEquals("97",checkout.ipn(params).get("RspCode"));assertEquals("04",checkout.ipn(callback(id,"100","00")).get("RspCode"));assertEquals(0,loans.count());}
 @Test void failureDoesNotAllocateBooks(){String id=order();assertEquals("00",checkout.ipn(callback(id,"2000000","24")).get("RspCode"));assertEquals("FAILED",payments.findById(id).orElseThrow().getStatus());assertEquals(2,book.getAvailableQuantity());}
 @Test void stockLostAfterPaymentIsRecordedForReview(){String id=order();inventory.take(book.getId(),1,BookCopyStatus.BORROWED);assertEquals("00",checkout.ipn(callback(id,"2000000","00")).get("RspCode"));assertEquals("REVIEW_REQUIRED",payments.findById(id).orElseThrow().getStatus());assertEquals(0,loans.count());}
 @Test void priceChangeAndDisabledAccountCannotSilentlyCreateLoan(){String id=order();book.setRentalPrice(new BigDecimal("11000"));assertEquals("00",checkout.ipn(callback(id,"2000000","00")).get("RspCode"));assertEquals("REVIEW_REQUIRED",payments.findById(id).orElseThrow().getStatus());}

 @Test void cashCreatesUnpaidLoanAndRetryDoesNotDuplicate(){
  var first=checkout.cashCheckout("payer@test.com",request,"cash-request-123456");
  var second=checkout.cashCheckout("payer@test.com",request,"cash-request-123456");
  assertEquals(first.get("id"),second.get("id"));assertEquals(1,loans.count());
  var payment=payments.findById((String)first.get("id")).orElseThrow();assertEquals("UNPAID",payment.getStatus());assertEquals("CASH",payment.getMethod());
  checkout.confirmCash(payment.getId(),"admin@test.com");var stamp=payment.getConfirmedAt();
  checkout.confirmCash(payment.getId(),"other-admin@test.com");assertEquals("PAID",payment.getStatus());assertEquals("admin@test.com",payment.getConfirmedBy());assertEquals(stamp,payment.getConfirmedAt());assertEquals(1,loans.count());
 }
 @Test void onlineCannotBeConfirmedAsCash(){String id=order();assertThrows(IllegalArgumentException.class,()->checkout.confirmCash(id,"admin@test.com"));assertEquals("PENDING",payments.findById(id).orElseThrow().getStatus());}
 @Test void cashCannotBeConfirmedByOnlineCallback(){var result=checkout.cashCheckout("payer@test.com",request,"cash-request-123456");String id=(String)result.get("id");assertEquals("01",checkout.ipn(callback(id,"2000000","00")).get("RspCode"));assertEquals("UNPAID",payments.findById(id).orElseThrow().getStatus());}
 @Test void pendingOnlinePreventsDuplicateCashOrder(){order();assertThrows(IllegalStateException.class,()->checkout.cashCheckout("payer@test.com",request,"cash-request-123456"));assertEquals(0,loans.count());}
}
