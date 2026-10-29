package com.example.library;

import com.example.library.entity.*;
import com.example.library.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import java.math.BigDecimal;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
 "spring.datasource.url=jdbc:h2:mem:favorites_test;DB_CLOSE_DELAY=-1",
 "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
 "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
 "spring.jpa.hibernate.ddl-auto=create-drop", "app.seed.enabled=false"
})
@AutoConfigureMockMvc
class FavoriteIntegrationTest {
 @Autowired MockMvc mvc;
 @Autowired UserRepository users;
 @Autowired BookRepository books;
 @Autowired FavoriteRepository favorites;
 Long bookId;
 @BeforeEach void setup() {
  favorites.deleteAll();
  for (String email : new String[]{"favorite@example.com", "other@example.com"}) {
   if (!users.existsByEmail(email)) users.save(User.builder().email(email).fullName(email).password("secret").build());
  }
  bookId = books.save(Book.builder().title("Favorite book").totalQuantity(1).availableQuantity(1)
   .status(BookStatus.AVAILABLE).rentalPrice(BigDecimal.TEN).salePrice(BigDecimal.TEN).build()).getId();
 }
 @Test void addReadDeleteAndRepeatAreSafe() throws Exception {
  for (int i=0;i<2;i++) mvc.perform(put("/api/v1/favorites/"+bookId).with(user("favorite@example.com")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.user").doesNotExist());
  mvc.perform(get("/api/v1/favorites").with(user("favorite@example.com")))
   .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
   .andExpect(jsonPath("$[0].book.id").value(bookId)).andExpect(jsonPath("$[0].user").doesNotExist());
  for (int i=0;i<2;i++) mvc.perform(delete("/api/v1/favorites/"+bookId).with(user("favorite@example.com")))
   .andExpect(status().isOk());
  assertEquals(0, favorites.count());
 }
 @Test void favoritesArePrivateAndGuestsCannotModify() throws Exception {
  mvc.perform(put("/api/v1/favorites/"+bookId)).andExpect(status().is4xxClientError());
  mvc.perform(get("/api/v1/favorites")).andExpect(status().is4xxClientError());
  mvc.perform(put("/api/v1/favorites/"+bookId).with(user("favorite@example.com"))).andExpect(status().isOk());
  mvc.perform(get("/api/v1/favorites").with(user("other@example.com"))).andExpect(jsonPath("$.length()").value(0));
  mvc.perform(delete("/api/v1/favorites/"+bookId).with(user("other@example.com"))).andExpect(status().isOk());
  assertEquals(1, favorites.count());
 }
 @Test void missingBookDoesNotCreateFavorite() throws Exception {
  mvc.perform(put("/api/v1/favorites/9223372036854775807").with(user("favorite@example.com")))
   .andExpect(status().isNotFound());
  assertEquals(0, favorites.count());
 }
 @Test void concurrentAddsCreateOnlyOneFavorite() throws Exception {
  var pool = Executors.newFixedThreadPool(2);
  var gate = new CountDownLatch(1);
  Callable<Integer> task = () -> { gate.await(); return mvc.perform(put("/api/v1/favorites/"+bookId)
   .with(user("favorite@example.com"))).andReturn().getResponse().getStatus(); };
  try {
   var first=pool.submit(task); var second=pool.submit(task); gate.countDown();
   assertEquals(200,first.get(10,TimeUnit.SECONDS)); assertEquals(200,second.get(10,TimeUnit.SECONDS));
   assertEquals(1,favorites.count());
  } finally { pool.shutdownNow(); }
 }
}
