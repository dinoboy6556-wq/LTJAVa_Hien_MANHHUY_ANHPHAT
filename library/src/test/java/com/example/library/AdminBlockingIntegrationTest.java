package com.example.library;
import com.example.library.entity.*;
import com.example.library.repository.*;
import com.example.library.security.JwtTokenProvider;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:block_test;DB_CLOSE_DELAY=-1","spring.datasource.driver-class-name=org.h2.Driver","spring.datasource.username=sa","spring.datasource.password=","spring.jpa.database-platform=org.hibernate.dialect.H2Dialect","spring.jpa.hibernate.ddl-auto=create-drop","app.seed.enabled=false"})
@AutoConfigureMockMvc @Transactional
class AdminBlockingIntegrationTest {
 @Autowired MockMvc mvc; @Autowired UserRepository users; @Autowired RoleRepository roles; @Autowired JwtTokenProvider tokens;
 User reader,admin;
 @BeforeEach void setup(){
  Role role=roles.findByName(RoleName.ROLE_ADMIN).orElseGet(()->roles.save(Role.builder().name(RoleName.ROLE_ADMIN).build()));
  roles.findByName(RoleName.ROLE_USER).orElseGet(()->roles.save(Role.builder().name(RoleName.ROLE_USER).build()));
  reader=users.save(User.builder().email("block-reader@test.com").fullName("Reader").password("unused").build());
  admin=users.save(User.builder().email("block-admin@test.com").fullName("Admin").password("unused").roles(new java.util.HashSet<>(java.util.Set.of(role))).build());
 }
 @Test void adminCanBlockAndUnblockReader() throws Exception {
  String url="/api/v1/admin/users/"+reader.getId()+"/status";
  mvc.perform(patch(url).with(user("manager@test.com").roles("ADMIN")).contentType("application/json").content("{\"enabled\":false}"))
    .andExpect(status().isOk()).andExpect(jsonPath("$.enabled").value(false));
  assertFalse(reader.isEnabled());
  mvc.perform(patch(url).with(user("manager@test.com").roles("ADMIN")).contentType("application/json").content("{\"enabled\":true}"))
    .andExpect(status().isOk()).andExpect(jsonPath("$.enabled").value(true));
 }
 @Test void adminCannotBlockAdminOrRemoveRoleToBypassProtection() throws Exception {
  mvc.perform(patch("/api/v1/admin/users/"+admin.getId()+"/status").with(user("manager@test.com").roles("ADMIN")).contentType("application/json").content("{\"enabled\":false}"))
    .andExpect(status().isBadRequest());
  for(String payload:java.util.List.of("{\"enabled\":false,\"roles\":[\"ROLE_ADMIN\"]}","{\"enabled\":true,\"roles\":[\"ROLE_USER\"]}"))
   mvc.perform(put("/api/v1/admin/users/"+admin.getId()).with(user("manager@test.com").roles("ADMIN")).contentType("application/json").content(payload)).andExpect(status().isBadRequest());
  assertTrue(admin.isEnabled());assertTrue(admin.getRoles().stream().anyMatch(r->r.getName()==RoleName.ROLE_ADMIN));
 }
 @Test void readerAndLibrarianCannotBlockAccounts() throws Exception {
  for(String role:java.util.List.of("USER","LIBRARIAN"))
   mvc.perform(patch("/api/v1/admin/users/"+reader.getId()+"/status").with(user("staff@test.com").roles(role)).contentType("application/json").content("{\"enabled\":false}"))
    .andExpect(status().isForbidden());
  assertTrue(reader.isEnabled());
 }
 @Test void previousJwtStopsWorkingAfterBlock() throws Exception {
  String token=tokens.generateToken(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(reader.getEmail(),"unused",java.util.List.of()));
  mvc.perform(get("/api/v1/profile").header("Authorization","Bearer "+token)).andExpect(status().isOk());
  reader.setEnabled(false);users.saveAndFlush(reader);
  mvc.perform(get("/api/v1/profile").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());
 }
}
