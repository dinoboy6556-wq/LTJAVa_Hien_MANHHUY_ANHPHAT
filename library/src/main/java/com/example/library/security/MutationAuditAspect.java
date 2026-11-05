package com.example.library.security;

import com.example.library.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class MutationAuditAspect {
    private final AuditLogService audit;
    public MutationAuditAspect(AuditLogService audit) { this.audit = audit; }

    @Around("within(@org.springframework.web.bind.annotation.RestController *)")
    public Object recordSuccessfulMutation(ProceedingJoinPoint joinPoint) throws Throwable {
        Object result = joinPoint.proceed();
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            String method = request.getMethod();
            if (!request.getRequestURI().startsWith("/api/v1/auth/")
                    && ("POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method))) {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                String actor = auth == null || !auth.isAuthenticated() ? "anonymous" : auth.getName();
                audit.record(actor, method, request.getRequestURI());
            }
        }
        return result;
    }
}
