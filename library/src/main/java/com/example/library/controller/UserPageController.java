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

    public UserPageController(BookService bookService) {
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
    public String books(@RequestParam(required = false) String q, Model model) {
        List<Book> books = bookService.getAllBooks();
        if (q != null && !q.isBlank()) {
            String keyword = q.trim().toLowerCase();
            books = books.stream().filter(b ->
                    (b.getTitle() != null && b.getTitle().toLowerCase().contains(keyword)) ||
                    (b.getAuthor() != null && b.getAuthor().getName() != null && b.getAuthor().getName().toLowerCase().contains(keyword)) ||
                    (b.getCategory() != null && b.getCategory().getName() != null && b.getCategory().getName().toLowerCase().contains(keyword))
            ).collect(Collectors.toList());
        }
        model.addAttribute("books", books);
        model.addAttribute("q", q == null ? "" : q);
        return "user/books";
    }

    @GetMapping("/user/books/{id}")
    public String bookDetail(@PathVariable Long id, Model model) {
        model.addAttribute("book", bookService.getBookById(id));
        return "user/book-detail";
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
