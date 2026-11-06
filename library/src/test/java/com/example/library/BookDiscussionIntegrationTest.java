package com.example.library;

import com.example.library.entity.*;
import com.example.library.repository.*;
import com.example.library.dto.*;
import com.example.library.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:discussion_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa", "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop", "app.seed.enabled=false", "app.mail.enabled=false"
})
@AutoConfigureMockMvc @Transactional
class BookDiscussionIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired BookRepository books;
    @Autowired BookCopyService inventory;
    @Autowired LoanService loans;
    @Autowired PurchaseOrderService orders;
    @Autowired LibraryContentRepository contents;
    @Autowired BookReadingRepository readings;
    Book book;

    @BeforeEach void setup() {
        users.save(User.builder().email("member@test.com").password("secret").fullName("Member").enabled(true).build());
        book=books.save(Book.builder().title("Java").availableQuantity(5).totalQuantity(5)
                .rentalPrice(BigDecimal.TEN).salePrice(new BigDecimal("100000")).status(BookStatus.AVAILABLE).build());
        inventory.initialize(book.getId());
    }

    @Test void nonParticipantCanAskButCannotReviewOrAnswer() throws Exception {
        String path="/api/v1/books/"+book.getId();
        mvc.perform(put(path+"/reviews").with(user("member@test.com")).contentType("application/json")
                .content("{\"rating\":5,\"comment\":\"test\"}")).andExpect(status().isForbidden());
        mvc.perform(get(path+"/reviews/eligibility").with(user("member@test.com")))
                .andExpect(jsonPath("$.canReview").value(false));
        var response=mvc.perform(post(path+"/questions").with(user("member@test.com")).contentType("application/json")
                .content("{\"question\":\"Is it available?\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.user").doesNotExist()).andReturn();
        long id=json.readTree(response.getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(get(path+"/reviews")).andExpect(jsonPath("$.count").value(0));
        mvc.perform(put(path+"/questions/"+id+"/answer").with(user("member@test.com")).contentType("application/json")
                .content("{\"answer\":\"Fake staff reply\"}")).andExpect(status().isForbidden());
        mvc.perform(put(path+"/questions/"+id+"/answer").with(user("staff@test").roles("LIBRARIAN")).contentType("application/json")
                .content("{\"answer\":\"Yes, available.\"}")).andExpect(status().isOk());
        mvc.perform(get(path+"/questions")).andExpect(jsonPath("$[0].answer").value("Yes, available."));
        mvc.perform(post(path+"/questions").contentType("application/json").content("{\"question\":\"Guest\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test void borrowingThisBookAllowsReview() throws Exception {
        LoanItemRequest item=new LoanItemRequest();item.setBookId(book.getId());item.setQuantity(1);
        LoanCreateRequest request=new LoanCreateRequest();request.setDays(7);request.setItems(List.of(item));
        loans.createForUser(request,"member@test.com");
        mvc.perform(put("/api/v1/books/"+book.getId()+"/reviews").with(user("member@test.com"))
                .contentType("application/json").content("{\"rating\":4,\"comment\":\"Useful\"}"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/v1/books/"+book.getId()+"/reviews/eligibility").with(user("other@test")))
                .andExpect(status().isNotFound());
    }

    @Test void onlyConfirmedPurchaseAllowsReview() throws Exception {
        var order=orders.create("member@test.com",book.getId(),1,book.getSalePrice(),"12345678-1234-1234-1234-123456789012");
        String path="/api/v1/books/"+book.getId()+"/reviews/eligibility";
        mvc.perform(get(path).with(user("member@test.com"))).andExpect(jsonPath("$.canReview").value(false));
        mvc.perform(post("/api/v1/purchase-orders/"+order.id()+"/confirm").with(user("admin@test").roles("ADMIN"))
                .contentType("application/json").content("{\"paymentCollected\":true}")).andExpect(status().isOk());
        mvc.perform(get(path).with(user("member@test.com"))).andExpect(jsonPath("$.canReview").value(true));
    }

    @Test void publishedLinkedEbookReadingIsRecordedOnceAndAllowsReview() throws Exception {
        var ebook=new LibraryContent();ebook.setKind("EBOOK");ebook.setTitle("Java reading");
        ebook.setSlug("java-reading");ebook.setPublished(true);ebook.setBody("Chapter one");ebook.setBookId(book.getId());
        contents.save(ebook);
        String path="/api/v1/content/read/java-reading/record";
        mvc.perform(post(path)).andExpect(status().isUnauthorized());
        for(int i=0;i<2;i++)mvc.perform(post(path).with(user("member@test.com"))).andExpect(status().isOk());
        assertEquals(1,readings.count());
        mvc.perform(get("/api/v1/books/"+book.getId()+"/reviews/eligibility").with(user("member@test.com")))
                .andExpect(jsonPath("$.canReview").value(true));
        ebook.setPublished(false);
        mvc.perform(post(path).with(user("member@test.com"))).andExpect(status().isNotFound());
    }
}
