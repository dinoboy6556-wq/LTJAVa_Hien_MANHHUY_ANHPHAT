package com.example.library.service;

import com.example.library.entity.BorrowPayment;
import com.fasterxml.jackson.databind.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.net.URI;
import java.time.ZoneId;
import java.util.*;

@Component
public class PayosGateway {
 private final ObjectMapper json;
 private final RestClient client;
 @Value("${app.payos.client-id:}") private String clientId;
 @Value("${app.payos.api-key:}") private String apiKey;
 @Value("${app.payos.checksum-key:}") private String checksumKey;
 @Value("${app.payos.return-url:http://localhost:3000/cart}") private String returnUrl;
 @Value("${app.payos.cancel-url:http://localhost:3000/cart}") private String cancelUrl;
 public PayosGateway(ObjectMapper json) {
  this.json=json;
  var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(5000);factory.setReadTimeout(10000);
  client=RestClient.builder().baseUrl("https://api-merchant.payos.vn").requestFactory(factory).build();
 }
 public void requireConfigured(){if(clientId.isBlank()||apiKey.isBlank()||checksumKey.isBlank())throw new IllegalStateException("Chuyển khoản ngân hàng chưa được cấu hình. Vui lòng chọn thanh toán trực tiếp hoặc liên hệ thư viện.");}
 public long orderCode(BorrowPayment payment){return Long.parseLong(payment.getId().substring(2));}
 public String sign(JsonNode data) {
  try {
   var fields=new TreeMap<String,String>();data.fields().forEachRemaining(e->{var v=e.getValue();String value=v.isNull()?"":v.isContainerNode()?sorted(v).toString():v.asText();fields.put(e.getKey(),List.of("null","undefined").contains(value)?"":value);});
   String body=String.join("&",fields.entrySet().stream().map(e->e.getKey()+"="+e.getValue()).toList());
   var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(checksumKey.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
  }catch(Exception e){throw new IllegalStateException("Không thể xác minh thanh toán");}
 }
 private JsonNode sorted(JsonNode node){if(node.isObject()){var result=json.createObjectNode();var keys=new TreeSet<String>();node.fieldNames().forEachRemaining(keys::add);keys.forEach(k->result.set(k,sorted(node.get(k))));return result;}if(node.isArray()){var result=json.createArrayNode();node.forEach(v->result.add(sorted(v)));return result;}return node;}
 public JsonNode verified(JsonNode response){
  requireConfigured();if(response==null||!response.path("data").isObject()||!response.path("signature").asText().matches("[a-fA-F0-9]{64}")||!MessageDigest.isEqual(sign(response.get("data")).getBytes(StandardCharsets.US_ASCII),response.path("signature").asText().toLowerCase(Locale.ROOT).getBytes(StandardCharsets.US_ASCII)))throw new IllegalArgumentException("Chữ ký thanh toán không hợp lệ");return response.get("data");
 }
 public JsonNode create(BorrowPayment payment){
  requireConfigured();var body=json.createObjectNode();body.put("amount",payment.getAmount().longValueExact());body.put("cancelUrl",cancelUrl);body.put("description","MUONSACH");body.put("orderCode",orderCode(payment));body.put("returnUrl",returnUrl);body.put("signature",sign(body));body.put("expiredAt",Math.max(payment.getExpiresAt().atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toEpochSecond(),java.time.Instant.now().plusSeconds(900).getEpochSecond()));
  try{return checked(client.post().uri("/v2/payment-requests").header("x-client-id",clientId).header("x-api-key",apiKey).body(body).retrieve().body(JsonNode.class));}
  catch(Exception error){return lookup(payment);}
 }
 public JsonNode lookup(BorrowPayment payment){requireConfigured();try{return checked(client.get().uri("/v2/payment-requests/"+orderCode(payment)).header("x-client-id",clientId).header("x-api-key",apiKey).retrieve().body(JsonNode.class));}catch(Exception e){throw new IllegalStateException("Chưa kết nối được ngân hàng. Giao dịch vẫn được lưu; hãy kiểm tra trạng thái hoặc thử lại cùng giỏ, không chuyển tiền thêm.");}}
 public JsonNode cancel(BorrowPayment payment){requireConfigured();try{return checked(client.post().uri("/v2/payment-requests/"+orderCode(payment)+"/cancel").header("x-client-id",clientId).header("x-api-key",apiKey).body(java.util.Map.of("cancellationReason","Nguoi doc huy yeu cau muon")).retrieve().body(JsonNode.class));}catch(Exception e){throw new IllegalStateException("Chưa xác nhận được việc hủy với ngân hàng. Kiểm tra trạng thái, không tạo đơn mới hoặc chuyển thêm tiền.");}}
 private JsonNode checked(JsonNode response){if(response==null||!"00".equals(response.path("code").asText()))throw new IllegalStateException("Ngân hàng chưa chấp nhận yêu cầu");return verified(response);}
 public String checkoutUrl(JsonNode data){String url=data.path("checkoutUrl").asText();if(url.isBlank()){String id=data.path("id").asText(data.path("paymentLinkId").asText());if(!id.matches("[a-zA-Z0-9-]{16,64}"))throw new IllegalStateException("Không tìm thấy liên kết chuyển khoản");url="https://pay.payos.vn/web/"+id;}var uri=URI.create(url);if(!"https".equals(uri.getScheme())||!"pay.payos.vn".equals(uri.getHost())||uri.getUserInfo()!=null)throw new IllegalStateException("Liên kết chuyển khoản không hợp lệ");return url;}
}
