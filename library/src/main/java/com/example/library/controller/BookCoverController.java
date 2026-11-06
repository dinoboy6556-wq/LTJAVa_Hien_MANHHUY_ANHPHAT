package com.example.library.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.core.io.FileSystemResource;
import java.nio.file.*;import java.io.*;import java.util.*;import java.util.concurrent.TimeUnit;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;import java.awt.Color;import java.awt.RenderingHints;
@RestController
public class BookCoverController {
 @Value("${app.upload.book-covers:./uploads/book-covers}") private String directory;
 @PostMapping(value="/api/v1/books/cover-upload",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 @PreAuthorize("hasAnyRole('ADMIN','LIBRARIAN')")
 public Map<String,String> upload(@RequestParam("file") MultipartFile file) throws IOException {
  if(file.isEmpty()||file.getSize()>2*1024*1024)throw new IllegalArgumentException("Ảnh phải từ 1 byte đến 2 MB, định dạng JPG hoặc PNG");
  BufferedImage image;
  try(var stream=ImageIO.createImageInputStream(new ByteArrayInputStream(file.getBytes()))){
   var readers=ImageIO.getImageReaders(stream);if(!readers.hasNext())throw new IllegalArgumentException("Tệp không phải ảnh JPG hoặc PNG hợp lệ");var reader=readers.next();
   try{String format=reader.getFormatName().toLowerCase(Locale.ROOT);if(!List.of("jpeg","jpg","png").contains(format))throw new IllegalArgumentException("Chỉ hỗ trợ ảnh JPG và PNG");reader.setInput(stream);int w=reader.getWidth(0),h=reader.getHeight(0);if(w<1||h<1||w>6000||h>6000||(long)w*h>12000000)throw new IllegalArgumentException("Ảnh quá lớn: tối đa 12 triệu điểm ảnh và mỗi chiều 6000 px");image=reader.read(0);}finally{reader.dispose();}
  }catch(javax.imageio.IIOException e){throw new IllegalArgumentException("Không đọc được ảnh, vui lòng chọn tệp JPG/PNG khác");}
  double ratio=Math.min(1,Math.min(900.0/image.getWidth(),1350.0/image.getHeight()));var clean=new BufferedImage(Math.max(1,(int)(image.getWidth()*ratio)),Math.max(1,(int)(image.getHeight()*ratio)),BufferedImage.TYPE_INT_RGB);var g=clean.createGraphics();g.setColor(Color.WHITE);g.fillRect(0,0,clean.getWidth(),clean.getHeight());g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);g.drawImage(image,0,0,clean.getWidth(),clean.getHeight(),null);g.dispose();
  Path root=Path.of(directory).toAbsolutePath().normalize();Files.createDirectories(root);String name=UUID.randomUUID().toString().replace("-","")+".png";Path target=root.resolve(name);try(var out=Files.newOutputStream(target,StandardOpenOption.CREATE_NEW)){if(!ImageIO.write(clean,"png",out))throw new IOException("Không thể lưu ảnh");}return Map.of("url","/images/book-covers/"+name);
 }
 @GetMapping("/images/book-covers/{name}")
 public ResponseEntity<FileSystemResource> image(@PathVariable String name){if(!name.matches("[a-f0-9]{32}\\.png"))return ResponseEntity.notFound().build();Path target=Path.of(directory).toAbsolutePath().normalize().resolve(name);if(!Files.isRegularFile(target))return ResponseEntity.notFound().build();return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).cacheControl(CacheControl.maxAge(365,TimeUnit.DAYS).cachePublic()).body(new FileSystemResource(target));}
}
