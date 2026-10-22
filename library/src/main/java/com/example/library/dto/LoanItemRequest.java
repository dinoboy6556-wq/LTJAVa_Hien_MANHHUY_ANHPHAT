package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoanItemRequest {
    @NotNull
    private Long bookId;

    @NotNull @Min(1)
    private Integer quantity;
}
