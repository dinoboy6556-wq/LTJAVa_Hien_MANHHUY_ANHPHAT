# Nạp dữ liệu mẫu để kiểm thử

Từ thư mục gốc dự án, chuyển vào thư mục backend rồi chạy wrapper tại đó:

```powershell
cd .\library
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.seed.enabled=true --app.book-copies.migrate=true --app.seed.test-data=true"
```

Ứng dụng sẽ thêm 10 tài khoản độc giả, 10 tác giả, 10 thể loại, 10 đầu sách mới và 10 bình luận đánh giá gắn với các sách mẫu. Mỗi đầu sách có 3 mã quyển để thử luồng tồn kho. Seed cũng tạo dữ liệu liên kết cho mượn/trả, phí, thanh toán, yêu thích, cảm xúc, đăng ký chờ và bán sách. Dữ liệu được kiểm tra trước khi thêm nên có thể chạy lại mà không tạo trùng các bản ghi mẫu. Nội dung thư viện mẫu được tạo ở trạng thái nháp.

Tài khoản kiểm thử: `test01@library.local` đến `test10@library.local` — mật khẩu `test123`.

Sách mẫu có tiêu đề `Sách kiểm thử 01` đến `Sách kiểm thử 10`; tác giả và thể loại có tên `Tác giả kiểm thử 01` đến `10` và `Danh mục kiểm thử 01` đến `10`. Các bảng hoạt động khác được bổ sung dữ liệu mẫu để kiểm thử; `roles` giữ 3 vai trò theo thiết kế hệ thống.
