package com.example.library.controller;

import com.example.library.service.PurchaseOrderService;
import com.example.library.service.PurchaseOrderService.View;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/purchase-orders")
public class PurchaseOrderController {
    public record OrderRequest(@NotNull @Positive Long bookId, @Min(1) @Max(100) int quantity,
                               @NotNull @Positive BigDecimal unitPrice,
                               @NotBlank @Pattern(regexp = "[0-9a-fA-F-]{36}") String requestKey) {}
    public record Confirmation(@AssertTrue(message = "Cần xác nhận đã thu đủ tiền.") boolean paymentCollected) {}

    private final PurchaseOrderService orders;

    public PurchaseOrderController(PurchaseOrderService orders) {
        this.orders = orders;
    }

    @PostMapping
    public View create(Authentication auth, @Valid @RequestBody OrderRequest request) {
        return orders.create(auth.getName(), request.bookId(), request.quantity(), request.unitPrice(), request.requestKey());
    }

    @GetMapping("/my")
    public List<View> mine(Authentication auth) {
        return orders.mine(auth.getName());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<View> all() {
        return orders.all();
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasRole('ADMIN')")
    public View confirm(@PathVariable Long id, @Valid @RequestBody Confirmation confirmation) {
        return orders.confirm(id);
    }

    @PostMapping("/{id}/cancel")
    public View cancel(@PathVariable Long id, Authentication auth) {
        boolean admin = auth.getAuthorities().stream().anyMatch(role -> role.getAuthority().equals("ROLE_ADMIN"));
        return orders.cancel(id, admin ? null : auth.getName());
    }
}
