package com.example.library;

import com.example.library.entity.*;
import com.example.library.dto.*;
import com.example.library.repository.*;
import com.example.library.service.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:copies_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@Transactional
class BookCopyIntegrationTest {
    @Autowired BookRepository books;
    @Autowired BookCopyRepository copies;
    @Autowired LoanRepository loans;
    @Autowired UserRepository users;
    @Autowired BookCopyService inventory;
    @Autowired LoanService loanService;
    @Autowired SaleService saleService;
    @Autowired BookService bookService;
    @Autowired MockMvc mvc;
    @Autowired CatalogService catalog;
    @Autowired jakarta.persistence.EntityManager entityManager;

    Book book(int total, int available) {
        return books.save(Book.builder().title("Same title").totalQuantity(total).availableQuantity(available)
            .rentalPrice(new BigDecimal("10000")).salePrice(new BigDecimal("100000"))
            .status(BookStatus.AVAILABLE).build());
    }
    User user() {
        return users.save(User.builder().email("copies@example.com").fullName("Copies User").password("unused").build());
    }
    LoanCreateRequest request(Long id, int count) {
        LoanItemRequest item = new LoanItemRequest(); item.setBookId(id); item.setQuantity(count);
        LoanCreateRequest req = new LoanCreateRequest(); req.setDays(14); req.setItems(List.of(item)); return req;
    }

    @Test
    void creatingTitleCreatesUniquePhysicalCopies() {
        BookCreateRequest req = new BookCreateRequest(); req.setTitle("Same title"); req.setTotalQuantity(3);
        req.setRentalPrice(BigDecimal.TEN); req.setSalePrice(BigDecimal.TEN);
        Book first = bookService.createBook(req), second = bookService.createBook(req);
        assertEquals(3, copies.countByBookId(first.getId()));
        assertNotEquals(inventory.list(first.getId()).get(0).getCode(), inventory.list(second.getId()).get(0).getCode());
    }

    @Test @WithMockUser(username = "copies@example.com")
    void borrowReturnAndSellTrackSpecificCopies() {
        user(); Book book = book(3,3); inventory.initialize(book.getId());
        Loan loan = loanService.createLoan(request(book.getId(),2));
        assertEquals(2, loan.getItems().size());
        assertEquals(1, book.getAvailableQuantity());
        assertNotEquals(loan.getItems().get(0).getCopy().getId(), loan.getItems().get(1).getCopy().getId());
        assertTrue(loan.getItems().stream().allMatch(i -> i.getQuantity()==1 && i.getCopy().getStatus()==BookCopyStatus.BORROWED));
        loanService.returnLoan(loan.getId(),new LoanReturnRequest());
        assertEquals(3,book.getAvailableQuantity());
        assertThrows(IllegalStateException.class, () -> loanService.returnLoan(loan.getId()));
    }

    @Test @WithMockUser(username = "copies@example.com")
    void damagedAndLostCopiesAreNotAvailable() {
        user(); Book book=book(2,2); inventory.initialize(book.getId());
        Loan damaged=loanService.createLoan(request(book.getId(),1));
        LoanReturnRequest req=new LoanReturnRequest();req.setCondition(BookReturnCondition.DAMAGED);
        loanService.returnLoan(damaged.getId(),req);
        assertEquals(BookCopyStatus.DAMAGED,damaged.getItems().get(0).getCopy().getStatus());
        Loan lost=loanService.createLoan(request(book.getId(),1));req.setCondition(BookReturnCondition.LOST);
        loanService.returnLoan(lost.getId(),req);
        assertEquals(0,book.getAvailableQuantity());
        assertEquals(BookCopyStatus.LOST,lost.getItems().get(0).getCopy().getStatus());
    }

    @Test @WithMockUser(username = "copies@example.com")
    void soldCopyCannotBeBorrowedAgain() {
        user(); Book book=book(1,1); inventory.initialize(book.getId());
        SaleItemRequest item=new SaleItemRequest();item.setBookId(book.getId());item.setQuantity(1);
        SaleCreateRequest req=new SaleCreateRequest();req.setItems(List.of(item));
        Sale sale=saleService.createSale(req);
        assertEquals(BookCopyStatus.SOLD,sale.getItems().get(0).getCopy().getStatus());
        assertEquals(0,book.getAvailableQuantity());
        assertThrows(IllegalStateException.class, () -> inventory.take(book.getId(),1,BookCopyStatus.BORROWED));
    }

    @Test
    void migratesGroupedActiveLoansWithoutGuessingUnavailableReason() {
        Book book=book(5,2);User user=user();
        Loan loan=Loan.builder().user(user).borrowDate(LocalDate.now()).dueDate(LocalDate.now().plusDays(14))
            .rentalFee(new BigDecimal("20000")).status(LoanStatus.BORROWED).build();
        loan.getItems().add(LoanItem.builder().loan(loan).book(book).quantity(2).rentalPrice(BigDecimal.TEN).build());
        loans.saveAndFlush(loan);
        Long loanId = loan.getId();
        entityManager.clear();
        inventory.initialize(book.getId()); inventory.initialize(book.getId());
        assertEquals(5,copies.countByBookId(book.getId()));
        assertEquals(2,copies.countByBookIdAndStatus(book.getId(),BookCopyStatus.BORROWED));
        assertEquals(1,copies.countByBookIdAndStatus(book.getId(),BookCopyStatus.UNAVAILABLE));
        loan = loans.findById(loanId).orElseThrow();
        assertEquals(2,loan.getItems().size());
        assertTrue(loan.getItems().stream().allMatch(i -> i.getQuantity()==1 && i.getCopy()!=null));
        loanService.returnLoan(loan.getId());
        assertEquals(4,books.findById(book.getId()).orElseThrow().getAvailableQuantity());
        assertEquals(0, new BigDecimal("20000").compareTo(loan.getRentalFee()));
    }

    @Test
    void rejectsInconsistentLegacyCounts() {
        Book book=book(1,2);
        assertThrows(IllegalStateException.class, () -> inventory.initialize(book.getId()));
        assertEquals(0,copies.countByBookId(book.getId()));
    }

    @Test
    void publicCopyListingDoesNotExposeBorrowerAndTemplateRenders() throws Exception {
        Book book=book(1,1);inventory.initialize(book.getId());
        mvc.perform(get("/api/v1/books/"+book.getId()+"/copies")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].code").exists()).andExpect(jsonPath("$[0].book").doesNotExist());
        mvc.perform(get("/user/books/"+book.getId())).andExpect(status().isOk())
            .andExpect(content().string(org.hamcrest.Matchers.containsString("Từng quyển sách")));
        mvc.perform(post("/api/v1/books/"+book.getId()+"/copies").contentType("application/json").content("{\"quantity\":1}"))
            .andExpect(status().is4xxClientError());
    }

    @Test @WithMockUser(roles="USER")
    void ordinaryReaderCannotManageInventory() throws Exception {
        Book book=book(1,1);inventory.initialize(book.getId());
        mvc.perform(post("/api/v1/books/"+book.getId()+"/copies").contentType("application/json").content("{\"quantity\":1}"))
            .andExpect(status().is4xxClientError());
        assertEquals(1,copies.countByBookId(book.getId()));
    }

    @Test
    void restockAndReconcilePreserveCounts() {
        Book book=book(2,1);inventory.initialize(book.getId());
        BookCopy unknown=inventory.list(book.getId()).stream().filter(c -> c.getStatus()==BookCopyStatus.UNAVAILABLE).findFirst().orElseThrow();
        inventory.reconcile(book.getId(),unknown.getId(),BookCopyStatus.AVAILABLE);
        inventory.add(book.getId(),2);
        assertEquals(4,book.getTotalQuantity());assertEquals(4,book.getAvailableQuantity());
    }

    @Test
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void concurrentBorrowersCannotTakeTheSameLastCopy() throws Exception {
        Book book=book(1,1);inventory.initialize(book.getId());
        java.util.concurrent.ExecutorService pool=java.util.concurrent.Executors.newFixedThreadPool(2);
        java.util.concurrent.CountDownLatch gate=new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.Callable<Boolean> task=() -> {
            gate.await();
            try { inventory.take(book.getId(),1,BookCopyStatus.BORROWED); return true; }
            catch (IllegalStateException expected) { return false; }
        };
        try {
            var a=pool.submit(task);var b=pool.submit(task);gate.countDown();
            int successes=(a.get(10,java.util.concurrent.TimeUnit.SECONDS)?1:0)+(b.get(10,java.util.concurrent.TimeUnit.SECONDS)?1:0);
            assertEquals(1,successes);
            assertEquals(1,copies.countByBookIdAndStatus(book.getId(),BookCopyStatus.BORROWED));
            assertEquals(0,books.findById(book.getId()).orElseThrow().getAvailableQuantity());
        } finally { pool.shutdownNow(); }
    }

    @Test
    void catalogFiltersPricesAvailabilityAndPaginates() throws Exception {
        for(int n=0;n<14;n++) {
            Book book=book(1,n==13?0:1);book.setTitle("CatalogUnique " + n);
            book.setRentalPrice(BigDecimal.valueOf(n*1000));books.save(book);
        }
        var first=catalog.search("CatalogUnique","","",null,null,"","price_asc",0);
        assertEquals(14,first.getTotalElements());assertEquals(12,first.getContent().size());
        var last=catalog.search("CatalogUnique","","",null,null,"","price_asc",99);
        assertEquals(1,last.getNumber());assertEquals(2,last.getContent().size());
        var filtered=catalog.search("CatalogUnique","","",BigDecimal.valueOf(10000),BigDecimal.valueOf(13000),"available","price_desc",0);
        assertEquals(3,filtered.getTotalElements());assertEquals(0,BigDecimal.valueOf(12000).compareTo(filtered.getContent().get(0).getRentalPrice()));
        assertThrows(IllegalArgumentException.class,()->catalog.search("","","",BigDecimal.TEN,BigDecimal.ONE,"","",0));
        mvc.perform(get("/user/books").param("q","CatalogUnique").param("sort","price_asc"))
            .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("Trang sau")));
        mvc.perform(get("/user/books").param("q","no-matching-title-unique"))
            .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("Chưa tìm thấy")));
        mvc.perform(get("/user/books").param("min","100").param("max","1"))
            .andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("Khoảng phí mượn")));
    }
}
