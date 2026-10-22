package com.example.library.config;

import com.example.library.entity.*;
import com.example.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Set;

@Component
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
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (roleRepository.count() == 0) {
            Role adminRole = roleRepository.save(Role.builder().name(RoleName.ROLE_ADMIN).build());
            Role libRole = roleRepository.save(Role.builder().name(RoleName.ROLE_LIBRARIAN).build());
            Role userRole = roleRepository.save(Role.builder().name(RoleName.ROLE_USER).build());

            // Admin User
            userRepository.save(User.builder()
                    .email("admin@library.com")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Trần Quản Trị")
                    .phone("0901234567")
                    .address("Hà Nội")
                    .roles(Set.of(adminRole, libRole))
                    .build());

            // Normal User
            userRepository.save(User.builder()
                    .email("user@library.com")
                    .password(passwordEncoder.encode("user123"))
                    .fullName("Lê Văn Mượn")
                    .phone("0987654321")
                    .address("TP. Hồ Chí Minh")
                    .roles(Set.of(userRole))
                    .build());
        }

        if (categoryRepository.count() == 0) {
            Category catIT = categoryRepository.save(Category.builder().name("Công nghệ thông tin").description("Sách lập trình & CNTT").build());
            Category catLit = categoryRepository.save(Category.builder().name("Văn học").description("Tiểu thuyết & Văn học").build());

            Author author1 = authorRepository.save(Author.builder().name("Joshua Bloch").biography("Tác giả Effective Java").build());
            Author author2 = authorRepository.save(Author.builder().name("Nguyễn Nhật Ánh").biography("Nhà văn nổi tiếng Việt Nam").build());

            Publisher pub1 = publisherRepository.save(Publisher.builder().name("O'Reilly Media").address("USA").phone("123456").build());
            Publisher pub2 = publisherRepository.save(Publisher.builder().name("NXB Trẻ").address("TP.HCM").phone("0283822").build());

            bookRepository.save(Book.builder()
                    .title("Effective Java 3rd Edition")
                    .isbn("978-0134685991")
                    .category(catIT)
                    .author(author1)
                    .publisher(pub1)
                    .totalQuantity(10)
                    .availableQuantity(10)
                    .rentalPrice(new BigDecimal("15000"))
                    .salePrice(new BigDecimal("250000"))
                    .status(BookStatus.AVAILABLE)
                    .build());

            bookRepository.save(Book.builder()
                    .title("Mắt Biếc")
                    .isbn("978-6041142589")
                    .category(catLit)
                    .author(author2)
                    .publisher(pub2)
                    .totalQuantity(5)
                    .availableQuantity(5)
                    .rentalPrice(new BigDecimal("10000"))
                    .salePrice(new BigDecimal("110000"))
                    .status(BookStatus.AVAILABLE)
                    .build());
        }
    }
}
