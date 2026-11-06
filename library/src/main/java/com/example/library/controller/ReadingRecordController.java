package com.example.library.controller;

import com.example.library.service.BookParticipationService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/content/read")
public class ReadingRecordController {
    private final BookParticipationService participation;
    public ReadingRecordController(BookParticipationService participation) { this.participation = participation; }
    @PostMapping("/{slug}/record")
    public Map<String, String> record(@PathVariable String slug, Authentication auth) {
        participation.recordReading(auth.getName(), slug);
        return Map.of("message", "Đã lưu sách đã đọc. Bạn có thể đánh giá đầu sách này.");
    }
}
