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
import java.util.List;
import java.util.Set;

@Component
@Order(200)
@ConditionalOnProperty(name = "app.book-copies.migrate", havingValue = "true")
public class DemoActivityInitializer implements CommandLineRunner {
    private final UserRepository users;
    private final RoleRepository roles;
    private final BookRepository books;
    private final LoanRepository loans;
    private final FineRepository fines;
    private final SaleRepository sales;
    private final FavoriteRepository favorites;
    private final BookReviewRepository reviews;
    private final AuditLogRepository auditLogs;
    private final BookCopyService copies;
    private final PasswordEncoder passwordEncoder;

    public DemoActivityInitializer(UserRepository users, RoleRepository roles, BookRepository books,
            LoanRepository loans, FineRepository fines, SaleRepository sales, FavoriteRepository favorites,
            BookReviewRepository reviews, AuditLogRepository auditLogs, BookCopyService copies,
            PasswordEncoder passwordEncoder) {
        this.users = users; this.roles = roles; this.books = books; this.loans = loans; this.fines = fines;
        this.sales = sales; this.favorites = favorites; this.reviews = reviews; this.auditLogs = auditLogs;
        this.copies = copies; this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (users.existsByEmail("demo@library.com")) return;
        Role userRole = roles.findByName(RoleName.ROLE_USER)
                .orElseThrow(() -> new IllegalStateException("Thiếu ROLE_USER để tạo dữ liệu demo"));
        User demo = users.save(User.builder().email("demo@library.com")
                .password(passwordEncoder.encode("demo123")).fullName("Nguyễn Độc Giả Mẫu")
                .phone("0900000001").address("Hà Nội").roles(Set.of(userRole)).build());

        List<Book> catalog = books.findAll().stream().filter(b -> b.getTotalQuantity() > 1).toList();
        if (catalog.size() < 2) throw new IllegalStateException("Cần ít nhất hai đầu sách có tồn kho để tạo dữ liệu demo");
        Book loanBook = catalog.get(0);
        BookCopy loanCopy = copies.take(loanBook.getId(), 1, BookCopyStatus.BORROWED).get(0);
        Loan loan = Loan.builder().user(demo).borrowDate(LocalDate.now().minusDays(19))
                .dueDate(LocalDate.now().minusDays(5)).rentalFee(loanBook.getRentalPrice())
                .fineAmount(new BigDecimal("50000")).status(LoanStatus.OVERDUE).renewalCount(0).build();
        LoanItem loanItem = LoanItem.builder().loan(loan).book(loanBook).copy(loanCopy).quantity(1)
                .rentalPrice(loanBook.getRentalPrice()).build();
        loan.setItems(new java.util.ArrayList<>(List.of(loanItem)));
        Loan savedLoan = loans.save(loan);
        fines.save(Fine.builder().loan(savedLoan).amount(new BigDecimal("50000"))
                .reason("Phạt quá hạn — dữ liệu minh họa").paid(false).build());

        Book saleBook = catalog.get(1);
        BookCopy saleCopy = copies.take(saleBook.getId(), 1, BookCopyStatus.SOLD).get(0);
        Sale sale = Sale.builder().user(demo).totalAmount(saleBook.getSalePrice()).build();
        SaleItem saleItem = SaleItem.builder().sale(sale).book(saleBook).copy(saleCopy).quantity(1)
                .unitPrice(saleBook.getSalePrice()).subtotal(saleBook.getSalePrice()).build();
        sale.setItems(new java.util.ArrayList<>(List.of(saleItem)));
        sales.save(sale);

        Book favoriteBook = catalog.get(Math.min(2, catalog.size() - 1));
        if (!favorites.existsByUser_EmailAndBook_Id(demo.getEmail(), favoriteBook.getId())) {
            favorites.save(Favorite.builder().user(demo).book(favoriteBook).createdAt(LocalDateTime.now()).build());
        }
        if (reviews.findByBook_IdAndUser_Email(favoriteBook.getId(), demo.getEmail()).isEmpty()) {
            reviews.save(BookReview.builder().user(demo).book(favoriteBook).rating(5)
                    .comment("Một cuốn sách đáng đọc.").createdAt(LocalDateTime.now()).build());
        }
        auditLogs.save(AuditLog.builder().actor("demo@library.com").action("SEED")
                .target("Tạo dữ liệu minh họa cho mượn, phạt, bán, yêu thích và đánh giá").build());
    }
}
