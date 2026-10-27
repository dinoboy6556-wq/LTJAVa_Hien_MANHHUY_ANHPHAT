package com.example.library.controller;

import com.example.library.entity.AuditLog;
import com.example.library.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    private final AuditLogRepository logs;
    public AuditLogController(AuditLogRepository logs) { this.logs = logs; }
    @GetMapping
    public Page<AuditLog> list(@RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "50") int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.min(200, Math.max(1, size));
        return logs.findAllByOrderByCreatedAtDesc(PageRequest.of(safePage, safeSize));
    }
}
