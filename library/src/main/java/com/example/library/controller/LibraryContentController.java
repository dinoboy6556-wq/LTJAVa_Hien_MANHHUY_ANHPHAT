package com.example.library.controller;
import com.example.library.entity.LibraryContent;import com.example.library.repository.*;
import org.springframework.web.bind.annotation.*;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.security.core.Authentication;import org.springframework.transaction.annotation.Transactional;import org.springframework.web.server.ResponseStatusException;import org.springframework.http.HttpStatus;import java.util.*;
@RestController @RequestMapping("/api/v1/content")
public class LibraryContentController {
 private final LibraryContentRepository repo;private final BookRepository books;
 public LibraryContentController(LibraryContentRepository repo,BookRepository books){this.repo=repo;this.books=books;}
 private void check(String kind,Authentication auth){if(!Set.of("POST","PAGE","EBOOK","CONFIG","MENU").contains(kind))throw new IllegalArgumentException("Loại nội dung không hợp lệ");if(Set.of("CONFIG","MENU").contains(kind)&&auth.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_ADMIN")))throw new org.springframework.security.access.AccessDeniedException("Chỉ admin được quản lý cấu hình và menu");}
 @GetMapping("/manage/{kind}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')") public List<LibraryContent> list(@PathVariable String kind,Authentication auth){check(kind,auth);return repo.findByKindOrderBySortOrderAscIdDesc(kind);}
 @PostMapping("/manage/{kind}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')") @Transactional
 public LibraryContent save(@PathVariable String kind,@RequestBody LibraryContent input,Authentication auth){
  check(kind,auth);if(input.getTitle()==null||input.getTitle().isBlank()||input.getTitle().length()>255||input.getSlug()==null||!input.getSlug().matches("[a-z0-9][a-z0-9-]{0,119}"))throw new IllegalArgumentException("Nhập tiêu đề và mã đường dẫn chữ thường không dấu, dùng dấu gạch ngang");
  if(input.getBody()!=null&&input.getBody().length()>1000000)throw new IllegalArgumentException("Nội dung tối đa 1 triệu ký tự");
  if(input.getLink()!=null&&!input.getLink().isBlank()&&(!input.getLink().matches("/user(?:/[a-zA-Z0-9/_-]*)?")||input.getLink().length()>500))throw new IllegalArgumentException("Liên kết phải là đường dẫn nội bộ /user/...");
  if(kind.equals("EBOOK")&&(input.getBookId()==null||!books.existsById(input.getBookId())))throw new IllegalArgumentException("Chọn đầu sách hợp lệ");
  var value=input.getId()==null?new LibraryContent():repo.findById(input.getId()).orElseThrow(()->new com.example.library.exception.ResourceNotFoundException("Không tìm thấy nội dung"));
  if(value.getId()!=null&&!kind.equals(value.getKind()))throw new IllegalArgumentException("Không thể đổi loại nội dung");
  value.setKind(kind);value.setTitle(input.getTitle().trim());value.setSlug(input.getSlug());value.setBody(input.getBody());value.setLink(input.getLink());value.setBookId(kind.equals("EBOOK")?input.getBookId():null);value.setPublished(input.isPublished());value.setSortOrder(input.getSortOrder());return repo.save(value);
 }
 @GetMapping("/public") public List<LibraryContent> published(){return repo.findByPublishedTrueOrderBySortOrderAscIdDesc().stream().filter(v->!v.getKind().equals("EBOOK")).toList();}
}
