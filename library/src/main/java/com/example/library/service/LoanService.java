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
    private BookCopyService copyService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired private ReservationRepository reservations;

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

        for (LoanItemRequest itemReq : request.getItems().stream().sorted(java.util.Comparator.comparing(LoanItemRequest::getBookId)).toList()) {
            Book book = copyService.lockBook(itemReq.getBookId());
            List<BookCopy> selected = copyService.take(book.getId(), itemReq.getQuantity(), BookCopyStatus.BORROWED);

            BigDecimal rentalFee = book.getRentalPrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalRentalFee = totalRentalFee.add(rentalFee);

            for (BookCopy copy : selected) {
                LoanItem item = LoanItem.builder().loan(loan).book(book).copy(copy).quantity(1)
                        .rentalPrice(book.getRentalPrice())
                        .build();
                items.add(item);
            }
        }

        for (Long bookId : request.getItems().stream().map(LoanItemRequest::getBookId).distinct().toList()) {
            reservations.findByUser_EmailAndBook_Id(userEmail, bookId).ifPresent(reservations::delete);
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
        Loan loan = loanRepository.findForUpdate(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn ID: " + loanId));

        if (loan.getStatus() == LoanStatus.RETURNED) {
            throw new IllegalStateException("Phiếu mượn này đã được trả trước đó!");
        }

        BookReturnCondition condition = request == null || request.getCondition() == null
                ? BookReturnCondition.NORMAL : request.getCondition();

        List<LoanItem> remaining = loan.getItems().stream().filter(i -> i.getReturnedAt() == null).toList();
        List<Long> ids = request == null ? null : request.getItemIds();
        if (ids != null && (ids.isEmpty() || ids.stream().anyMatch(java.util.Objects::isNull)
                || new java.util.HashSet<>(ids).size() != ids.size()
                || ids.stream().anyMatch(id -> remaining.stream().noneMatch(i -> id.equals(i.getId())))))
            throw new IllegalArgumentException("Danh sách quyển trả không hợp lệ hoặc đã trả trước đó");
        List<LoanItem> selected = ids == null ? remaining : remaining.stream().filter(i -> ids.contains(i.getId())).toList();
        if (selected.isEmpty()) throw new IllegalStateException("Không còn quyển nào cần trả");
        LocalDate today = LocalDate.now();

        long overdueDays = Math.max(0, ChronoUnit.DAYS.between(loan.getDueDate(), today));
        int totalBooks = selected.stream().mapToInt(LoanItem::getQuantity).sum();
        BigDecimal overdueFine = BigDecimal.valueOf(overdueDays * 10000L * totalBooks);
        BigDecimal conditionFine = BigDecimal.ZERO;

        if (condition == BookReturnCondition.DAMAGED) {
            conditionFine = BigDecimal.valueOf(50000L * totalBooks);
        } else if (condition == BookReturnCondition.LOST) {
            conditionFine = selected.stream()
                    .map(item -> item.getBook().getSalePrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        BigDecimal totalFine = overdueFine.add(conditionFine);
        loan.setFineAmount((loan.getFineAmount() == null ? BigDecimal.ZERO : loan.getFineAmount()).add(totalFine));

        if (totalFine.compareTo(BigDecimal.ZERO) > 0) {
            String reason = "Phạt trả quá hạn: " + overdueDays + " ngày";
            if (condition == BookReturnCondition.DAMAGED) reason += "; sách bị hỏng";
            if (condition == BookReturnCondition.LOST) reason += "; sách bị mất";
            if (request != null && request.getNote() != null && !request.getNote().isBlank()) {
                reason += "; ghi chú: " + request.getNote().trim();
            }
            fineRepository.save(Fine.builder().loan(loan).amount(totalFine).reason(reason).paid(false).build());
        }

        for (LoanItem item : selected.stream().sorted(java.util.Comparator.comparing(i -> i.getBook().getId())).toList()) {
            copyService.returnCopy(item, condition);
            item.setReturnedAt(today);
            item.setReturnCondition(condition);
        }
        if (loan.getItems().stream().allMatch(i -> i.getReturnedAt() != null)) {
            loan.setReturnDate(today);
            loan.setStatus(LoanStatus.RETURNED);
        }
        return loanRepository.save(loan);
    }

    @Transactional
    public Loan renewLoan(Long loanId) {
        return renewLoan(loanId, 7);
    }

    @Transactional
    public Loan renewLoan(Long loanId, int days) {
        if (days < 1 || days > 7) throw new IllegalArgumentException("Chọn từ 1 đến 7 ngày gia hạn");
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        Loan loan = loanRepository.findForUpdate(loanId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu mượn ID: " + loanId));
        if (loan.getUser() == null || !email.equals(loan.getUser().getEmail()))
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền gia hạn phiếu mượn này");
        if (loan.getStatus() != LoanStatus.BORROWED || loan.getDueDate().isBefore(LocalDate.now()))
            throw new IllegalStateException("Chỉ có thể gia hạn phiếu đang mượn và chưa quá hạn");
        if (loan.getRenewalCount() != null && loan.getRenewalCount() >= 1)
            throw new IllegalStateException("Mỗi phiếu chỉ được gia hạn một lần");
        if (fineRepository.findByLoan(loan).stream().anyMatch(fine -> !Boolean.TRUE.equals(fine.getPaid())))
            throw new IllegalStateException("Hãy thanh toán khoản phạt trước khi gia hạn");
        loan.setDueDate(loan.getDueDate().plusDays(days));
        loan.setRenewalCount((loan.getRenewalCount() == null ? 0 : loan.getRenewalCount()) + 1);
        return loanRepository.save(loan);
    }
}
