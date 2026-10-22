package com.example.library.service;

import com.example.library.dto.LoanCreateRequest;
import com.example.library.dto.LoanItemRequest;
import com.example.library.dto.LoanReturnRequest;
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
        LoanReturnRequest request = new LoanReturnRequest();
        request.setCondition(BookReturnCondition.NORMAL);
        return returnLoan(loanId, request);
    }

    @Transactional
    public Loan returnLoan(Long loanId, LoanReturnRequest request) {
        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn ID: " + loanId));

        if (loan.getStatus() == LoanStatus.RETURNED) {
            throw new IllegalStateException("Phiếu mượn này đã được trả trước đó!");
        }

        BookReturnCondition condition = request == null || request.getCondition() == null
                ? BookReturnCondition.NORMAL : request.getCondition();

        LocalDate today = LocalDate.now();
        loan.setReturnDate(today);
        loan.setStatus(LoanStatus.RETURNED);

        long overdueDays = Math.max(0, ChronoUnit.DAYS.between(loan.getDueDate(), today));
        int totalBooks = loan.getItems().stream().mapToInt(LoanItem::getQuantity).sum();
        BigDecimal overdueFine = BigDecimal.valueOf(overdueDays * 10000L * totalBooks);
        BigDecimal conditionFine = BigDecimal.ZERO;

        if (condition == BookReturnCondition.DAMAGED) {
            conditionFine = BigDecimal.valueOf(50000L * totalBooks);
        } else if (condition == BookReturnCondition.LOST) {
            conditionFine = loan.getItems().stream()
                    .map(item -> item.getBook().getSalePrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal totalFine = overdueFine.add(conditionFine);
        loan.setFineAmount(totalFine);

        if (totalFine.compareTo(BigDecimal.ZERO) > 0) {
            String reason = "Phạt trả quá hạn: " + overdueDays + " ngày";
            if (condition == BookReturnCondition.DAMAGED) reason += "; sách bị hỏng";
            if (condition == BookReturnCondition.LOST) reason += "; sách bị mất";
            if (request != null && request.getNote() != null && !request.getNote().isBlank()) {
                reason += "; ghi chú: " + request.getNote().trim();
            }
            fineRepository.save(Fine.builder().loan(loan).amount(totalFine).reason(reason).paid(false).build());
        }

        // Chỉ sách nguyên vẹn mới được cộng lại số lượng sẵn có trong kho.
        if (condition == BookReturnCondition.NORMAL) {
            for (LoanItem item : loan.getItems()) {
                Book book = item.getBook();
                book.setAvailableQuantity(book.getAvailableQuantity() + item.getQuantity());
                if (book.getAvailableQuantity() > 0) book.setStatus(BookStatus.AVAILABLE);
                bookRepository.save(book);
            }
        }
        return loanRepository.save(loan);
    }
}
