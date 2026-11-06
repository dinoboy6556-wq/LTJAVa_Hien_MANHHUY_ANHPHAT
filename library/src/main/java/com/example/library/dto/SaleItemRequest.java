package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaleItemRequest {
    @NotNull
    private Long bookId;

    @NotNull @Min(1) @jakarta.validation.constraints.Max(100)
    private Integer quantity;
}
