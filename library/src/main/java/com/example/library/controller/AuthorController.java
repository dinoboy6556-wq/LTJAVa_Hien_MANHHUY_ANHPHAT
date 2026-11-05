package com.example.library.controller;

import com.example.library.entity.Author;
import com.example.library.service.AuthorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/authors")
public class AuthorController {
    @Autowired
    private AuthorService authorService;

    @GetMapping
    public ResponseEntity<List<Author>> getAll() {
        return ResponseEntity.ok(authorService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Author> create(@RequestBody Author author) {
        return ResponseEntity.ok(authorService.create(author));
    }
    @Autowired private com.example.library.repository.AuthorRepository repository;
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public Author update(@PathVariable Long id,@RequestBody Author input) {
        if(input.getName()==null||input.getName().isBlank()||input.getName().length()>255)throw new IllegalArgumentException("Tên không hợp lệ");
        var item=repository.findById(id).orElseThrow(()->new com.example.library.exception.ResourceNotFoundException("Không tìm thấy dữ liệu"));
        item.setName(input.getName().trim());item.setBiography(input.getBiography());
        return repository.save(item);
    }
}
