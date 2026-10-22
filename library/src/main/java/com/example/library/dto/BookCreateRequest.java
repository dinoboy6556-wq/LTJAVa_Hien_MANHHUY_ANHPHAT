package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BookCreateRequest {
    @NotBlank
    private String title;
    private String isbn;
    private Long categoryId;
    private Long authorId;
    private Long publisherId;

    @NotNull @Min(1)
    private Integer totalQuantity;

    @NotNull
    private BigDecimal rentalPrice;

    @NotNull
    private BigDecimal salePrice;
}
