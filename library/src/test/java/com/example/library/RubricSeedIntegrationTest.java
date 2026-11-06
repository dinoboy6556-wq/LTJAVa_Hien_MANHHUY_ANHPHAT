package com.example.library;
import org.junit.jupiter.api.Test;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.boot.test.context.SpringBootTest;import com.example.library.config.TestDataInitializer;import com.example.library.repository.*;import static org.junit.jupiter.api.Assertions.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:rubric_seed;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop","app.seed.enabled=true","app.seed.test-data=true","app.seed.test-book-count=30"})
class RubricSeedIntegrationTest {
 @Autowired BookRepository books;@Autowired LoanRepository loans;@Autowired SaleRepository sales;@Autowired BookReviewRepository reviews;@Autowired TestDataInitializer seed;
 @Test void richSeedHasLinkedDataAndCanRunAgain(){assertTrue(books.count()>=30);assertTrue(loans.count()>=10);assertTrue(sales.count()>=10);assertTrue(reviews.count()>=10);long b=books.count(),l=loans.count(),s=sales.count();seed.run();assertEquals(b,books.count());assertEquals(l,loans.count());assertEquals(s,sales.count());}
}
