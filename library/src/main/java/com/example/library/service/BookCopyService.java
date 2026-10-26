package com.example.library.service;

import com.example.library.entity.*;
import com.example.library.repository.*;
import com.example.library.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional
public class BookCopyService {
    private final BookRepository books;
    private final BookCopyRepository copies;
    private final LoanItemRepository loanItems;
    public BookCopyService(BookRepository books, BookCopyRepository copies, LoanItemRepository loanItems) {
        this.books = books; this.copies = copies; this.loanItems = loanItems;
    }

    public Book lockBook(Long id) {
        return books.findForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách: " + id));
    }

    // Run in maintenance mode on existing databases; never infer damage/loss from a count.
    public void initialize(Long bookId) {
        Book book = lockBook(bookId);
        long existing = copies.countByBookId(bookId);
        if (existing > 0) {
            if (book.getTotalQuantity() == null || existing != book.getTotalQuantity() || !loanItems.findLegacyActive(bookId).isEmpty())
                throw new IllegalStateException("Dữ liệu mã quyển chưa nhất quán cho book " + bookId + ". Cần kiểm kê trước khi tiếp tục.");
            return;
        }
        List<LoanItem> legacy = loanItems.findLegacyActive(bookId);
        int borrowed = legacy.stream().mapToInt(LoanItem::getQuantity).sum();
        Integer total = book.getTotalQuantity(), available = book.getAvailableQuantity();
        if (total == null || available == null || total < 0 || available < 0 || (long) available + borrowed > total
                || legacy.stream().anyMatch(i -> i.getQuantity() < 1)) {
            throw new IllegalStateException("Tồn kho cũ không hợp lệ cho book " + bookId + ". Xem docs/BOOK_COPIES.md");
        }
        int sequence = 1;
        for (LoanItem original : legacy) {
            // Load the collection before INSERT, otherwise a lazy load can include the new row twice.
            List<LoanItem> loanLines = original.getLoan().getItems();
            loanLines.size();
            int quantity = original.getQuantity();
            original.setQuantity(1);
            original.setCopy(create(book, sequence++, BookCopyStatus.BORROWED));
            for (int n = 1; n < quantity; n++) {
                LoanItem split = LoanItem.builder().loan(original.getLoan()).book(book).quantity(1)
                        .rentalPrice(original.getRentalPrice()).copy(create(book, sequence++, BookCopyStatus.BORROWED)).build();
                loanItems.save(split);
                loanLines.add(split);
            }
        }
        for (int n = 0; n < available; n++) create(book, sequence++, BookCopyStatus.AVAILABLE);
        while (sequence <= total) create(book, sequence++, BookCopyStatus.UNAVAILABLE);
        sync(book);
    }

    private BookCopy create(Book book, long sequence, BookCopyStatus status) {
        return copies.save(BookCopy.builder().book(book).code("B" + book.getId() + "-" + String.format("%05d", sequence))
                .status(status).build());
    }

    public List<BookCopy> take(Long bookId, int quantity, BookCopyStatus status) {
        if (quantity < 1 || (status != BookCopyStatus.BORROWED && status != BookCopyStatus.SOLD))
            throw new IllegalArgumentException("Yêu cầu xuất sách không hợp lệ");
        Book book = lockBook(bookId);
        List<BookCopy> available = copies.findByBookIdAndStatusOrderByIdAsc(bookId, BookCopyStatus.AVAILABLE);
        if (available.size() < quantity) throw new IllegalStateException("Sách '" + book.getTitle() + "' không đủ bản sẵn có; hãy kiểm tra tồn kho/chuyển đổi dữ liệu.");
        List<BookCopy> selected = new ArrayList<>(available.subList(0, quantity));
        selected.forEach(copy -> copy.setStatus(status));
        sync(book);
        return selected;
    }

    public void returnCopy(LoanItem item, BookReturnCondition condition) {
        Book book = lockBook(item.getBook().getId());
        if (item.getCopy() == null) throw new IllegalStateException("Phiếu cũ chưa gắn mã quyển. Chạy chuyển đổi book copies trước khi trả.");
        BookCopy copy = copies.findById(item.getCopy().getId()).orElseThrow();
        if (copy.getStatus() != BookCopyStatus.BORROWED) throw new IllegalStateException("Quyển sách không ở trạng thái đang mượn: " + copy.getCode());
        copy.setStatus(switch (condition) {
            case NORMAL -> BookCopyStatus.AVAILABLE;
            case DAMAGED -> BookCopyStatus.DAMAGED;
            case LOST -> BookCopyStatus.LOST;
        });
        sync(book);
    }

    private void sync(Book book) {
        copies.flush();
        int available = Math.toIntExact(copies.countByBookIdAndStatus(book.getId(), BookCopyStatus.AVAILABLE));
        book.setAvailableQuantity(available);
        book.setStatus(available > 0 ? BookStatus.AVAILABLE : BookStatus.OUT_OF_STOCK);
        books.save(book);
    }

    @Transactional(readOnly = true)
    public List<BookCopy> list(Long bookId) {
        if (!books.existsById(bookId)) throw new ResourceNotFoundException("Không tìm thấy sách: " + bookId);
        return copies.findByBookIdOrderByIdAsc(bookId);
    }

    public List<BookCopy> add(Long bookId, int quantity) {
        Book book = lockBook(bookId);
        long count = copies.countByBookId(bookId);
        if (count != book.getTotalQuantity()) throw new IllegalStateException("Cần chuyển đổi/kiểm kê trước khi thêm quyển");
        if (quantity < 1 || quantity > 1000) throw new IllegalArgumentException("Mỗi lần thêm từ 1 đến 1000 quyển");
        for (int n = 1; n <= quantity; n++) create(book, count + n, BookCopyStatus.AVAILABLE);
        book.setTotalQuantity(Math.addExact(book.getTotalQuantity(), quantity));
        sync(book);
        return copies.findByBookIdOrderByIdAsc(bookId);
    }

    public BookCopy reconcile(Long bookId, Long copyId, BookCopyStatus status) {
        Book book = lockBook(bookId);
        BookCopy copy = copies.findById(copyId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quyển sách"));
        if (!copy.getBook().getId().equals(bookId)) throw new IllegalArgumentException("Quyển không thuộc đầu sách này");
        if (copy.getStatus() == BookCopyStatus.BORROWED || copy.getStatus() == BookCopyStatus.SOLD
                || status == null || status == BookCopyStatus.BORROWED || status == BookCopyStatus.SOLD)
            throw new IllegalStateException("Trạng thái mượn/bán phải thay đổi qua nghiệp vụ tương ứng");
        copy.setStatus(status);
        sync(book);
        return copy;
    }
}
