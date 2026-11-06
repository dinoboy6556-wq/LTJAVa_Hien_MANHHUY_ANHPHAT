package com.example.library.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class SaleCreateRequest {
    @NotEmpty @jakarta.validation.constraints.Size(max=50)
    private List<@Valid SaleItemRequest> items;
}
