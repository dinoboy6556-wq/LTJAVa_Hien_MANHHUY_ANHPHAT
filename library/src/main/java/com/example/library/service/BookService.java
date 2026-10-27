package com.example.library.service;

import com.example.library.dto.BookCreateRequest;
import com.example.library.entity.*;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookService {

    @Autowired
    private BookCopyService copyService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private AuthorRepository authorRepository;

    @Autowired
    private PublisherRepository publisherRepository;

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Book getBookById(Long id) {
        return bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));
    }

    @Transactional
    public Book createBook(BookCreateRequest req) {
        Category category = req.getCategoryId() != null ? 
            categoryRepository.findById(req.getCategoryId()).orElse(null) : null;
        Author author = req.getAuthorId() != null ? 
            authorRepository.findById(req.getAuthorId()).orElse(null) : null;
        Publisher publisher = req.getPublisherId() != null ? 
            publisherRepository.findById(req.getPublisherId()).orElse(null) : null;

        Book book = Book.builder()
                .title(req.getTitle())
                .isbn(req.getIsbn())
                .category(category)
                .author(author)
                .publisher(publisher)
                .totalQuantity(req.getTotalQuantity())
                .availableQuantity(req.getTotalQuantity())
                .rentalPrice(req.getRentalPrice())
                .salePrice(req.getSalePrice())
                .status(req.getTotalQuantity() > 0 ? BookStatus.AVAILABLE : BookStatus.OUT_OF_STOCK)
                .build();

        Book saved = bookRepository.save(book);
        copyService.initialize(saved.getId());
        return saved;
    }
}
