package com.example.library.service;

import com.example.library.dto.LoanCreateRequest;
import com.example.library.dto.LoanItemRequest;
import com.example.library.entity.*;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class LoanService {

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FineRepository fineRepository;

    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    public List<Loan> getMyLoans() {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));
        return loanRepository.findByUser(user);
    }

    @Transactional
    public Loan createLoan(LoanCreateRequest request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user"));

        Loan loan = new Loan();
        loan.setUser(user);
        loan.setBorrowDate(LocalDate.now());
        loan.setDueDate(LocalDate.now().plusDays(request.getDays() != null ? request.getDays() : 14));
        loan.setStatus(LoanStatus.BORROWED);
        loan.setFineAmount(BigDecimal.ZERO);

        List<LoanItem> items = new ArrayList<>();
        BigDecimal totalRentalFee = BigDecimal.ZERO;

        for (LoanItemRequest itemReq : request.getItems()) {
            Book book = bookRepository.findById(itemReq.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sách không tồn tại: " + itemReq.getBookId()));

            if (book.getAvailableQuantity() < itemReq.getQuantity()) {
                throw new RuntimeException("Sách '" + book.getTitle() + "' không đủ tồn kho để cho mượn!");
            }

            book.setAvailableQuantity(book.getAvailableQuantity() - itemReq.getQuantity());
            if (book.getAvailableQuantity() == 0) {
                book.setStatus(BookStatus.OUT_OF_STOCK);
            }
            bookRepository.save(book);

            BigDecimal rentalFee = book.getRentalPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalRentalFee = totalRentalFee.add(rentalFee);

            LoanItem item = LoanItem.builder()
                    .loan(loan)
                    .book(book)
                    .quantity(itemReq.getQuantity())
                    .rentalPrice(book.getRentalPrice())
                    .build();

            items.add(item);
        }

        loan.setRentalFee(totalRentalFee);
        loan.setItems(items);

        return loanRepository.save(loan);
    }

    @Transactional
    public Loan returnLoan(Long loanId) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn ID: " + loanId));

        if (loan.getStatus() == LoanStatus.RETURNED) {
            throw new RuntimeException("Phiếu mượn này đã được trả trước đó!");
        }

        LocalDate today = LocalDate.now();
        loan.setReturnDate(today);
        loan.setStatus(LoanStatus.RETURNED);

        // Calculate fine if overdue (10,000 VND / day per item)
        long overdueDays = ChronoUnit.DAYS.between(loan.getDueDate(), today);
        if (overdueDays > 0) {
            int totalBooks = loan.getItems().stream().mapToInt(LoanItem::getQuantity).sum();
            BigDecimal fineCalc = BigDecimal.valueOf(overdueDays * 10000L * totalBooks);
            loan.setFineAmount(fineCalc);

            Fine fine = Fine.builder()
                    .loan(loan)
                    .amount(fineCalc)
                    .reason("Trả sách quá hạn " + overdueDays + " ngày")
                    .paid(false)
                    .build();
            fineRepository.save(fine);
        }

        // Return books to inventory
        for (LoanItem item : loan.getItems()) {
            Book book = item.getBook();
            book.setAvailableQuantity(book.getAvailableQuantity() + item.getQuantity());
            if (book.getAvailableQuantity() > 0) {
                book.setStatus(BookStatus.AVAILABLE);
            }
            bookRepository.save(book);
        }

        return loanRepository.save(loan);
    }
}
