package com.example.library.controller;

import com.example.library.entity.Category;
import com.example.library.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
    @Autowired
    private CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(categoryService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Category> create(@jakarta.validation.Valid @RequestBody Category category) {
        return ResponseEntity.ok(categoryService.create(category));
    }
    @Autowired private com.example.library.repository.CategoryRepository repository;
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public Category update(@PathVariable Long id,@jakarta.validation.Valid @RequestBody Category input) {
        if(input.getName()==null||input.getName().isBlank()||input.getName().length()>255)throw new IllegalArgumentException("Tên không hợp lệ");
        var item=repository.findById(id).orElseThrow(()->new com.example.library.exception.ResourceNotFoundException("Không tìm thấy dữ liệu"));
        item.setName(input.getName().trim());item.setDescription(input.getDescription());
        return repository.save(item);
    }
    @Autowired private com.example.library.service.DeletionService deletion;
    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
    public ResponseEntity<Void> delete(@PathVariable Long id){deletion.deleteRelated("categories",id);return ResponseEntity.noContent().build();}
}
