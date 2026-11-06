package com.example.library.service;

import com.example.library.entity.User;
import com.example.library.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PasswordRecoveryServiceTest {
    @Test
    void codesAreLimitedAndSingleUse() {
        var users = mock(UserRepository.class);
        var sender = mock(ReaderEmailListener.class);
        @SuppressWarnings("unchecked")
        var mail = (ObjectProvider<ReaderEmailListener>) mock(ObjectProvider.class);
        when(mail.getIfAvailable()).thenReturn(sender);
        var encoder = new BCryptPasswordEncoder();
        var events = mock(ApplicationEventPublisher.class);
        var service = new PasswordRecoveryService(users, encoder, mail, Runnable::run, events);
        String email = "reader@example.com";
        var user = User.builder().email(email).password(encoder.encode("old-password")).build();
        when(users.findByEmailIgnoreCase(email)).thenReturn(Optional.of(user));
        when(users.findForUpdateByEmail(email)).thenReturn(Optional.of(user));
        var message = ArgumentCaptor.forClass(ReaderEmail.class);

        service.requestCode(email.toUpperCase(java.util.Locale.ROOT), "127.0.0.1");
        service.requestCode(email, "127.0.0.2");
        verify(sender).send(message.capture());
        assertEquals(email, message.getValue().recipient());
        var match = Pattern.compile("[0-9]{6}").matcher(message.getValue().body());
        assertTrue(match.find());
        String code = match.group();
        String wrong = code.equals("000000") ? "111111" : "000000";
        assertThrows(IllegalArgumentException.class, () -> service.reset(email, wrong, "new-password"));
        assertTrue(encoder.matches("old-password", user.getPassword()));
        service.reset(email, code, "new-password");
        assertTrue(encoder.matches("new-password", user.getPassword()));
        assertThrows(IllegalArgumentException.class, () -> service.reset(email, code, "another-password"));
        verify(events).publishEvent(any(ReaderEmail.class));
    }
}
