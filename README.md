# Hệ thống Quản lý Thư viện và Tồn kho

Dự án Spring Boot 3, Java 21, Spring Data JPA, Spring Security/JWT và H2 Database.

## Chạy dự án
1. Cài JDK 21.
2. Mở thư mục `library`.
3. Windows: chạy `mvnw.cmd spring-boot:run`; Linux/macOS: chạy `./mvnw spring-boot:run`.
4. Mở `http://localhost:8080`.

Dữ liệu demo được khởi tạo tự động. Tài khoản:
- Quản trị: `admin@library.com` / `admin123`
- Độc giả: `user@library.com` / `user123`

Ứng dụng mặc định dùng H2 trong bộ nhớ. Cấu hình nằm trong `library/src/main/resources/application.yml`.

## Nội dung Tuần 43
- API thống kê số lượng sách, sách hết hàng, người dùng, hóa đơn và doanh thu.
- API danh sách sách hết hàng, danh sách phiếu mượn đang hoạt động/độc giả đang mượn.
- JPQL tổng hợp doanh thu và truy vấn lấy dữ liệu thống kê.
- Xử lý trả sách bình thường, hỏng, mất; tạo khoản phạt/bồi thường.
- Bổ sung unit test cho thống kê và nghiệp vụ trả sách.
- Sửa vòng lặp JSON ở chi tiết phiếu mượn/hóa đơn và không trả mật khẩu người dùng trong JSON.

Xem `library/docs/TUAN_43.md` để biết API, payload và quy tắc xử lý chi tiết.

## Chạy kiểm thử
Windows: `mvnw.cmd test`
Linux/macOS: `./mvnw test`

Nếu Maven Wrapper không tải được Maven, cần kết nối Internet hoặc cài Maven cục bộ. Cấu hình project yêu cầu Java 21.
