# Hệ thống Quản lý Thư viện và Tồn kho

Dự án Spring Boot 3, Java 21, Spring Data JPA, Spring Security/JWT và MySQL (Laragon).

## Chạy dự án
1. Cài JDK 21.
2. Mở thư mục project. Windows có thể chạy wrapper từ thư mục gốc; Linux/macOS chạy wrapper trong `library`.
3. Windows: chạy `mvnw.cmd spring-boot:run`; Linux/macOS: từ `library`, chạy `./mvnw spring-boot:run`.
4. Mở `http://localhost:8080`.

Dữ liệu demo được khởi tạo tự động. Tài khoản:
- Quản trị: `admin@library.com` / `admin123`
- Độc giả: `user@library.com` / `user123`

Ứng dụng dùng MySQL database `library_db`. Cấu hình kết nối ưu tiên trong `library/src/main/resources/application.properties`; H2 chỉ dùng cho kiểm thử.

## Nội dung Tuần 43
- API thống kê số lượng sách, sách hết hàng, người dùng, hóa đơn và doanh thu.
- API danh sách sách hết hàng, danh sách phiếu mượn đang hoạt động/độc giả đang mượn.
- JPQL tổng hợp doanh thu và truy vấn lấy dữ liệu thống kê.
- Xử lý trả sách bình thường, hỏng, mất; tạo khoản phạt/bồi thường.
- Bổ sung unit test cho thống kê và nghiệp vụ trả sách.
- Sửa vòng lặp JSON ở chi tiết phiếu mượn/hóa đơn và không trả mật khẩu người dùng trong JSON.

Xem `library/docs/TUAN_43.md` để biết API, payload và quy tắc xử lý chi tiết.

## Chức năng bổ sung
- Độc giả có trang yêu thích, đánh giá sách, xem sách cùng thể loại, gia hạn phiếu còn hạn một lần và theo dõi khoản phạt.
- Admin/thủ thư dùng `/admin` để xem thống kê, quản lý vai trò/trạng thái tài khoản và tải báo cáo CSV. Admin xem nhật ký thao tác tại `GET /api/v1/admin/audit-logs`.
- Có API ghi nhận khoản phạt đã thanh toán thủ công. Chưa tích hợp cổng thanh toán, email xác minh/đặt lại mật khẩu, hoặc xuất XLSX/PDF.
- Chi tiết triển khai và giới hạn hiện tại: [UX_ROADMAP.md](library/docs/UX_ROADMAP.md).

## Chạy kiểm thử
Windows: `mvnw.cmd test`
Linux/macOS: `./mvnw test`

Nếu Maven Wrapper không tải được Maven, cần kết nối Internet hoặc cài Maven cục bộ. Cấu hình project yêu cầu Java 21.

Để chuyển đổi database cũ sang mã riêng từng quyển, sao lưu database trước, bật MySQL rồi chạy từ thư mục gốc trên Windows:

```powershell
.\mvnw.cmd "-Dspring-boot.run.arguments=--app.book-copies.migrate=true" spring-boot:run
```

Các lệnh kết nối database đọc `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`; mặc định là Laragon local (`library_db`, user `root`, mật khẩu trống). Đặt `APP_JWT_SECRET` thành chuỗi bí mật riêng trước khi triển khai; giá trị mặc định chỉ dành cho phát triển local.

## Cập nhật database: mã riêng cho từng quyển sách

Trước khi chạy phiên bản quản lý từng quyển, đọc [hướng dẫn chuyển đổi book_copies](library/docs/BOOK_COPIES.md). Có bảng mới, hai cột khóa ngoại mới và bước chuyển dữ liệu tồn kho/phiếu đang mượn. Database Laragon của nhánh này là `library_db`.

## Frontend Next.js

Frontend độc giả mới dùng Next.js App Router tại `frontend/`; chạy riêng ở `http://localhost:3000`, còn Spring Boot cung cấp API tại cổng 8080. Vào thư mục `frontend`, chạy `npm install` rồi `npm run dev`. Next rewrite `/api/*` tới Spring Boot để request giữ cùng origin; bảng API LIVE ở góc màn hình hiện method, endpoint, HTTP status và thời gian phản hồi. Chi tiết route và các API được gọi nằm trong [README frontend](frontend/README.md). Trang Thymeleaf cũ vẫn ở `/user` trên cổng 8080 trong thời gian chuyển tiếp.

Xem [tiến độ UX và lộ trình](library/docs/UX_ROADMAP.md) để biết phần đã triển khai và checklist kiểm tra.
