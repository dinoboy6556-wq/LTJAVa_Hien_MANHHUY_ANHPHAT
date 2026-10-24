package com.example.library.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class SaleCreateRequest {
    @NotEmpty
    private List<@Valid SaleItemRequest> items;
}
