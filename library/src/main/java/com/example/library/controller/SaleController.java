package com.example.library.controller;

import com.example.library.dto.SaleCreateRequest;
import com.example.library.entity.Sale;
import com.example.library.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/sales")
public class SaleController {

    @Autowired
    private SaleService saleService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Sale>> getAllSales() {
        return ResponseEntity.ok(saleService.getAllSales());
    }

    public record CounterSale(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Email String buyerEmail, @jakarta.validation.constraints.NotNull @Valid SaleCreateRequest order, @jakarta.validation.constraints.AssertTrue(message="Chỉ lập hóa đơn sau khi xác nhận đã thu tiền") boolean paymentCollected) {}
    @PostMapping("/counter") @PreAuthorize("hasRole('ADMIN')")
    public Sale counter(@Valid @RequestBody CounterSale request){return saleService.createForBuyer(request.order(),request.buyerEmail().trim().toLowerCase(java.util.Locale.ROOT));}

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Sale> createSale(@Valid @RequestBody SaleCreateRequest request) {
        return ResponseEntity.ok(saleService.createSale(request));
    }
}
