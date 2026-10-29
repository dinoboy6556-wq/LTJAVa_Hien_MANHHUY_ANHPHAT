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
            .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("Từng quyển sách"))));
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
    @Autowired org.springframework.transaction.PlatformTransactionManager transactionManager;
    @Autowired FineRepository fines;

    @Test @WithMockUser(username = "copies@example.com")
    void renewalChecksOwnershipDueDateAndLimit() {
        user(); Book book=book(1,1); inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),1));
        LocalDate due=loan.getDueDate();
        loanService.renewLoan(loan.getId());
        assertEquals(due.plusDays(7),loan.getDueDate());
        assertEquals(1,loan.getRenewalCount());
        assertThrows(IllegalStateException.class,()->loanService.renewLoan(loan.getId()));
    }

    @Test @WithMockUser(username = "copies@example.com")
    void overdueReturnCreatesOneFineAndRestoresExactCopy() {
        user(); Book book=book(1,1); inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),1));
        Long copyId=loan.getItems().get(0).getCopy().getId();
        loan.setDueDate(LocalDate.now().minusDays(2));
        assertThrows(IllegalStateException.class,()->loanService.renewLoan(loan.getId()));
        loanService.returnLoan(loan.getId());
        assertEquals(0,new BigDecimal("20000").compareTo(loan.getFineAmount()));
        assertEquals(BookCopyStatus.AVAILABLE,copies.findById(copyId).orElseThrow().getStatus());
        assertEquals(1,fines.findByLoan(loan).size());
        assertThrows(IllegalStateException.class,()->loanService.returnLoan(loan.getId()));
        assertEquals(1,fines.findByLoan(loan).size());
    }

    @Test @WithMockUser(username = "copies@example.com")
    void readerCannotReturnOrRenewSomeoneElsesLoan() throws Exception {
        User owner=users.save(User.builder().email("owner@example.com").fullName("Owner").password("unused").build());
        Loan loan=loans.save(Loan.builder().user(owner).borrowDate(LocalDate.now()).dueDate(LocalDate.now().plusDays(14))
            .rentalFee(BigDecimal.ZERO).status(LoanStatus.BORROWED).build());
        mvc.perform(post("/api/v1/loans/"+loan.getId()+"/return")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/loans/"+loan.getId()+"/renew")).andExpect(status().isForbidden());
        assertEquals(LoanStatus.BORROWED,loan.getStatus());
    }

    @Test @WithMockUser(username = "rollback@example.com")
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void failedMultiBookLoanRollsBackPreviouslyAllocatedCopy() {
        users.save(User.builder().email("rollback@example.com").fullName("Rollback").password("unused").build());
        Book first=book(1,1), second=book(1,0);
        inventory.initialize(first.getId()); inventory.initialize(second.getId());
        LoanCreateRequest req=request(first.getId(),1);
        LoanItemRequest missing=new LoanItemRequest();missing.setBookId(second.getId());missing.setQuantity(1);
        req.setItems(List.of(req.getItems().get(0),missing));
        long before=loans.count();
        assertThrows(IllegalStateException.class,()->loanService.createLoan(req));
        assertEquals(before,loans.count());
        assertEquals(1,copies.countByBookIdAndStatus(first.getId(),BookCopyStatus.AVAILABLE));
        assertEquals(1,books.findById(first.getId()).orElseThrow().getAvailableQuantity());
    }

    @Test @WithMockUser(username = "copies@example.com")
    void unpaidFineAndReturnedLoanCannotBeRenewed() {
        user(); Book book=book(1,1); inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),1));
        Fine fine=fines.save(Fine.builder().loan(loan).amount(BigDecimal.TEN).reason("Unpaid").paid(false).build());
        assertThrows(IllegalStateException.class,()->loanService.renewLoan(loan.getId()));
        fine.setPaid(true); fines.save(fine);
        loanService.returnLoan(loan.getId());
        assertThrows(IllegalStateException.class,()->loanService.renewLoan(loan.getId()));
    }

    @Test @WithMockUser(username = "return-rollback@example.com")
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void failedReturnRollsBackCopyLoanAndFine() {
        users.save(User.builder().email("return-rollback@example.com").fullName("Return rollback").password("unused").build());
        Book book=book(2,2); inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),2));
        var tx=new org.springframework.transaction.support.TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            Loan stored=loans.findById(loan.getId()).orElseThrow();
            stored.setDueDate(LocalDate.now().minusDays(2));
            stored.getItems().get(1).getCopy().setStatus(BookCopyStatus.UNAVAILABLE);
        });
        long before=fines.count();
        assertThrows(IllegalStateException.class,()->loanService.returnLoan(loan.getId()));
        assertEquals(before,fines.count());
        assertEquals(1,copies.countByBookIdAndStatus(book.getId(),BookCopyStatus.BORROWED));
        assertEquals(0,copies.countByBookIdAndStatus(book.getId(),BookCopyStatus.AVAILABLE));
        assertEquals(0,books.findById(book.getId()).orElseThrow().getAvailableQuantity());
        Loan stored=loans.findById(loan.getId()).orElseThrow();
        assertEquals(LoanStatus.BORROWED,stored.getStatus());
        assertNull(stored.getReturnDate());
    }

    @Test @WithMockUser(username = "copies@example.com")
    void renewalUsesSelectedDaysAndRejectsInvalidInput() throws Exception {
        user(); Book book=book(1,1); inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),1));
        LocalDate original=loan.getDueDate();
        for(String body : List.of("{\"days\":0}","{\"days\":8}","{\"days\":null}")) {
            mvc.perform(post("/api/v1/loans/"+loan.getId()+"/renew").contentType("application/json").content(body))
                .andExpect(status().isBadRequest());
        }
        assertEquals(original,loan.getDueDate());
        mvc.perform(post("/api/v1/loans/"+loan.getId()+"/renew").contentType("application/json").content("{\"days\":3}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.dueDate").value(original.plusDays(3).toString()));
        assertEquals(1,loan.getRenewalCount());
    }

    @Test @WithMockUser(roles="USER")
    void readerCannotListOrSettleAllFines() throws Exception {
        mvc.perform(get("/api/v1/fines")).andExpect(status().isForbidden());
        mvc.perform(post("/api/v1/fines/999/mark-paid")).andExpect(status().isForbidden());
    }

    @Test @WithMockUser(roles="ADMIN")
    void adminCanListFinesAndDashboardRenders() throws Exception {
        mvc.perform(get("/api/v1/fines")).andExpect(status().isOk());
        mvc.perform(get("/admin")).andExpect(status().isOk())
            .andExpect(content().string(org.hamcrest.Matchers.containsString("adminNav")))
            .andExpect(content().string(org.hamcrest.Matchers.containsString("adminDialog")));
    }

    @Autowired ReservationRepository reservations;
    @Autowired CopyEventRepository copyEvents;

    @Test @WithMockUser(username="copies@example.com")
    void partialReturnsTrackEachItemAndAccumulateOnlyItsFine() {
        user();Book book=book(2,2);inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),2));loan.setDueDate(LocalDate.now().minusDays(2));
        LoanItem first=loan.getItems().get(0),second=loan.getItems().get(1);
        LoanReturnRequest req=new LoanReturnRequest();req.setItemIds(List.of(first.getId()));
        loanService.returnLoan(loan.getId(),req);
        assertEquals(LoanStatus.BORROWED,loan.getStatus());assertNull(loan.getReturnDate());assertNotNull(first.getReturnedAt());assertNull(second.getReturnedAt());
        assertEquals(1,book.getAvailableQuantity());assertEquals(0,new BigDecimal("20000").compareTo(loan.getFineAmount()));
        assertThrows(IllegalArgumentException.class,()->loanService.returnLoan(loan.getId(),req));
        req.setItemIds(List.of(second.getId()));req.setCondition(BookReturnCondition.LOST);loanService.returnLoan(loan.getId(),req);
        assertEquals(LoanStatus.RETURNED,loan.getStatus());assertNotNull(loan.getReturnDate());
        assertEquals(0,new BigDecimal("140000").compareTo(loan.getFineAmount()));assertEquals(1,book.getAvailableQuantity());
        assertEquals(3,inventory.history(book.getId(),first.getCopy().getId()).size());
    }

    @Test @WithMockUser(username="copies@example.com",roles="ADMIN")
    void metadataEditPreservesInventoryAndValidatesPrices() throws Exception {
        Book book=book(2,2);inventory.initialize(book.getId());
        String payload="{\"title\":\"Updated title\",\"totalQuantity\":999,\"rentalPrice\":12,\"salePrice\":30,\"coverImageUrl\":\"/images/book.jpg\"}";
        mvc.perform(put("/api/v1/books/"+book.getId()).contentType("application/json").content(payload))
          .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Updated title"))
          .andExpect(jsonPath("$.totalQuantity").value(2)).andExpect(jsonPath("$.availableQuantity").value(2));
        mvc.perform(put("/api/v1/books/"+book.getId()).contentType("application/json").content(payload.replace("\"rentalPrice\":12","\"rentalPrice\":-1")))
          .andExpect(status().isBadRequest());
        assertEquals(2,copies.countByBookId(book.getId()));
    }

    @Test @WithMockUser(username="copies@example.com")
    void waitlistIsIdempotentAndNotifiesWhenStockReturns() throws Exception {
        user();Book book=book(1,1);inventory.initialize(book.getId());
        mvc.perform(put("/api/v1/reservations/"+book.getId())).andExpect(status().isConflict());
        inventory.take(book.getId(),1,BookCopyStatus.BORROWED);
        mvc.perform(put("/api/v1/reservations/"+book.getId())).andExpect(status().isOk()).andExpect(jsonPath("$.user").doesNotExist());
        mvc.perform(put("/api/v1/reservations/"+book.getId())).andExpect(status().isOk());
        assertEquals(1,reservations.findByUser_EmailOrderByCreatedAtAsc("copies@example.com").size());
        mvc.perform(get("/api/v1/notifications")).andExpect(jsonPath("$.length()").value(0));
        inventory.add(book.getId(),1);
        mvc.perform(get("/api/v1/notifications")).andExpect(jsonPath("$[0].type").value("BOOK_AVAILABLE"));
        mvc.perform(post("/api/v1/loans").contentType("application/json")
            .content("{\"days\":14,\"items\":[{\"bookId\":"+book.getId()+",\"quantity\":1}]}"))
            .andExpect(status().isOk());
        assertTrue(reservations.findByUser_EmailOrderByCreatedAtAsc("copies@example.com").isEmpty());
    }

    @Test @WithMockUser(username="copies@example.com")
    void remindersArePrivateAndExcludeReturnedLoans() throws Exception {
        user();Book book=book(2,2);inventory.initialize(book.getId());
        Loan soon=loanService.createLoan(request(book.getId(),1));soon.setDueDate(LocalDate.now().plusDays(2));
        Loan late=loanService.createLoan(request(book.getId(),1));late.setDueDate(LocalDate.now().minusDays(1));
        mvc.perform(get("/api/v1/notifications")).andExpect(jsonPath("$.length()").value(2));
        loanService.returnLoan(soon.getId());
        mvc.perform(get("/api/v1/notifications")).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].type").value("OVERDUE"));
        users.save(User.builder().email("another-notice@example.com").fullName("Other").password("unused").build());
        mvc.perform(get("/api/v1/notifications").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("another-notice@example.com")))
          .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/v1/books/"+book.getId()+"/copies/"+late.getItems().get(0).getCopy().getId()+"/history"))
          .andExpect(status().isForbidden());
    }

    @Test @WithMockUser(username="copies@example.com",roles="ADMIN")
    void partialReturnRejectsForeignItemsWithoutChangingStock() throws Exception {
        user();Book book=book(2,2);inventory.initialize(book.getId());
        Loan first=loanService.createLoan(request(book.getId(),1));Loan other=loanService.createLoan(request(book.getId(),1));
        mvc.perform(post("/api/v1/loans/"+first.getId()+"/return").contentType("application/json")
          .content("{\"itemIds\":["+other.getItems().get(0).getId()+"],\"condition\":\"NORMAL\"}"))
          .andExpect(status().isBadRequest());
        assertEquals(0,book.getAvailableQuantity());assertNull(first.getItems().get(0).getReturnedAt());
    }

    @Test @WithMockUser(username="copies@example.com")
    void readersCannotEditBookAndCannotSeeOthersWaitlist() throws Exception {
        user();Book book=book(1,0);inventory.initialize(book.getId());
        mvc.perform(put("/api/v1/reservations/"+book.getId())).andExpect(status().isOk());
        mvc.perform(get("/api/v1/reservations").with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("other@example.com")))
          .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(put("/api/v1/books/"+book.getId()).contentType("application/json")
          .content("{\"title\":\"No\",\"totalQuantity\":1,\"rentalPrice\":0,\"salePrice\":0}"))
          .andExpect(status().isForbidden());
        mvc.perform(delete("/api/v1/reservations/"+book.getId())).andExpect(status().isOk());
        mvc.perform(get("/api/v1/reservations")).andExpect(jsonPath("$.length()").value(0));
    }

    @Test @WithMockUser(username="copies@example.com")
    void readerReturnsOwnCopiesPartiallyThenAll() throws Exception {
        user();Book book=book(2,2);inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),2));
        Long first=loan.getItems().get(0).getId();
        mvc.perform(post("/api/v1/loans/"+loan.getId()+"/my-return").contentType("application/json")
          .content("{\"itemIds\":["+first+"],\"condition\":\"NORMAL\"}"))
          .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("BORROWED"));
        assertEquals(1,book.getAvailableQuantity());
        mvc.perform(post("/api/v1/loans/"+loan.getId()+"/my-return"))
          .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("RETURNED"));
        assertEquals(2,book.getAvailableQuantity());
    }
    @Test @WithMockUser(username="copies@example.com")
    void readerCannotReturnSomeoneElsesLoanThroughSelfService() throws Exception {
        user();Book book=book(1,1);inventory.initialize(book.getId());
        Loan loan=loanService.createLoan(request(book.getId(),1));
        mvc.perform(post("/api/v1/loans/"+loan.getId()+"/my-return")
          .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("another@example.com")))
          .andExpect(status().isForbidden());
        assertEquals(0,book.getAvailableQuantity());assertEquals(LoanStatus.BORROWED,loan.getStatus());
    }

}
