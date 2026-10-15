package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BookCreateRequest {
    @NotBlank(message = "Tên sách không được để trống")
    private String title;

    private String isbn;
    private Long categoryId;
    private Long authorId;
    private Long publisherId;

    @NotNull
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer totalQuantity;

    @NotNull
    private BigDecimal rentalPrice;

    @NotNull
    private BigDecimal salePrice;
}
