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
                .coverImageUrl(req.getCoverImageUrl())
                .description(req.getDescription())
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
    @Transactional
    public Book updateBook(Long id, BookCreateRequest req) {
        Book book=copyService.lockBook(id);
        book.setTitle(req.getTitle().trim());book.setIsbn(req.getIsbn());book.setDescription(req.getDescription());
        book.setCoverImageUrl(req.getCoverImageUrl());book.setRentalPrice(req.getRentalPrice());book.setSalePrice(req.getSalePrice());
        book.setCategory(req.getCategoryId()==null?null:categoryRepository.findById(req.getCategoryId()).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy thể loại")));
        book.setAuthor(req.getAuthorId()==null?null:authorRepository.findById(req.getAuthorId()).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy tác giả")));
        book.setPublisher(req.getPublisherId()==null?null:publisherRepository.findById(req.getPublisherId()).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy nhà xuất bản")));
        return bookRepository.save(book);
    }

}
