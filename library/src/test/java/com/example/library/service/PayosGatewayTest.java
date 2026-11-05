package com.example.library.service;
import com.example.library.entity.BorrowPayment;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.*;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.http.*;
import java.math.BigDecimal;import java.time.LocalDateTime;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;
import static org.junit.jupiter.api.Assertions.*;
class PayosGatewayTest {
 ObjectMapper json=new ObjectMapper();PayosGateway gateway;MockRestServiceServer server;BorrowPayment payment;
 @BeforeEach void setup(){var builder=RestClient.builder().baseUrl("https://api-merchant.payos.vn");server=MockRestServiceServer.bindTo(builder).build();gateway=new PayosGateway(json);ReflectionTestUtils.setField(gateway,"client",builder.build());ReflectionTestUtils.setField(gateway,"clientId","test-client");ReflectionTestUtils.setField(gateway,"apiKey","test-api");ReflectionTestUtils.setField(gateway,"checksumKey","test-checksum");ReflectionTestUtils.setField(gateway,"returnUrl","http://localhost:3000/cart");ReflectionTestUtils.setField(gateway,"cancelUrl","http://localhost:3000/cart");payment=new BorrowPayment();payment.setId("PO123456");payment.setAmount(new BigDecimal("20000"));payment.setExpiresAt(LocalDateTime.of(2026,11,6,12,30));}
 String response(JsonNode data){var r=json.createObjectNode();r.put("code","00");r.set("data",data);r.put("signature",gateway.sign(data));return r.toString();}
 JsonNode data(){return json.createObjectNode().put("orderCode",123456).put("amount",20000).put("status","PENDING").put("id","123456789012345678901234567890ab");}
 @Test void createsSignedRequestWithServerCredentialsAndWholeVnd(){server.expect(requestTo("https://api-merchant.payos.vn/v2/payment-requests")).andExpect(method(HttpMethod.POST)).andExpect(header("x-client-id","test-client")).andExpect(header("x-api-key","test-api")).andExpect(request->{var body=json.readTree(((org.springframework.mock.http.client.MockClientHttpRequest)request).getBodyAsString());assertEquals(20000,body.path("amount").asInt());assertEquals("MUONSACH",body.path("description").asText());var signed=body.deepCopy();((com.fasterxml.jackson.databind.node.ObjectNode)signed).remove(java.util.List.of("signature","expiredAt"));assertEquals(gateway.sign(signed),body.path("signature").asText());assertTrue(body.path("expiredAt").asLong()>0);}).andRespond(withSuccess(response(data()),MediaType.APPLICATION_JSON));assertEquals(123456,gateway.create(payment).path("orderCode").asLong());server.verify();}
 @Test void timeoutRetryLooksUpSameOrderInsteadOfCreatingAnother(){server.expect(requestTo("https://api-merchant.payos.vn/v2/payment-requests")).andRespond(withServerError());server.expect(requestTo("https://api-merchant.payos.vn/v2/payment-requests/123456")).andExpect(method(HttpMethod.GET)).andRespond(withSuccess(response(data()),MediaType.APPLICATION_JSON));assertEquals(123456,gateway.create(payment).path("orderCode").asLong());server.verify();}
 @Test void forgedProviderResponseCannotBeAccepted(){var r=json.createObjectNode();r.put("code","00");r.set("data",data());r.put("signature","0".repeat(64));server.expect(requestTo("https://api-merchant.payos.vn/v2/payment-requests/123456")).andRespond(withSuccess(r.toString(),MediaType.APPLICATION_JSON));assertThrows(IllegalStateException.class,()->gateway.lookup(payment));server.verify();}
}
