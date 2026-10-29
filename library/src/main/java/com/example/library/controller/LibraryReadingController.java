package com.example.library.controller;
import com.example.library.repository.LibraryContentRepository;import org.springframework.stereotype.Controller;import org.springframework.web.bind.annotation.*;import org.springframework.ui.Model;import org.springframework.web.server.ResponseStatusException;import org.springframework.http.HttpStatus;
@Controller public class LibraryReadingController {
 private final LibraryContentRepository repo;public LibraryReadingController(LibraryContentRepository repo){this.repo=repo;}
 @GetMapping("/user/library") public String library(Model model){model.addAttribute("entries",repo.findByPublishedTrueOrderBySortOrderAscIdDesc().stream().filter(c->java.util.Set.of("POST","PAGE","EBOOK").contains(c.getKind())).toList());return "user/library-content";}
 @GetMapping("/user/read/{slug}") public String read(@PathVariable String slug,Model model){var entry=repo.findBySlugAndPublishedTrue(slug).filter(c->java.util.Set.of("POST","PAGE","EBOOK").contains(c.getKind())).orElseThrow(()->new com.example.library.exception.ResourceNotFoundException("Không tìm thấy nội dung"));model.addAttribute("entry",entry);return "user/library-read";}
}
