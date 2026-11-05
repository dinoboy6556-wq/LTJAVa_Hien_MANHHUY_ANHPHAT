package com.example.library.config;

import com.example.library.entity.*;
import com.example.library.repository.*;
import com.example.library.service.BookCopyService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Adds repeatable, linked sample records for local/manual QA only. */
@Component
@Order(300)
@ConditionalOnProperty(name = "app.seed.test-data", havingValue = "true")
public class TestDataInitializer implements CommandLineRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final CategoryRepository categories;
    private final AuthorRepository authors;
    private final PublisherRepository publishers;
    private final BookRepository books;
    private final BookCopyRepository bookCopies;
    private final LoanRepository loans;
    private final FineRepository fines;
    private final SaleRepository sales;
    private final FavoriteRepository favorites;
    private final BookReviewRepository reviews;
    private final BookReactionRepository reactions;
    private final ReservationRepository reservations;
    private final BorrowPaymentRepository payments;
    private final AuditLogRepository auditLogs;
    private final CopyEventRepository copyEvents;
    private final LibraryContentRepository contents;
    private final BookCopyService copyService;
    private final PasswordEncoder passwordEncoder;

    public TestDataInitializer(UserRepository users, RoleRepository roles, CategoryRepository categories,
            AuthorRepository authors, PublisherRepository publishers, BookRepository books, BookCopyRepository bookCopies,
            LoanRepository loans, FineRepository fines, SaleRepository sales,
            FavoriteRepository favorites, BookReviewRepository reviews, BookReactionRepository reactions,
            ReservationRepository reservations, BorrowPaymentRepository payments, AuditLogRepository auditLogs,
            CopyEventRepository copyEvents, LibraryContentRepository contents, BookCopyService copyService,
            PasswordEncoder passwordEncoder) {
        this.users = users; this.roles = roles; this.categories = categories; this.authors = authors; this.publishers = publishers;
        this.books = books; this.bookCopies = bookCopies; this.loans = loans;
        this.fines = fines; this.sales = sales; this.favorites = favorites; this.reviews = reviews;
        this.reactions = reactions; this.reservations = reservations; this.payments = payments;
        this.auditLogs = auditLogs; this.copyEvents = copyEvents; this.contents = contents;
        this.copyService = copyService; this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureReferenceData();
        Role userRole = roles.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new IllegalStateException("Thiếu ROLE_USER"));
        List<User> testUsers = new ArrayList<>();
        for (int index = 1; index <= 10; index++) testUsers.add(ensureTestUser(index, userRole));

        List<Book> addedBooks = ensureExtraCatalog();

        List<Book> catalog = books.findAll().stream().sorted(java.util.Comparator.comparing(Book::getId)).toList();
        if (catalog.size() < 20 || addedBooks.size() != 10) throw new IllegalStateException("Không tạo đủ danh mục sách mẫu");

        for (int index = 0; index < 10; index++) {
            User user = testUsers.get(index);
            Book book = catalog.get(index);
            Loan loan = ensureLoan(user, book, index);
            ensureFine(loan, index);
            ensurePayment(user, loan, book, index);
            ensureFavorite(user, catalog.get((index + 10) % catalog.size()), index);
            ensureReaction(user, catalog.get((index + 10) % catalog.size()), index);
            ensureReservation(user, catalog.get((index + 10) % catalog.size()), index);
        }
        for (int index = 0; index < 10; index++) ensureReview(testUsers.get(index), addedBooks.get(index), index);
        for (int index = 0; index < 10; index++) ensureSale(testUsers.get(index), catalog.get(index + 10));
        ensureContentRows();
        ensureAuditRows();
        ensureCopyEvents();
    }

    private void ensureReferenceData() {
        String[][] publisherRows = {{"NXB Lao Động", "Hà Nội"}, {"NXB Tổng hợp TP.HCM", "TP. Hồ Chí Minh"}};
        for (String[] row : publisherRows) publishers.findFirstByName(row[0]).orElseGet(() -> publishers.save(
                Publisher.builder().name(row[0]).address(row[1]).build()));
    }

    private List<Book> ensureExtraCatalog() {
        List<Publisher> publisherList = publishers.findAll();
        if (publisherList.isEmpty()) throw new IllegalStateException("Cần ít nhất một nhà xuất bản để tạo sách mẫu");
        List<Book> existingBooks = books.findAll();
        List<Book> result = new ArrayList<>();
        for (int index = 1; index <= 10; index++) {
            String suffix = String.format("%02d", index);
            int itemNumber = index;
            String categoryName = "Danh mục kiểm thử " + suffix;
            Category category = categories.findByName(categoryName).orElseGet(() -> categories.save(
                    Category.builder().name(categoryName).description("Thể loại mẫu phục vụ kiểm thử thư viện.").build()));
            String authorName = "Tác giả kiểm thử " + suffix;
            Author author = authors.findByName(authorName).orElseGet(() -> authors.save(
                    Author.builder().name(authorName).biography("Hồ sơ tác giả mẫu số " + itemNumber + " dùng cho dữ liệu kiểm thử.").build()));
            String isbn = "9790000000" + String.format("%03d", index);
            Book book = existingBooks.stream().filter(item -> isbn.equals(item.getIsbn())).findFirst().orElse(null);
            if (book == null) {
                book = books.save(Book.builder().title("Sách kiểm thử " + suffix + " — Hành trình đọc")
                        .isbn(isbn).description("Đầu sách mẫu để kiểm thử tìm kiếm, lọc, trang chi tiết và mượn sách.")
                        .category(category).author(author).publisher(publisherList.get((index - 1) % publisherList.size()))
                        .totalQuantity(3).availableQuantity(3).rentalPrice(BigDecimal.valueOf(10000L + index * 500L))
                        .salePrice(BigDecimal.valueOf(120000L + index * 10000L)).status(BookStatus.AVAILABLE).build());
                copyService.initialize(book.getId());
                existingBooks.add(book);
            }
            result.add(book);
        }
        return result;
    }

    private User ensureTestUser(int number, Role role) {
        String email = String.format("test%02d@library.local", number);
        return users.findByEmail(email).orElseGet(() -> users.save(User.builder().email(email)
                .password(passwordEncoder.encode("test123")).fullName("Độc giả kiểm thử " + number)
                .phone(String.format("090000%04d", number)).address("Hà Nội")
                .roles(Set.of(role)).build()));
    }

    private Loan ensureLoan(User user, Book book, int index) {
        List<Loan> existing = loans.findByUser(user);
        if (!existing.isEmpty()) return existing.get(0);

        boolean returned = index >= 5;
        boolean overdue = index < 3;
        BookCopy copy = returned
                ? bookCopies.findByBookIdAndStatusOrderByIdAsc(book.getId(), BookCopyStatus.AVAILABLE).stream().findFirst()
                    .orElseThrow(() -> new IllegalStateException("Thiếu bản sách khả dụng: " + book.getTitle()))
                : copyService.take(book.getId(), 1, BookCopyStatus.BORROWED).get(0);
        LocalDate today = LocalDate.now();
        LocalDate borrowed = today.minusDays(21L + index);
        LocalDate due = overdue ? today.minusDays(index + 1L) : returned ? today.minusDays(7) : today.plusDays(7L + index);
        Loan loan = Loan.builder().user(user).borrowDate(borrowed).dueDate(due)
                .returnDate(returned ? today.minusDays(3) : null).rentalFee(book.getRentalPrice())
                .fineAmount(BigDecimal.ZERO).renewalCount(0)
                .status(returned ? LoanStatus.RETURNED : overdue ? LoanStatus.OVERDUE : LoanStatus.BORROWED).build();
        LoanItem item = LoanItem.builder().loan(loan).book(book).copy(copy).quantity(1)
                .rentalPrice(book.getRentalPrice()).returnedAt(returned ? today.minusDays(3) : null)
                .returnCondition(returned ? BookReturnCondition.NORMAL : null).build();
        loan.setItems(new ArrayList<>(List.of(item)));
        return loans.save(loan);
    }

    private void ensureFine(Loan loan, int index) {
        if (!fines.findByLoan(loan).isEmpty()) return;
        BigDecimal amount = BigDecimal.valueOf(10000L * (index + 1));
        boolean paid = index >= 3;
        loan.setFineAmount(amount);
        loans.save(loan);
        fines.save(Fine.builder().loan(loan).amount(amount).paid(paid)
                .reason(index < 3 ? "Dữ liệu test: phí quá hạn" : "Dữ liệu test: khoản phạt đã thanh toán").build());
    }

    private void ensureSale(User user, Book book) {
        if (sales.findAll().stream().anyMatch(sale -> sale.getUser().getId().equals(user.getId()))) return;
        BookCopy copy = copyService.take(book.getId(), 1, BookCopyStatus.SOLD).get(0);
        Sale sale = Sale.builder().user(user).totalAmount(book.getSalePrice()).build();
        SaleItem item = SaleItem.builder().sale(sale).book(book).copy(copy).quantity(1)
                .unitPrice(book.getSalePrice()).subtotal(book.getSalePrice()).build();
        sale.setItems(new ArrayList<>(List.of(item)));
        sales.save(sale);
    }

    private void ensureFavorite(User user, Book book, int index) {
        if (!favorites.existsByUser_EmailAndBook_Id(user.getEmail(), book.getId()))
            favorites.save(Favorite.builder().user(user).book(book).createdAt(LocalDateTime.now().minusDays(index)).build());
    }

    private void ensureReview(User user, Book book, int index) {
        if (reviews.findByBook_IdAndUser_Email(book.getId(), user.getEmail()).isEmpty())
            reviews.save(BookReview.builder().user(user).book(book).rating(index % 5 + 1)
                    .comment("Đánh giá mẫu số " + (index + 1) + " để kiểm thử bình luận và xếp hạng.")
                    .createdAt(LocalDateTime.now().minusDays(index)).build());
    }

    private void ensureReaction(User user, Book book, int index) {
        if (reactions.findByBook_IdAndUser_Email(book.getId(), user.getEmail()).isEmpty())
            reactions.save(BookReaction.builder().user(user).book(book).reaction(index % 2 == 0 ? "LIKE" : "DISLIKE")
                    .createdAt(LocalDateTime.now().minusDays(index)).build());
    }

    private void ensureReservation(User user, Book book, int index) {
        if (reservations.findByUser_EmailAndBook_Id(user.getEmail(), book.getId()).isEmpty()) {
            Reservation reservation = new Reservation();
            reservation.setUser(user); reservation.setBook(book); reservation.setCreatedAt(LocalDateTime.now().minusDays(index));
            reservations.save(reservation);
        }
    }

    private void ensurePayment(User user, Loan loan, Book book, int index) {
        String requestKey = String.format("seed-test-payment-%02d", index + 1);
        if (payments.findByUser_IdAndRequestKey(user.getId(), requestKey).isPresent()) return;
        boolean paid = index % 2 == 0;
        BorrowPayment payment = new BorrowPayment();
        payment.setId(UUID.randomUUID().toString().replace("-", ""));
        payment.setUser(user); payment.setRequestKey(requestKey); payment.setAmount(loan.getRentalFee());
        payment.setStatus(paid ? "PAID" : "UNPAID"); payment.setMethod("CASH");
        payment.setRequestJson("{\"days\":14,\"items\":[{\"bookId\":" + book.getId() + ",\"quantity\":1}]}");
        payment.setCreatedAt(LocalDateTime.now().minusDays(index)); payment.setExpiresAt(LocalDateTime.now());
        payment.setLoanId(loan.getId()); payment.setMessage(paid ? "Dữ liệu test: đã thanh toán tại quầy" : "Dữ liệu test: chờ thanh toán tại quầy");
        if (paid) { payment.setConfirmedBy("seed@library.local"); payment.setConfirmedAt(LocalDateTime.now().minusDays(index)); }
        payments.save(payment);
    }

    private void ensureContentRows() {
        var slugs = new java.util.HashSet<>(contents.findAll().stream().map(LibraryContent::getSlug).toList());
        int index = 1;
        while (contents.count() < 10) {
            String slug = "test-content-" + String.format("%02d", index++);
            if (!slugs.add(slug)) continue;
            LibraryContent content = new LibraryContent();
            content.setKind(index % 2 == 0 ? "PAGE" : "POST");
            content.setTitle("Nội dung kiểm thử " + slug.substring(slug.length() - 2)); content.setSlug(slug);
            content.setBody("Nội dung mẫu dùng để kiểm thử quản lý bài viết và trang thư viện.");
            content.setPublished(false); content.setSortOrder(index); contents.save(content);
        }
    }

    private void ensureAuditRows() {
        long existing = auditLogs.count();
        for (long index = existing + 1; index <= 10; index++)
            auditLogs.save(AuditLog.builder().actor("seed@library.local").action("SEED")
                    .target("Dữ liệu test mẫu " + index).createdAt(LocalDateTime.now().minusMinutes(index)).build());
    }

    private void ensureCopyEvents() {
        long count = copyEvents.count();
        if (count >= 10) return;
        var copies = bookCopies.findAll();
        for (BookCopy copy : copies) {
            if (count >= 10) break;
            CopyEvent event = new CopyEvent(); event.setCopyId(copy.getId()); event.setAction("Kiểm thử");
            event.setPreviousStatus(copy.getStatus().name()); event.setNewStatus(copy.getStatus().name());
            event.setActor("seed@library.local"); event.setCreatedAt(LocalDateTime.now()); copyEvents.save(event); count++;
        }
    }
}
