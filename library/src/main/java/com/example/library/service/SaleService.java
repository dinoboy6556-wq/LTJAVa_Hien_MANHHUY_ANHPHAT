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

        for (SaleItemRequest itemReq : request.getItems()) {
            Book book = bookRepository.findById(itemReq.getBookId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sách không tồn tại: " + itemReq.getBookId()));

            if (book.getAvailableQuantity() < itemReq.getQuantity()) {
                throw new RuntimeException("Sách '" + book.getTitle() + "' không đủ tồn kho để bán! Cần: " 
                        + itemReq.getQuantity() + ", Còn: " + book.getAvailableQuantity());
            }

            book.setAvailableQuantity(book.getAvailableQuantity() - itemReq.getQuantity());
            if (book.getAvailableQuantity() == 0) {
                book.setStatus(BookStatus.OUT_OF_STOCK);
            }
            bookRepository.save(book);

            BigDecimal subtotal = book.getSalePrice().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            totalAmount = totalAmount.add(subtotal);

            SaleItem item = SaleItem.builder()
                    .sale(sale)
                    .book(book)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(book.getSalePrice())
                    .subtotal(subtotal)
                    .build();

            items.add(item);
        }

        sale.setTotalAmount(totalAmount);
        sale.setItems(items);

        return saleRepository.save(sale);
    }
}
