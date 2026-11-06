package com.example.library.controller;
import com.example.library.entity.LibraryContent;import com.example.library.repository.*;
import org.springframework.web.bind.annotation.*;import org.springframework.security.access.prepost.PreAuthorize;import org.springframework.security.core.Authentication;import org.springframework.transaction.annotation.Transactional;import org.springframework.web.server.ResponseStatusException;import org.springframework.http.HttpStatus;import java.util.*;
@RestController @RequestMapping("/api/v1/content")
public class LibraryContentController {
 private final LibraryContentRepository repo;private final BookRepository books;
 public LibraryContentController(LibraryContentRepository repo,BookRepository books){this.repo=repo;this.books=books;}
 private void check(String kind,Authentication auth){if(!Set.of("POST","PAGE","EBOOK","CONFIG","MENU").contains(kind))throw new IllegalArgumentException("Loại nội dung không hợp lệ");if(!kind.equals("EBOOK")&&auth.getAuthorities().stream().noneMatch(a->a.getAuthority().equals("ROLE_ADMIN")))throw new org.springframework.security.access.AccessDeniedException("Chỉ quản trị viên được quản lý nội dung này");}
 @GetMapping("/manage/{kind}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')") public List<LibraryContent> list(@PathVariable String kind,Authentication auth){check(kind,auth);return repo.findByKindOrderBySortOrderAscIdDesc(kind);}
 @PostMapping("/manage/{kind}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')") @Transactional
 public LibraryContent save(@PathVariable String kind,@RequestBody LibraryContent input,Authentication auth){
  check(kind,auth);if(input.getTitle()==null||input.getTitle().isBlank()||input.getTitle().length()>255||input.getSlug()==null||!input.getSlug().matches("[a-z0-9][a-z0-9-]{0,119}"))throw new IllegalArgumentException("Nhập tiêu đề và mã đường dẫn chữ thường không dấu, dùng dấu gạch ngang");
  if(input.getBody()!=null&&input.getBody().length()>1000000)throw new IllegalArgumentException("Nội dung tối đa 1 triệu ký tự");
  if(input.getLink()!=null&&!input.getLink().isBlank()&&!validLink(input.getLink()))throw new IllegalArgumentException("Liên kết phải là đường dẫn nội bộ hợp lệ: /books, /library, /read/..., /account/... hoặc /user/... cũ");
  if(kind.equals("MENU")&&(input.getLink()==null||input.getLink().isBlank()))throw new IllegalArgumentException("Menu cần có đường dẫn đích");
  if(Set.of("EBOOK","POST","PAGE").contains(kind)&&input.isPublished()&&(input.getBody()==null||input.getBody().isBlank()))throw new IllegalArgumentException("Nhập nội dung trước khi xuất bản");
  if(input.getSortOrder()<0||input.getSortOrder()>9999)throw new IllegalArgumentException("Thứ tự phải từ 0 đến 9999");
  if(kind.equals("CONFIG")){if(!Set.of("library-name","library-email","library-phone","library-address","library-hours","library-announcement").contains(input.getSlug()))throw new IllegalArgumentException("Khóa cấu hình không được hỗ trợ");if(input.getBody()==null||input.getBody().isBlank()||input.getBody().length()>500)throw new IllegalArgumentException("Giá trị cấu hình cần từ 1 đến 500 ký tự");}
  if(kind.equals("EBOOK")&&(input.getBookId()==null||!books.existsById(input.getBookId())))throw new IllegalArgumentException("Chọn đầu sách hợp lệ");
  var value=input.getId()==null?new LibraryContent():repo.findById(input.getId()).orElseThrow(()->new com.example.library.exception.ResourceNotFoundException("Không tìm thấy nội dung"));
  if(value.getId()!=null&&!kind.equals(value.getKind()))throw new IllegalArgumentException("Không thể đổi loại nội dung");
  value.setKind(kind);value.setTitle(input.getTitle().trim());value.setSlug(input.getSlug());value.setBody(input.getBody());value.setLink(input.getLink());value.setBookId(kind.equals("EBOOK")?input.getBookId():null);value.setPublished(input.isPublished());value.setSortOrder(input.getSortOrder());return repo.save(value);
 }

 public record Settings(@jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max=60) String name,
   @jakarta.validation.constraints.Email @jakarta.validation.constraints.Size(max=255) String email,
   @jakarta.validation.constraints.Pattern(regexp="[0-9+(). \\-]{0,30}",message="Số điện thoại không hợp lệ") String phone,
   @jakarta.validation.constraints.Size(max=500) String address,@jakarta.validation.constraints.Size(max=200) String hours,
   @jakarta.validation.constraints.Size(max=500) String announcement,boolean announcementVisible) {}
 private String settingValue(Map<String,LibraryContent> values,String key){var row=values.get(key);String v=row==null||row.getBody()==null?"":row.getBody().trim();if(v.startsWith("Chưa cập nhật")||v.startsWith("Thông tin demo")||v.startsWith("Thông tin, cần")||v.startsWith("Cập nhật giờ phục vụ"))return "";return v;}
 @GetMapping("/settings") @PreAuthorize("hasRole('ADMIN')") public Settings settings(){var values=repo.findByKindOrderBySortOrderAscIdDesc("CONFIG").stream().collect(java.util.stream.Collectors.toMap(LibraryContent::getSlug,v->v));return new Settings(settingValue(values,"library-name"),settingValue(values,"library-email"),settingValue(values,"library-phone"),settingValue(values,"library-address"),settingValue(values,"library-hours"),settingValue(values,"library-announcement"),values.containsKey("library-announcement")&&values.get("library-announcement").isPublished());}
 @PutMapping("/settings") @PreAuthorize("hasRole('ADMIN')") @Transactional
 public Settings updateSettings(@jakarta.validation.Valid @RequestBody Settings input){
  String[] keys={"library-name","library-email","library-phone","library-address","library-hours","library-announcement"};String[] titles={"Tên thư viện","Email liên hệ","Số điện thoại","Địa chỉ","Giờ mở cửa","Thông báo chung"};String[] values={input.name(),input.email(),input.phone(),input.address(),input.hours(),input.announcement()};
  var existing=repo.findByKindOrderBySortOrderAscIdDesc("CONFIG").stream().collect(java.util.stream.Collectors.toMap(LibraryContent::getSlug,v->v));
  for(int i=0;i<keys.length;i++){var row=existing.getOrDefault(keys[i],new LibraryContent());if(row.getId()==null)row.setSortOrder(40+i);row.setKind("CONFIG");row.setSlug(keys[i]);row.setTitle(titles[i]);row.setBody(values[i]==null?"":values[i].trim());row.setBookId(null);row.setLink("");row.setPublished(!row.getBody().isBlank()&&(i!=5||input.announcementVisible()));repo.save(row);}return settings();
 }
 private boolean validLink(String link){return link.length()<=500&&link.matches("/(?:|books(?:/[0-9]+)?|library|read/[a-z0-9-]+|account/(?:loans|history|favorites|profile)|cart|login|register|user(?:/[a-zA-Z0-9/_-]*)?)");}
 @DeleteMapping("/manage/{kind}/{id}") @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')") @Transactional
 public org.springframework.http.ResponseEntity<Void> delete(@PathVariable String kind,@PathVariable Long id,Authentication auth){check(kind,auth);var value=repo.findById(id).orElseThrow(()->new com.example.library.exception.ResourceNotFoundException("Không tìm thấy nội dung"));if(!kind.equals(value.getKind()))throw new IllegalArgumentException("Loại nội dung không khớp");if(value.isPublished())throw new IllegalStateException("Ẩn nội dung trước khi xóa");String old="/read/"+value.getSlug();if(repo.findByKindOrderBySortOrderAscIdDesc("MENU").stream().anyMatch(m->old.equals(m.getLink())||("/user/read/"+value.getSlug()).equals(m.getLink())))throw new IllegalStateException("Còn menu trỏ tới nội dung, hãy sửa hoặc xóa menu trước");repo.delete(value);return org.springframework.http.ResponseEntity.noContent().build();}
 @GetMapping("/public") public List<LibraryContent> published(){return repo.findByPublishedTrueOrderBySortOrderAscIdDesc().stream().filter(v->!v.getKind().equals("EBOOK")).toList();}
 @GetMapping("/catalog") public List<LibraryContent> catalog(){return repo.findByPublishedTrueOrderBySortOrderAscIdDesc().stream().filter(v->Set.of("EBOOK","POST","PAGE").contains(v.getKind())).map(v->{LibraryContent summary=new LibraryContent();summary.setId(v.getId());summary.setKind(v.getKind());summary.setTitle(v.getTitle());summary.setSlug(v.getSlug());summary.setBookId(v.getBookId());summary.setPublished(true);summary.setBody(v.getBody()==null?"":v.getBody().substring(0,Math.min(220,v.getBody().length())));return summary;}).toList();}
 @GetMapping("/read/{slug}") public LibraryContent read(@PathVariable String slug){return repo.findBySlugAndPublishedTrue(slug).filter(v->Set.of("EBOOK","POST","PAGE").contains(v.getKind())).orElseThrow(()->new com.example.library.exception.ResourceNotFoundException("Không tìm thấy nội dung"));}
}
