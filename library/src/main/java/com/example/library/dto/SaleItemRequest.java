package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaleItemRequest {
    @NotNull
    private Long bookId;

    @NotNull
    @Min(value = 1)
    private Integer quantity;
}
