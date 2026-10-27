package com.example.library.controller;

import com.example.library.entity.Publisher;
import com.example.library.service.PublisherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/v1/publishers")
public class PublisherController {
    @Autowired
    private PublisherService publisherService;

    @GetMapping
    public ResponseEntity<List<Publisher>> getAll() {
        return ResponseEntity.ok(publisherService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LIBRARIAN')")
    public ResponseEntity<Publisher> create(@RequestBody Publisher publisher) {
        return ResponseEntity.ok(publisherService.create(publisher));
    }
}
