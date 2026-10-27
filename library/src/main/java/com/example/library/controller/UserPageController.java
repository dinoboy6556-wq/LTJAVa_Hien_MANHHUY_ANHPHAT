package com.example.library.controller;

import com.example.library.entity.Book;
import com.example.library.service.BookService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class UserPageController {
    private final BookService bookService;
    private final com.example.library.service.CatalogService catalog;
    private final com.example.library.service.BookCopyService copies;

    public UserPageController(BookService bookService, com.example.library.service.BookCopyService copies, com.example.library.service.CatalogService catalog) {
        this.catalog = catalog;
        this.copies = copies;
        this.bookService = bookService;
    }

    @GetMapping({"/", "/user"})
    public String home(Model model) {
        List<Book> books = bookService.getAllBooks();
        model.addAttribute("books", books.stream().limit(8).toList());
        model.addAttribute("totalBooks", books.size());
        return "user/home";
    }

    @GetMapping("/user/books")
    public String books(@RequestParam(defaultValue="") String q,
            @RequestParam(defaultValue="") String author, @RequestParam(defaultValue="") String category,
            @RequestParam(required=false) java.math.BigDecimal min, @RequestParam(required=false) java.math.BigDecimal max,
            @RequestParam(defaultValue="") String status, @RequestParam(defaultValue="title") String sort,
            @RequestParam(defaultValue="0") int page, Model model) {
        org.springframework.data.domain.Page<Book> results;
        try { results = catalog.search(q,author,category,min,max,status,sort,page); }
        catch (IllegalArgumentException ex) {
            results = org.springframework.data.domain.Page.empty(); model.addAttribute("filterError",ex.getMessage());
        }
        model.addAttribute("books",results.getContent()); model.addAttribute("result",results);
        model.addAttribute("q",q); model.addAttribute("author",author); model.addAttribute("category",category);
        model.addAttribute("min",min); model.addAttribute("max",max); model.addAttribute("status",status); model.addAttribute("sort",sort);
        return "user/books";
    }

    @GetMapping("/user/books/{id}")
    public String bookDetail(@PathVariable Long id, Model model) {
        model.addAttribute("book", bookService.getBookById(id));
        model.addAttribute("copies", copies.list(id));
        return "user/book-detail";
    }

    @GetMapping("/user/profile")
    public String profile() {
        return "user/profile";
    }

    @GetMapping("/user/login")
    public String login() {
        return "user/login";
    }

    @GetMapping("/user/register")
    public String register() {
        return "user/register";
    }

    @GetMapping("/user/borrowed")
    public String borrowed() {
        return "user/borrowed";
    }

    @GetMapping("/user/history")
    public String history() {
        return "user/history";
    }
}
