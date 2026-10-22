package com.example.library.service;

import com.example.library.dto.BookCreateRequest;
import com.example.library.entity.Book;
import com.example.library.entity.BookStatus;
import com.example.library.repository.BookRepository;
import com.example.library.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class BookServiceTest {

    @Mock
    private BookRepository bookRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private BookService bookService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGetAllBooks() {
        Book book = Book.builder().id(1L).title("Test Book").build();
        when(bookRepository.findAll()).thenReturn(List.of(book));

        List<Book> books = bookService.getAllBooks();
        assertEquals(1, books.size());
        assertEquals("Test Book", books.get(0).getTitle());
    }

    @Test
    public void testCreateBook() {
        BookCreateRequest req = new BookCreateRequest();
        req.setTitle("Spring Boot Guide");
        req.setTotalQuantity(5);
        req.setRentalPrice(new BigDecimal("10000"));
        req.setSalePrice(new BigDecimal("150000"));

        Book savedBook = Book.builder()
                .id(1L)
                .title("Spring Boot Guide")
                .totalQuantity(5)
                .availableQuantity(5)
                .status(BookStatus.AVAILABLE)
                .build();

        when(bookRepository.save(any(Book.class))).thenReturn(savedBook);

        Book result = bookService.createBook(req);
        assertNotNull(result);
        assertEquals("Spring Boot Guide", result.getTitle());
        assertEquals(5, result.getAvailableQuantity());
    }
}
