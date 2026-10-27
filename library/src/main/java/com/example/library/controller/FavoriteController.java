package com.example.library.controller;

import com.example.library.entity.Favorite;
import com.example.library.entity.Book;
import com.example.library.entity.User;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.BookRepository;
import com.example.library.repository.FavoriteRepository;
import com.example.library.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/favorites")
public class FavoriteController {
    private final FavoriteRepository favorites;
    private final UserRepository users;
    private final BookRepository books;

    public FavoriteController(FavoriteRepository favorites, UserRepository users, BookRepository books) {
        this.favorites = favorites; this.users = users; this.books = books;
    }

    @GetMapping
    public List<Favorite> list(Authentication auth) { return favorites.findByUser_EmailOrderByCreatedAtDesc(auth.getName()); }

    @PutMapping("/{bookId}")
    public Favorite add(Authentication auth, @PathVariable Long bookId) {
        if (favorites.existsByUser_EmailAndBook_Id(auth.getName(), bookId))
            return favorites.findByUser_EmailOrderByCreatedAtDesc(auth.getName()).stream()
                    .filter(f -> f.getBook().getId().equals(bookId)).findFirst().orElseThrow();
        User user = users.findByEmail(auth.getName()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản"));
        Book book = books.findById(bookId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách"));
        return favorites.save(Favorite.builder().user(user).book(book).build());
    }

    @DeleteMapping("/{bookId}")
    public void remove(Authentication auth, @PathVariable Long bookId) { favorites.deleteByUser_EmailAndBook_Id(auth.getName(), bookId); }
}
