package com.example.library.controller;

import com.example.library.dto.SaleCreateRequest;
import com.example.library.entity.Sale;
import com.example.library.service.SaleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sales")
public class SaleController {

    @Autowired
    private SaleService saleService;

    @PostMapping
    public ResponseEntity<Sale> createSale(@Valid @RequestBody SaleCreateRequest request) {
        return ResponseEntity.ok(saleService.createSale(request));
    }
}
