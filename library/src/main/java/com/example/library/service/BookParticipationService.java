package com.example.library.service;

import com.example.library.entity.BookReading;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BookParticipationService {
    private final LoanRepository loans;
    private final SaleRepository sales;
    private final BookReadingRepository readings;
    private final UserRepository users;
    private final LibraryContentRepository contents;
    private final BookRepository books;

    public BookParticipationService(LoanRepository loans, SaleRepository sales, BookReadingRepository readings,
                                    UserRepository users, LibraryContentRepository contents, BookRepository books) {
        this.loans = loans;
        this.sales = sales;
        this.readings = readings;
        this.users = users;
        this.contents = contents;
        this.books = books;
    }

    public boolean canReview(String email, Long bookId) {
        var user = users.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        return loans.hasBookActivity(email, bookId) || sales.hasBookActivity(email, bookId)
                || readings.existsByUser_IdAndBook_Id(user.getId(), bookId);
    }

    @Transactional
    public void recordReading(String email, String slug) {
        var content = contents.findBySlugAndPublishedTrue(slug)
                .filter(value -> "EBOOK".equals(value.getKind()) && value.getBookId() != null)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách điện tử đã xuất bản."));
        var user = users.findForUpdateByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        if (readings.existsByUser_IdAndBook_Id(user.getId(), content.getBookId())) return;
        var reading = new BookReading();
        reading.setUser(user);
        reading.setBook(books.findById(content.getBookId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách.")));
        readings.save(reading);
    }
}
