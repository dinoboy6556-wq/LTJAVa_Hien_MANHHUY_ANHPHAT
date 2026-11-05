package com.example.library;

import com.example.library.entity.User;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:profile_test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@Transactional
class ProfileIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired com.example.library.repository.RoleRepository roles;

    @BeforeEach
    void createUser() {
        users.save(User.builder().email("profile@example.com").password("private-password")
                .fullName("Profile User").phone("0123456789").address("Old address").build());
    }

    @Test
    void anonymousCannotReadOrUpdateProfile() throws Exception {
        mvc.perform(get("/api/v1/profile")).andExpect(status().is4xxClientError());
        mvc.perform(put("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Changed\"}")).andExpect(status().is4xxClientError());
    }

    @Test
    @WithMockUser(username = "profile@example.com")
    void returnsOwnProfileWithoutPassword() throws Exception {
        mvc.perform(get("/api/v1/profile")).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("profile@example.com"))
                .andExpect(jsonPath("$.phone").value("0123456789"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @WithMockUser(username = "profile@example.com")
    void updatesOnlyAllowedFieldsOfAuthenticatedUser() throws Exception {
        mvc.perform(put("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\" New Name \",\"phone\":\"0987654321\",\"address\":\"New address\",\"email\":\"admin@library.com\",\"password\":\"changed\",\"roles\":[\"ROLE_ADMIN\"]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("New Name"));
        User saved = users.findByEmail("profile@example.com").orElseThrow();
        assertEquals("0987654321", saved.getPhone());
        assertEquals("New address", saved.getAddress());
        assertEquals("private-password", saved.getPassword());
        assertTrue(saved.getRoles().isEmpty());
        mvc.perform(get("/api/v1/profile")).andExpect(jsonPath("$.address").value("New address"));
    }

    @Test
    @WithMockUser(username = "profile@example.com", roles = "ADMIN")
    void adminRolesSurviveProfileReadAndUpdate() throws Exception {
        var role = roles.findByName(com.example.library.entity.RoleName.ROLE_ADMIN)
                .orElseGet(() -> roles.save(com.example.library.entity.Role.builder()
                        .name(com.example.library.entity.RoleName.ROLE_ADMIN).build()));
        User user = users.findByEmail("profile@example.com").orElseThrow();
        user.getRoles().add(role);
        users.save(user);
        mvc.perform(get("/api/v1/profile")).andExpect(status().isOk())
                .andExpect(jsonPath("$.roles[0]").value("ROLE_ADMIN"));
        mvc.perform(put("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\"Admin Updated\",\"roles\":[]}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.roles[0]").value("ROLE_ADMIN"));
        mvc.perform(get("/api/v1/profile"))
                .andExpect(jsonPath("$.roles[0]").value("ROLE_ADMIN"));
    }

    @Test
    @WithMockUser(username = "profile@example.com")
    void rejectsInvalidFields() throws Exception {
        mvc.perform(put("/api/v1/profile").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fullName\":\" \",\"phone\":\"not a number\"}"))
                .andExpect(status().isBadRequest());
        assertEquals("Old address", users.findByEmail("profile@example.com").orElseThrow().getAddress());
    }
}