package com.example.library.service;

import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {
    private static final int MAX_FAILURES = 5;
    private static final long WINDOW_SECONDS = 15 * 60;
    private record Attempts(int count, Instant expiresAt) {}
    private final ConcurrentHashMap<String, Attempts> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        Attempts current = attempts.get(normalize(key));
        if (current == null) return false;
        if (Instant.now().isAfter(current.expiresAt())) { attempts.remove(normalize(key), current); return false; }
        return current.count() >= MAX_FAILURES;
    }

    public void failed(String key) {
        String normalized = normalize(key);
        attempts.compute(normalized, (ignored, current) -> {
            Instant now = Instant.now();
            int count = current == null || now.isAfter(current.expiresAt()) ? 0 : current.count();
            return new Attempts(count + 1, now.plusSeconds(WINDOW_SECONDS));
        });
    }

    public void succeeded(String key) { attempts.remove(normalize(key)); }
    private String normalize(String key) { return key == null ? "" : key.trim().toLowerCase(java.util.Locale.ROOT); }
}
