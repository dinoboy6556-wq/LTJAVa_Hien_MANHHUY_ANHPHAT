package com.example.library.service;

import com.example.library.dto.SaleCreateRequest;
import com.example.library.dto.SaleItemRequest;
import com.example.library.entity.*;
import com.example.library.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class SaleServiceTest {

    @Mock
    private SaleRepository saleRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private UserRepository userRepository;

    @Mock private BookCopyService copyService;

    @InjectMocks
    private SaleService saleService;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin@library.com");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    public void testCreateSaleSuccess() {
        User user = User.builder().id(1L).email("admin@library.com").build();
        Book book = Book.builder().id(1L).title("Clean Code").availableQuantity(5).salePrice(new BigDecimal("200000")).build();

        when(userRepository.findByEmail("admin@library.com")).thenReturn(Optional.of(user));
        when(copyService.lockBook(1L)).thenReturn(book);
        when(copyService.take(1L, 2, BookCopyStatus.SOLD)).thenReturn(List.of(
                BookCopy.builder().id(1L).code("B1-00001").build(),
                BookCopy.builder().id(2L).code("B1-00002").build()));
        when(saleRepository.save(any(Sale.class))).thenAnswer(i -> i.getArguments()[0]);

        SaleCreateRequest req = new SaleCreateRequest();
        SaleItemRequest itemReq = new SaleItemRequest();
        itemReq.setBookId(1L);
        itemReq.setQuantity(2);
        req.setItems(List.of(itemReq));

        Sale sale = saleService.createSale(req);
        assertNotNull(sale);
        assertEquals(new BigDecimal("400000"), sale.getTotalAmount());
        assertEquals(2, sale.getItems().size());
        assertEquals("B1-00001", sale.getItems().get(0).getCopy().getCode());
        assertEquals(1, sale.getItems().get(0).getQuantity());
        verify(copyService).take(1L, 2, BookCopyStatus.SOLD);
    }
}
