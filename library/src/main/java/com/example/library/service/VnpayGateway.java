package com.example.library.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.util.*;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
@Component
public class VnpayGateway {
 @Value("${app.vnpay.tmn-code:}") private String merchant;
 @Value("${app.vnpay.hash-secret:}") private String secret;
 @Value("${app.vnpay.url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}") private String url;
 @Value("${app.vnpay.return-url:http://localhost:3000/cart}") private String returnUrl;
 public String merchant(){return merchant;}
 public void requireConfigured(){if(merchant.isBlank()||secret.isBlank())throw new IllegalStateException("Chưa cấu hình VNPay sandbox. Cần VNPAY_TMN_CODE và VNPAY_HASH_SECRET.");}
 public String query(Map<String,String> values){var sorted=new TreeMap<>(values);return sorted.entrySet().stream().filter(e->e.getValue()!=null&&!e.getValue().isEmpty()).map(e->URLEncoder.encode(e.getKey(),StandardCharsets.US_ASCII)+"="+URLEncoder.encode(e.getValue(),StandardCharsets.US_ASCII)).collect(java.util.stream.Collectors.joining("&"));}
 public String sign(Map<String,String> values){requireConfigured();try{Mac mac=Mac.getInstance("HmacSHA512");mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8),"HmacSHA512"));return HexFormat.of().formatHex(mac.doFinal(query(values).getBytes(StandardCharsets.UTF_8)));}catch(java.security.GeneralSecurityException e){throw new IllegalStateException("Không thể ký giao dịch",e);}}
 public boolean valid(Map<String,String> params){if(secret.isBlank()||merchant.isBlank())return false;String supplied=params.get("vnp_SecureHash");if(supplied==null||!supplied.matches("[0-9a-fA-F]{128}"))return false;var values=new TreeMap<>(params);values.remove("vnp_SecureHash");values.remove("vnp_SecureHashType");return java.security.MessageDigest.isEqual(sign(values).getBytes(StandardCharsets.US_ASCII),supplied.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII));}
 public String paymentUrl(com.example.library.entity.BorrowPayment payment,String ip){
  requireConfigured();var format=java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss");var p=new TreeMap<String,String>();
  p.put("vnp_Version","2.1.0");p.put("vnp_Command","pay");p.put("vnp_TmnCode",merchant);p.put("vnp_Amount",payment.getAmount().multiply(java.math.BigDecimal.valueOf(100)).toBigIntegerExact().toString());
  p.put("vnp_CurrCode","VND");p.put("vnp_TxnRef",payment.getId());p.put("vnp_OrderInfo","Thanh toan phi muon "+payment.getId());p.put("vnp_OrderType","other");p.put("vnp_Locale","vn");p.put("vnp_ReturnUrl",returnUrl);p.put("vnp_IpAddr",ip);p.put("vnp_CreateDate",payment.getCreatedAt().format(format));p.put("vnp_ExpireDate",payment.getExpiresAt().format(format));return url+"?"+query(p)+"&vnp_SecureHash="+sign(p);
 }
}
