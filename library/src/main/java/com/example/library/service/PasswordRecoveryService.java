package com.example.library.service;

import com.example.library.repository.UserRepository;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.task.TaskExecutor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Service
public class PasswordRecoveryService {
    private static final int MAX_ENTRIES = 10_000;
    private static final int MAX_GUESSES = 5;
    private static final String INVALID_CODE = "Mã xác nhận sai, đã hết hạn hoặc không còn hiệu lực.";
    private final SecureRandom random = new SecureRandom();
    private final SecretKeySpec codeKey = new SecretKeySpec(random.generateSeed(32), "HmacSHA256");
    private final Map<String, Instant> cooldowns = new HashMap<>();
    private final Map<String, Challenge> challenges = new HashMap<>();
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final ObjectProvider<ReaderEmailListener> mail;
    private final TaskExecutor executor;
    private final ApplicationEventPublisher events;

    private record Challenge(byte[] codeHash, String passwordHash, Instant expiresAt, int guesses) {}

    public PasswordRecoveryService(UserRepository users, PasswordEncoder encoder,
                                   ObjectProvider<ReaderEmailListener> mail,
                                   @Qualifier("applicationTaskExecutor") TaskExecutor executor,
                                   ApplicationEventPublisher events) {
        this.users = users;
        this.encoder = encoder;
        this.mail = mail;
        this.executor = executor;
        this.events = events;
    }

    public void requestCode(String email, String ip) {
        String key = normalize(email);
        if (!allowRequest(key, ip)) return;
        try {
            executor.execute(() -> issueCode(key));
        } catch (org.springframework.core.task.TaskRejectedException ignored) {
            // The same response is returned for all addresses.
        }
    }

    private synchronized boolean allowRequest(String email, String ip) {
        Instant now = Instant.now();
        cooldowns.values().removeIf(expiry -> !expiry.isAfter(now));
        String emailKey = "email:" + email;
        String ipKey = "ip:" + ip;
        if (cooldowns.size() >= MAX_ENTRIES || cooldowns.containsKey(emailKey) || cooldowns.containsKey(ipKey)) return false;
        cooldowns.put(emailKey, now.plusSeconds(60));
        cooldowns.put(ipKey, now.plusSeconds(10));
        return true;
    }

    private void issueCode(String email) {
        ReaderEmailListener sender = mail.getIfAvailable();
        if (sender == null) return;
        users.findByEmailIgnoreCase(email).filter(user -> user.isEnabled()).ifPresent(user -> {
            String code = String.format(Locale.ROOT, "%06d", random.nextInt(1_000_000));
            synchronized (this) {
                Instant now = Instant.now();
                challenges.values().removeIf(challenge -> !challenge.expiresAt().isAfter(now));
                if (challenges.size() >= MAX_ENTRIES) return;
                challenges.put(email, new Challenge(hashCode(email, code), user.getPassword(), now.plusSeconds(600), 0));
            }
            sender.send(ReaderEmail.passwordResetCode(user.getEmail(), code));
        });
    }

    @Transactional
    public void reset(String email, String code, String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new IllegalArgumentException("Mật khẩu mới không được vượt quá 72 byte.");
        String key = normalize(email);
        var user = users.findByEmailIgnoreCase(key).flatMap(account -> users.findForUpdateByEmail(account.getEmail())).filter(account -> account.isEnabled())
                .orElseThrow(() -> new IllegalArgumentException(INVALID_CODE));
        if (!consumeCode(key, code, user.getPassword())) throw new IllegalArgumentException(INVALID_CODE);
        user.setPassword(encoder.encode(password));
        users.save(user);
        events.publishEvent(ReaderEmail.passwordChanged(user.getEmail()));
    }

    private synchronized boolean consumeCode(String email, String code, String passwordHash) {
        Challenge challenge = challenges.get(email);
        if (challenge == null) return false;
        if (!challenge.expiresAt().isAfter(Instant.now()) || !challenge.passwordHash().equals(passwordHash)) {
            challenges.remove(email);
            return false;
        }
        if (MessageDigest.isEqual(hashCode(email, code), challenge.codeHash())) {
            challenges.remove(email);
            return true;
        }
        int guesses = challenge.guesses() + 1;
        if (guesses >= MAX_GUESSES) challenges.remove(email);
        else challenges.put(email, new Challenge(challenge.codeHash(), challenge.passwordHash(), challenge.expiresAt(), guesses));
        return false;
    }

    private byte[] hashCode(String email, String code) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(codeKey);
            return mac.doFinal((email + ":" + code).getBytes(StandardCharsets.UTF_8));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Không thể tạo mã xác nhận.", e);
        }
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
