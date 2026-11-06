package com.example.library.service;

import com.example.library.dto.SaleCreateRequest;
import com.example.library.dto.SaleItemRequest;
import com.example.library.entity.PurchaseOrder;
import com.example.library.entity.PurchaseOrder.Status;
import com.example.library.exception.ResourceNotFoundException;
import com.example.library.repository.PurchaseOrderRepository;
import com.example.library.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class PurchaseOrderService {
    public record View(Long id, Long bookId, String title, String buyerEmail, int quantity,
                       BigDecimal unitPrice, BigDecimal total, Status status, LocalDateTime createdAt, Long saleId) {}

    private final PurchaseOrderRepository orders;
    private final UserRepository users;
    private final BookCopyService copies;
    private final SaleService sales;

    public PurchaseOrderService(PurchaseOrderRepository orders, UserRepository users, BookCopyService copies, SaleService sales) {
        this.orders = orders;
        this.users = users;
        this.copies = copies;
        this.sales = sales;
    }

    public List<View> mine(String email) {
        return orders.findByUser_EmailOrderByIdDesc(email).stream().map(this::view).toList();
    }

    public List<View> all() {
        return orders.findAllByOrderByIdDesc().stream().map(this::view).toList();
    }

    @Transactional
    public View create(String email, Long bookId, int quantity, BigDecimal expectedPrice, String requestKey) {
        var buyer = users.findForUpdateByEmail(email).orElseThrow(() -> new AccessDeniedException("Không có quyền đặt mua."));
        if (!buyer.isEnabled()) throw new AccessDeniedException("Tài khoản đã bị khóa.");
        var existing = orders.findByUser_IdAndRequestKey(buyer.getId(), requestKey);
        if (existing.isPresent()) {
            var order = existing.get();
            if (!order.getBook().getId().equals(bookId) || order.getQuantity() != quantity
                    || order.getUnitPrice().compareTo(expectedPrice) != 0)
                throw new IllegalStateException("Mã yêu cầu đã được dùng cho đơn khác.");
            return view(order);
        }

        var book = copies.lockBook(bookId);
        if (book.getSalePrice() == null || book.getSalePrice().signum() <= 0
                || book.getSalePrice().compareTo(expectedPrice) != 0)
            throw new IllegalStateException("Giá bán đã thay đổi hoặc sách chưa được mở bán. Vui lòng tải lại.");
        if (book.getAvailableQuantity() < quantity) throw new IllegalStateException("Không đủ sách để đặt mua.");

        var order = new PurchaseOrder();
        order.setUser(buyer);
        order.setBook(book);
        order.setQuantity(quantity);
        order.setUnitPrice(book.getSalePrice());
        order.setRequestKey(requestKey);
        return view(orders.save(order));
    }

    @Transactional
    public View confirm(Long id) {
        var order = lock(id);
        if (order.getStatus() == Status.PAID) return view(order);
        if (order.getStatus() != Status.PENDING) throw new IllegalStateException("Đơn đã hủy.");
        var book = copies.lockBook(order.getBook().getId());
        if (book.getSalePrice() == null || book.getSalePrice().compareTo(order.getUnitPrice()) != 0)
            throw new IllegalStateException("Giá bán đã đổi. Hãy hủy đơn và yêu cầu đặt lại trước khi thu tiền.");

        var item = new SaleItemRequest();
        item.setBookId(book.getId());
        item.setQuantity(order.getQuantity());
        var request = new SaleCreateRequest();
        request.setItems(List.of(item));
        order.setSale(sales.createForBuyer(request, order.getUser().getEmail()));
        order.setStatus(Status.PAID);
        return view(order);
    }

    @Transactional
    public View cancel(Long id, String ownerEmail) {
        var order = lock(id);
        if (ownerEmail != null && !order.getUser().getEmail().equals(ownerEmail))
            throw new AccessDeniedException("Bạn không có quyền hủy đơn này.");
        if (order.getStatus() == Status.PAID) throw new IllegalStateException("Đơn đã thanh toán.");
        order.setStatus(Status.CANCELLED);
        return view(order);
    }

    private PurchaseOrder lock(Long id) {
        return orders.lock(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn mua."));
    }

    private View view(PurchaseOrder order) {
        return new View(order.getId(), order.getBook().getId(), order.getBook().getTitle(), order.getUser().getEmail(),
                order.getQuantity(), order.getUnitPrice(), order.getUnitPrice().multiply(BigDecimal.valueOf(order.getQuantity())),
                order.getStatus(), order.getCreatedAt(), order.getSale() == null ? null : order.getSale().getId());
    }
}
