package com.example.library.dto;

import com.example.library.entity.BookReturnCondition;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LoanReturnRequest {
    @NotNull
    private BookReturnCondition condition = BookReturnCondition.NORMAL;

    private String note;
    private java.util.List<Long> itemIds;
}
