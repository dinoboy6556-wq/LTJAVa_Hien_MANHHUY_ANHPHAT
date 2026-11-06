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
        return saleRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC,"createdAt","id"));
    }

    @Transactional
    public Sale createSale(SaleCreateRequest request) {
        return createForBuyer(request,SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Transactional
    public Sale createForBuyer(SaleCreateRequest request,String userEmail) {
        if(request==null||request.getItems()==null||request.getItems().isEmpty()||request.getItems().size()>50)throw new IllegalArgumentException("Chọn 1–50 đầu sách để bán");
        for(var line:request.getItems())if(line==null||line.getBookId()==null||line.getQuantity()==null||line.getQuantity()<1||line.getQuantity()>100)throw new IllegalArgumentException("Mỗi đầu sách có số lượng từ 1 đến 100");
        if(request.getItems().stream().map(SaleItemRequest::getBookId).distinct().count()!=request.getItems().size())throw new IllegalArgumentException("Đầu sách bị trùng, vui lòng gộp số lượng");
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin user"));

        if(!user.isEnabled())throw new IllegalStateException("Tài khoản người mua đã bị khóa");
        Sale sale = new Sale();
        sale.setUser(user);
        
        List<SaleItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (SaleItemRequest itemReq : request.getItems().stream().sorted(java.util.Comparator.comparing(SaleItemRequest::getBookId)).toList()) {
            Book book = copyService.lockBook(itemReq.getBookId());
            if(book.getSalePrice()==null||book.getSalePrice().signum()<=0)throw new IllegalArgumentException("Sách chưa có giá bán hợp lệ: "+book.getTitle());
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
