package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BookCreateRequest {
    @NotBlank
    @jakarta.validation.constraints.Size(max=255)
    private String title;
    @jakarta.validation.constraints.Size(max=30)
    private String isbn;
    @jakarta.validation.constraints.Size(max=1000) @jakarta.validation.constraints.Pattern(regexp="^$|https?://\\S+|/images/[A-Za-z0-9/_.-]+",message="Ảnh bìa phải là http/https hoặc đường dẫn /images/")
    private String coverImageUrl;
    @jakarta.validation.constraints.Size(max=4000)
    private String description;
    private Long categoryId;
    private Long authorId;
    private Long publisherId;

    @NotNull @Min(1) @jakarta.validation.constraints.Max(1000)
    private Integer totalQuantity;

    @NotNull
    @jakarta.validation.constraints.DecimalMin("0") @jakarta.validation.constraints.Digits(integer=10,fraction=2)
    private BigDecimal rentalPrice;

    @NotNull
    @jakarta.validation.constraints.DecimalMin("0") @jakarta.validation.constraints.Digits(integer=10,fraction=2)
    private BigDecimal salePrice;
}
