package com.example.library.controller;

import com.example.library.entity.*;
import com.example.library.repository.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
@Transactional(readOnly = true)
public class AdminReportController {
    private final BookRepository books;
    private final LoanRepository loans;
    private final SaleRepository sales;
    private final FineRepository fines;
    public AdminReportController(BookRepository books, LoanRepository loans, SaleRepository sales, FineRepository fines) {
        this.books = books; this.loans = loans; this.sales = sales; this.fines = fines;
    }

    @GetMapping("/{type}.csv")
    public ResponseEntity<byte[]> export(@PathVariable String type) {
        String csv = switch (type) {
            case "books" -> booksCsv();
            case "loans" -> loansCsv();
            case "sales" -> salesCsv();
            case "fines" -> finesCsv();
            default -> throw new IllegalArgumentException("Loại báo cáo không hợp lệ");
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=library-" + type + ".csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(("\uFEFF" + csv).getBytes(StandardCharsets.UTF_8));
    }

    private String booksCsv() {
        StringBuilder out = new StringBuilder("id,title,isbn,total_quantity,available_quantity,status\n");
        books.findAll().forEach(b -> row(out, b.getId(), b.getTitle(), b.getIsbn(), b.getTotalQuantity(), b.getAvailableQuantity(), b.getStatus()));
        return out.toString();
    }
    private String loansCsv() {
        StringBuilder out = new StringBuilder("id,member_email,borrow_date,due_date,return_date,status,rental_fee,fine_amount,renewal_count\n");
        loans.findAll().forEach(l -> row(out, l.getId(), l.getUser().getEmail(), l.getBorrowDate(), l.getDueDate(), l.getReturnDate(), l.getStatus(), l.getRentalFee(), l.getFineAmount(), l.getRenewalCount()));
        return out.toString();
    }
    private String salesCsv() {
        StringBuilder out = new StringBuilder("id,member_email,created_at,total_amount\n");
        sales.findAll().forEach(s -> row(out, s.getId(), s.getUser().getEmail(), s.getCreatedAt(), s.getTotalAmount()));
        return out.toString();
    }
    private String finesCsv() {
        StringBuilder out = new StringBuilder("id,loan_id,member_email,amount,paid,reason,created_at\n");
        fines.findAll().forEach(f -> row(out, f.getId(), f.getLoan().getId(), f.getLoan().getUser().getEmail(), f.getAmount(), f.getPaid(), f.getReason(), f.getCreatedAt()));
        return out.toString();
    }
    private void row(StringBuilder out, Object... values) {
        List<String> cells = java.util.Arrays.stream(values).map(v -> {
            String value = v == null ? "" : v.toString();
            if (!value.isEmpty() && "=+-@\t\r".indexOf(value.charAt(0)) >= 0) value = "'" + value;
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }).toList();
        out.append(String.join(",", cells)).append('\n');
    }
}
