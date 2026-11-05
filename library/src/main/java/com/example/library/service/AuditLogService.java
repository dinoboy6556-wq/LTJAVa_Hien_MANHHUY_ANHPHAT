package com.example.library.service;

import com.example.library.entity.AuditLog;
import com.example.library.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
    private final AuditLogRepository logs;
    public AuditLogService(AuditLogRepository logs) { this.logs = logs; }
    @Transactional
    public void record(String actor, String action, String target) {
        logs.save(AuditLog.builder().actor(actor).action(action).target(target).build());
    }
}
