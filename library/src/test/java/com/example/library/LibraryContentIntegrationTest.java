package com.example.library;
import org.junit.jupiter.api.Test;import org.springframework.beans.factory.annotation.Autowired;import org.springframework.boot.test.context.SpringBootTest;import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;import org.springframework.test.web.servlet.MockMvc;import org.springframework.security.test.context.support.WithMockUser;import org.springframework.transaction.annotation.Transactional;import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:content_test;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop","app.seed.enabled=false"}) @AutoConfigureMockMvc @Transactional
class LibraryContentIntegrationTest {
 @Autowired MockMvc mvc;
 @Test @WithMockUser(roles="LIBRARIAN") void librarianCanPublishPageButCannotEditConfig() throws Exception {
  mvc.perform(post("/api/v1/content/manage/PAGE").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"About\",\"slug\":\"about\",\"body\":\"Hello <script>bad</script>\",\"published\":true}")).andExpect(status().isOk());
  mvc.perform(get("/user/read/about")).andExpect(status().isOk()).andExpect(content().string(org.hamcrest.Matchers.containsString("&lt;script&gt;")));
  mvc.perform(post("/api/v1/content/manage/CONFIG").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Site\",\"slug\":\"site\"}")).andExpect(status().isForbidden());
 }
 @Test @WithMockUser(roles="ADMIN") void draftsAreNotPublicAndMenuRejectsExternalLinks() throws Exception {
  mvc.perform(post("/api/v1/content/manage/PAGE").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Draft\",\"slug\":\"draft\",\"published\":false}")).andExpect(status().isOk());
  mvc.perform(get("/user/read/draft")).andExpect(status().isNotFound());
  mvc.perform(get("/api/v1/content/public")).andExpect(jsonPath("$.length()").value(0));
  mvc.perform(post("/api/v1/content/manage/MENU").contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"Bad\",\"slug\":\"bad\",\"link\":\"javascript:alert(1)\"}")).andExpect(status().is4xxClientError());
 }
 @Test @WithMockUser(roles="USER") void readerCannotManageContent() throws Exception {mvc.perform(get("/api/v1/content/manage/POST")).andExpect(status().isForbidden());}
}
