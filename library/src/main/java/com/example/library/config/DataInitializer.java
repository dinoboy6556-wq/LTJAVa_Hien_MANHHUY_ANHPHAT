package com.example.library.config;

import com.example.library.entity.*;
import com.example.library.repository.*;
import com.example.library.service.BookCopyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Set;

@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
@org.springframework.core.annotation.Order(0)
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AuthorRepository authorRepository;

    @Autowired
    private PublisherRepository publisherRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BookCopyService bookCopyService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        Role adminRole = ensureRole(RoleName.ROLE_ADMIN);
        Role libRole = ensureRole(RoleName.ROLE_LIBRARIAN);
        Role userRole = ensureRole(RoleName.ROLE_USER);

        if (!userRepository.existsByEmail("admin@library.com")) {
            userRepository.save(User.builder()
                    .email("admin@library.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Trần Quản Trị")
                    .phone("0901234567")
                    .address("Hà Nội")
                    .roles(Set.of(adminRole, libRole))
                    .build());
        }

        if (!userRepository.existsByEmail("user@library.com")) {
            userRepository.save(User.builder()
                    .email("user@library.com")
                    .password(passwordEncoder.encode("user123"))
                    .fullName("Lê Văn Mượn")
                    .phone("0987654321")
                    .address("TP. Hồ Chí Minh")
                    .roles(Set.of(userRole))
                    .build());
        }

        seedCatalog();
    }

    private Role ensureRole(RoleName name) {
        return roleRepository.findByName(name).orElseGet(() -> roleRepository.save(Role.builder().name(name).build()));
    }

    private void seedCatalog() {
        Category technology = category("Công nghệ thông tin", "Sách lập trình và công nghệ");
        Category literature = category("Văn học", "Tiểu thuyết và văn học");
        Category business = category("Kinh tế - Kỹ năng", "Kinh doanh, tài chính và kỹ năng sống");
        Category science = category("Khoa học", "Khoa học tự nhiên và tư duy");
        Category children = category("Thiếu nhi", "Truyện và sách dành cho thiếu nhi");
        Category history = category("Lịch sử", "Lịch sử và văn hóa thế giới");

        Author bloch = author("Joshua Bloch", "Tác giả Effective Java");
        Author nguyenNhatAnh = author("Nguyễn Nhật Ánh", "Nhà văn Việt Nam");
        Author martin = author("Robert C. Martin", "Tác giả sách về kỹ nghệ phần mềm");
        Author tanenbaum = author("Andrew S. Tanenbaum", "Tác giả sách về hệ điều hành và mạng máy tính");
        Author paulo = author("Paulo Coelho", "Nhà văn Brazil");
        Author dale = author("Dale Carnegie", "Tác giả sách kỹ năng giao tiếp");
        Author harari = author("Yuval Noah Harari", "Nhà sử học và tác giả");
        Author rowling = author("J. K. Rowling", "Tác giả bộ truyện Harry Potter");
        Author orwell = author("George Orwell", "Tiểu thuyết gia và nhà báo Anh");
        Author marquez = author("Gabriel García Márquez", "Nhà văn Colombia, Nobel Văn học");
        Author lee = author("Harper Lee", "Nhà văn Mỹ");
        Author austen = author("Jane Austen", "Tiểu thuyết gia Anh");
        Author clear = author("James Clear", "Tác giả sách về thói quen");
        Author housel = author("Morgan Housel", "Tác giả về tài chính cá nhân");
        Author newport = author("Cal Newport", "Tác giả sách về năng suất và công nghệ");
        Author thomas = author("Andrew Hunt", "Đồng tác giả sách về phát triển phần mềm");
        Author sierra = author("Kathy Sierra", "Tác giả sách lập trình");
        Author kleppmann = author("Martin Kleppmann", "Tác giả sách về hệ thống dữ liệu");
        Author westover = author("Tara Westover", "Tác giả hồi ký Educated");
        Author sagan = author("Carl Sagan", "Nhà thiên văn học và tác giả");
        Author tolkien = author("J. R. R. Tolkien", "Tác giả bộ truyện Trung Địa");
        Author toHoai = author("Tô Hoài", "Nhà văn Việt Nam");

        Publisher oreilly = publisher("O'Reilly Media", "USA", null);
        Publisher tre = publisher("NXB Trẻ", "TP. Hồ Chí Minh", null);
        Publisher kimDong = publisher("NXB Kim Đồng", "Hà Nội", null);
        Publisher treN = publisher("NXB Trẻ", "TP. Hồ Chí Minh", null);
        Publisher alphabooks = publisher("Alpha Books", "Hà Nội", null);
        Publisher nxbTheGioi = publisher("NXB Thế Giới", "Hà Nội", null);
        Publisher penguin = publisher("Penguin Random House", "USA", null);
        Publisher pearson = publisher("Pearson", "United Kingdom", null);
        Publisher addison = publisher("Addison-Wesley", "USA", null);

        seedBook("Effective Java 3rd Edition", "978-0134685991", technology, bloch, oreilly, 10, 15000, 250000);
        seedBook("Mắt Biếc", "978-6041142589", literature, nguyenNhatAnh, tre, 5, 10000, 110000);
        seedBook("Clean Code", "978-0132350884", technology, martin, oreilly, 8, 15000, 220000);
        seedBook("Operating Systems: Design and Implementation", "978-0131429383", technology, tanenbaum, pearson, 4, 18000, 390000);
        seedBook("Nhà Giả Kim", null, literature, paulo, nxbTheGioi, 7, 10000, 79000);
        seedBook("Đắc Nhân Tâm", null, business, dale, treN, 6, 12000, 86000);
        seedBook("Sapiens: Lược Sử Loài Người", null, science, harari, alphabooks, 5, 15000, 189000);
        seedBook("Harry Potter và Hòn đá Phù thủy", null, literature, rowling, kimDong, 6, 10000, 95000);
        seedBook("1984", null, literature, orwell, penguin, 5, 12000, 145000);
        seedBook("Trăm Năm Cô Đơn", null, literature, marquez, nxbTheGioi, 4, 12000, 155000);
        seedBook("Giết Con Chim Nhại", null, literature, lee, penguin, 4, 10000, 135000);
        seedBook("Kiêu Hãnh và Định Kiến", null, literature, austen, penguin, 4, 10000, 125000);
        seedBook("Atomic Habits", null, business, clear, alphabooks, 7, 12000, 149000);
        seedBook("The Psychology of Money", null, business, housel, alphabooks, 5, 12000, 159000);
        seedBook("Deep Work", null, business, newport, penguin, 4, 12000, 169000);
        seedBook("The Pragmatic Programmer", null, technology, thomas, addison, 5, 18000, 320000);
        seedBook("Head First Java", null, technology, sierra, oreilly, 5, 18000, 295000);
        seedBook("Designing Data-Intensive Applications", null, technology, kleppmann, oreilly, 4, 20000, 420000);
        seedBook("Educated", null, literature, westover, penguin, 3, 12000, 175000);
        seedBook("Cosmos", null, science, sagan, penguin, 4, 15000, 199000);
        seedBook("The Hobbit", null, children, tolkien, penguin, 5, 10000, 139000);
        seedBook("Dế Mèn Phiêu Lưu Ký", null, children, toHoai, kimDong, 8, 8000, 65000);
        seedBook("The Lord of the Rings", null, children, tolkien, penguin, 3, 15000, 229000);
    }

    private Category category(String name, String description) {
        return categoryRepository.findByName(name).orElseGet(() -> categoryRepository.save(
                Category.builder().name(name).description(description).build()));
    }

    private Author author(String name, String biography) {
        return authorRepository.findByName(name).orElseGet(() -> authorRepository.save(
                Author.builder().name(name).biography(biography).build()));
    }

    private Publisher publisher(String name, String address, String phone) {
        return publisherRepository.findFirstByName(name).orElseGet(() -> publisherRepository.save(
                Publisher.builder().name(name).address(address).phone(phone).build()));
    }

    private void seedBook(String title, String isbn, Category category, Author author, Publisher publisher,
                          int quantity, int rentalPrice, int salePrice) {
        if (isbn == null ? bookRepository.existsByTitle(title) : bookRepository.existsByIsbn(isbn)) return;
        Book saved = bookRepository.save(Book.builder().title(title).isbn(isbn).category(category).author(author)
                .publisher(publisher).totalQuantity(quantity).availableQuantity(quantity)
                .rentalPrice(BigDecimal.valueOf(rentalPrice)).salePrice(BigDecimal.valueOf(salePrice))
                .status(BookStatus.AVAILABLE).build());
        bookCopyService.initialize(saved.getId());
    }
}
