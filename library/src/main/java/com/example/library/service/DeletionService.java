package com.example.library.service;
import com.example.library.entity.*;import com.example.library.repository.*;import com.example.library.exception.ResourceNotFoundException;import jakarta.persistence.*;import org.springframework.stereotype.Service;import org.springframework.transaction.annotation.Transactional;import com.fasterxml.jackson.databind.ObjectMapper;import java.util.*;
@Service public class DeletionService {
 private final EntityManager em;private final BookRepository books;private final BookCopyRepository copies;private final CopyEventRepository events;private final ObjectMapper json;
 public DeletionService(EntityManager em,BookRepository books,BookCopyRepository copies,CopyEventRepository events,ObjectMapper json){this.em=em;this.books=books;this.copies=copies;this.events=events;this.json=json;}
 @Transactional public void deleteBook(Long id){
  var book=books.findForUpdate(id).orElseThrow(()->new ResourceNotFoundException("Không tìm thấy sách"));
  for(String entity:List.of("LoanItem","SaleItem","Favorite","Reservation","BookReview","BookReaction"))if(em.createQuery("select count(x) from "+entity+" x where x.book.id=:id",Long.class).setParameter("id",id).getSingleResult()>0)throw new IllegalStateException("Không thể xóa sách đã có phiếu mượn, hóa đơn, yêu thích, đăng ký chờ hoặc đánh giá. Hãy giữ lại để bảo toàn dữ liệu.");
  if(em.createQuery("select count(x) from LibraryContent x where x.bookId=:id",Long.class).setParameter("id",id).getSingleResult()>0)throw new IllegalStateException("Sách còn liên kết nội dung đọc online");
  for(var p:em.createQuery("select p from BorrowPayment p where p.status in ('PENDING','REVIEW_REQUIRED')",BorrowPayment.class).getResultList())try{for(var item:json.readTree(p.getRequestJson()).path("items"))if(item.path("bookId").asLong()==id)throw new IllegalStateException("Sách đang nằm trong giao dịch chờ xử lý");}catch(com.fasterxml.jackson.core.JsonProcessingException e){throw new IllegalStateException("Cần kiểm tra giao dịch chưa hoàn tất trước khi xóa");}
  var list=copies.findByBookIdOrderByIdAsc(id);
  for(var copy:list){if(copy.getStatus()!=BookCopyStatus.AVAILABLE)throw new IllegalStateException("Chỉ xóa đầu sách có toàn bộ quyển còn sẵn và chưa phát sinh nghiệp vụ");for(var event:events.findByCopyIdOrderByIdDesc(copy.getId()))if(event.getPreviousStatus()!=null)throw new IllegalStateException("Sách có lịch sử thay đổi tồn kho; không thể xóa");}
  for(var copy:list)events.deleteAll(events.findByCopyIdOrderByIdDesc(copy.getId()));events.flush();copies.deleteAll(list);copies.flush();books.delete(book);books.flush();
 }
 @Transactional public void deleteRelated(String kind,Long id){
  Class<?> type;String relation;switch(kind){case "categories"-> {type=Category.class;relation="category";}case "authors"->{type=Author.class;relation="author";}case "publishers"->{type=Publisher.class;relation="publisher";}default->throw new IllegalArgumentException("Loại dữ liệu không hợp lệ");}
  var entity=em.find(type,id,LockModeType.PESSIMISTIC_WRITE);if(entity==null)throw new ResourceNotFoundException("Không tìm thấy dữ liệu");
  if(em.createQuery("select count(b) from Book b where b."+relation+".id=:id",Long.class).setParameter("id",id).getSingleResult()>0)throw new IllegalStateException("Không thể xóa: còn sách đang sử dụng mục này. Chuyển sách sang mục khác trước.");em.remove(entity);em.flush();
 }
}
