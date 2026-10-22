package com.example.library.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class LoanCreateRequest {
    @NotEmpty
    private List<LoanItemRequest> items;

    @NotNull @Min(1)
    private Integer days = 14;
}
