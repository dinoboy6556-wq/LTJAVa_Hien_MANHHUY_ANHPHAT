package com.example.library.controller;

import com.example.library.entity.Fine;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.FineRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/fines")
public class FineController {
    private final FineRepository fines;
    public FineController(FineRepository fines) { this.fines = fines; }

    @GetMapping("/my-fines")
    public List<Fine> myFines(Authentication auth) { return fines.findByLoan_User_EmailOrderByCreatedAtDesc(auth.getName()); }

    @PostMapping("/{id}/mark-paid")
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    @Transactional
    public Fine markPaid(@PathVariable Long id) {
        Fine fine = fines.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoản phạt"));
        fine.setPaid(true);
        return fines.save(fine);
    }
}
