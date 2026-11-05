package com.example.library.service;

import com.example.library.dto.SaleCreateRequest;
import com.example.library.dto.SaleItemRequest;
import com.example.library.entity.*;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class SaleService {

    @Autowired
    private SaleRepository saleRepository;

    @Autowired
    private BookCopyService copyService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    @Transactional
    public Sale createSale(SaleCreateRequest request) {
        String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin user"));

        Sale sale = new Sale();
        sale.setUser(user);
        
        List<SaleItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : request.getItems().stream().sorted(java.util.Comparator.comparing(SaleItemRequest::getBookId)).toList()) {
            Book book = copyService.lockBook(itemReq.getBookId());
            List<BookCopy> selected = copyService.take(book.getId(), itemReq.getQuantity(), BookCopyStatus.SOLD);

            BigDecimal subtotal = book.getSalePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            for (BookCopy copy : selected) {
                SaleItem item = SaleItem.builder().sale(sale).book(book).copy(copy).quantity(1)
                        .unitPrice(book.getSalePrice())
                        .subtotal(book.getSalePrice()).build();
                items.add(item);
            }
        }

        sale.setTotalAmount(totalAmount);
        sale.setItems(items);

        return saleRepository.save(sale);
    }
}
