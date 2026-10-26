package com.example.library.service;

import com.example.library.dto.LoanReturnRequest;
import com.example.library.entity.*;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoanReturnTest {
    @Mock private LoanRepository loanRepository;
    @Mock private BookRepository bookRepository;
    @Mock private UserRepository userRepository;
    @Mock private FineRepository fineRepository;
    @Mock private BookCopyService copyService;

    @InjectMocks private LoanService loanService;

    private Loan loan;
    private Book book;

    @BeforeEach
    void setUp() {
        book = Book.builder().id(1L).title("Java").availableQuantity(2)
                .salePrice(new BigDecimal("100000")).status(BookStatus.AVAILABLE).build();
        LoanItem item = LoanItem.builder().book(book).quantity(1).build();
        loan = Loan.builder().id(1L).dueDate(LocalDate.now().plusDays(3))
                .status(LoanStatus.BORROWED).items(List.of(item)).build();
        item.setLoan(loan);
    }

    @Test
    void normalReturnAddsBookBackToStock() {
        when(loanRepository.findForUpdate(1L)).thenReturn(Optional.of(loan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> inv.getArgument(0));
        LoanReturnRequest request = new LoanReturnRequest();
        request.setCondition(BookReturnCondition.NORMAL);

        loanService.returnLoan(1L, request);

        verify(copyService).returnCopy(loan.getItems().get(0), BookReturnCondition.NORMAL);
        verify(fineRepository, never()).save(any(Fine.class));
    }

    @Test
    void lostBookCreatesFineAndDoesNotAddToStock() {
        when(loanRepository.findForUpdate(1L)).thenReturn(Optional.of(loan));
        when(loanRepository.save(any(Loan.class))).thenAnswer(inv -> inv.getArgument(0));
        when(fineRepository.save(any(Fine.class))).thenAnswer(inv -> inv.getArgument(0));
        LoanReturnRequest request = new LoanReturnRequest();
        request.setCondition(BookReturnCondition.LOST);

        Loan returned = loanService.returnLoan(1L, request);

        verify(copyService).returnCopy(loan.getItems().get(0), BookReturnCondition.LOST);
        assertEquals(new BigDecimal("100000"), returned.getFineAmount());
        verify(fineRepository).save(any(Fine.class));
        verify(bookRepository, never()).save(any(Book.class));
    }

    @Test
    void returningAlreadyReturnedLoanIsRejected() {
        loan.setStatus(LoanStatus.RETURNED);
        when(loanRepository.findForUpdate(1L)).thenReturn(Optional.of(loan));
        assertThrows(IllegalStateException.class, () -> loanService.returnLoan(1L, new LoanReturnRequest()));
    }

    @Test
    void missingLoanIsReported() {
        when(loanRepository.findForUpdate(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> loanService.returnLoan(99L, new LoanReturnRequest()));
    }
}
