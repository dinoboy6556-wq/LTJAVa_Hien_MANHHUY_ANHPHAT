# Nạp dữ liệu mẫu để kiểm thử

Từ thư mục gốc dự án, chuyển vào thư mục backend rồi chạy wrapper tại đó:

```powershell
cd .\library
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--app.seed.enabled=true --app.book-copies.migrate=true --app.seed.test-data=true"
```

Ứng dụng sẽ thêm 10 tài khoản độc giả, 10 tác giả, 10 thể loại, 10 đầu sách mới và 10 bình luận đánh giá gắn với các sách mẫu. Mỗi đầu sách có 3 mã quyển để thử luồng tồn kho. Seed cũng tạo dữ liệu liên kết cho mượn/trả, phí, thanh toán, yêu thích, cảm xúc, đăng ký chờ và bán sách. Dữ liệu được kiểm tra trước khi thêm nên có thể chạy lại mà không tạo trùng các bản ghi mẫu. Nội dung thư viện mẫu được tạo ở trạng thái nháp.

Tài khoản kiểm thử: `test01@library.local` đến `test10@library.local` — mật khẩu `test123`.

Sách mẫu có tiêu đề `Sách kiểm thử 01` đến `Sách kiểm thử 10`; tác giả và thể loại có tên `Tác giả kiểm thử 01` đến `10` và `Danh mục kiểm thử 01` đến `10`. Các bảng hoạt động khác được bổ sung dữ liệu mẫu để kiểm thử; `roles` giữ 3 vai trò theo thiết kế hệ thống.

## Bộ dữ liệu demo theo rubric
Tham số `--app.seed.test-book-count=40` bổ sung 40 đầu sách kiểm thử (mỗi đầu sách 3 mã quyển). Có thể chọn từ 20 đến 200. Chỉ nạp khi bật `app.seed.test-data=true`; mặc định chạy web không tự thêm dữ liệu. Phần tài khoản và hoạt động vẫn 10 người để tạo mẫu có liên kết. Đây là giao dịch DEMO, không phải bằng chứng VNPay đã thanh toán ngân hàng. Chạy lại kiểm tra theo tên/email nên không nhân đôi sách mẫu.

## Bộ danh mục 20 sách – đã nạp local ngày 06/11/2026

Đã thêm 20 đầu sách mẫu, mỗi đầu sách 3–7 mã quyển (tổng 100 quyển), 5 thể loại, 5 tác giả và 5 nhà xuất bản mới. Các sách có quan hệ đầy đủ, phí mượn 5.000–24.000 đ / quyển /14 ngày, giá bán 60.000–250.000 đ. Không xóa/sửa sách cũ, không thêm bảng, không tạo tài khoản hoặc giao dịch thanh toán giả.

Sau khi nạp vào database local hiện tại: 23 đầu sách, 8 thể loại, 7 tác giả, 7 nhà xuất bản. Sách mới có mã minh họa DEMO-20261106-01 đến DEMO-20261106-20 trong trường isbn; đây không phải ISBN xuất bản thật. Tên tác giả/NXB có (Demo), nội dung hư cấu để kiểm thử. Mọi thể loại mẫu đều có sách để thử ràng buộc không được xóa khi còn liên kết.

Dữ liệu chia sẻ cho nhóm: `database/sample_catalog_20.json`. Sau khi chạy backend, từ thư mục gốc project nạp qua API:

```powershell
.\database\seed_catalog_20.ps1
```

Script hỏi mật khẩu quản trị, không lưu mật khẩu/token vào file. Có thể truyền `-AdminEmail` nếu dùng tài khoản khác, `-ApiBaseUrl` nếu backend khác cổng. Script nhận diện theo tên danh mục và mã DEMO của sách nên chạy lại không tạo trùng; không tự sửa đè dữ liệu đã chỉnh bằng giao diện. Không cần bật app.seed.test-data cho bộ này (seed cũ tạo bộ dữ liệu khác).

Đã kiểm tra chạy lại tạo 0 bản ghi mới, đủ 100 mã quyển, không có liên kết thể loại/tác giả/NXB bị thiếu và danh mục 23 sách chia 2 trang (12 + 11).
