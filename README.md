# Hệ thống Quản lý Thư viện và Tồn kho

Dự án Spring Boot 3, Java 21, Spring Data JPA, Spring Security/JWT và MySQL (Laragon).

## Chạy dự án
1. Cài JDK 21, Node.js và bật MySQL trong Laragon.
2. Import file duy nhất `database/library_db.sql` theo [hướng dẫn database](library/docs/DATABASE.md). Import sẽ xóa và tạo lại các bảng, cần sao lưu dữ liệu trước.
3. Tại thư mục `library`, chạy `.\mvnw.cmd spring-boot:run`.
4. Tại thư mục `frontend`, chạy `npm ci` rồi `npm run dev`.
5. Mở trang độc giả `http://localhost:3000`; trang quản trị `http://localhost:8080/admin`.

Tài khoản khởi tạo được ghi trong [DATABASE.md](library/docs/DATABASE.md). Database Laragon là `library_db`; mặc định `APP_SEED_ENABLED=false`.

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
- Có API ghi nhận khoản phạt đã thanh toán thủ công, tích hợp PayOS cho chuyển khoản ngân hàng và gửi Gmail khi thanh toán thành công hoặc xác nhận mật khẩu. Các dịch vụ ngoài cần cấu hình riêng theo hướng dẫn chạy project.
- Chi tiết triển khai và giới hạn hiện tại: [UX_ROADMAP.md](library/docs/UX_ROADMAP.md).

## Chạy kiểm thử
Windows: `mvnw.cmd test`
Linux/macOS: `./mvnw test`

Nếu Maven Wrapper không tải được Maven, cần kết nối Internet hoặc cài Maven cục bộ. Cấu hình project yêu cầu Java 21.

Cấu trúc và dữ liệu cài đặt được quản lý trong một file `database/library_db.sql`. Xem [DATABASE.md](library/docs/DATABASE.md) trước khi import.

Các lệnh kết nối database đọc `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`; mặc định là Laragon local (`library_db`, user `root`, mật khẩu trống). Đặt `APP_JWT_SECRET` thành chuỗi bí mật riêng trước khi triển khai; giá trị mặc định chỉ dành cho phát triển local.

Để gửi mã OTP khi đổi mật khẩu qua Gmail thật, thiết lập biến môi trường:

```powershell
$env:MAIL_HOST='smtp.gmail.com'
$env:MAIL_PORT='587'
$env:MAIL_USERNAME='your.gmail@gmail.com'
$env:MAIL_PASSWORD='your-16-char-app-password'
$env:LIBRARY_MAIL_ENABLED='true'
```

Lưu ý: với Gmail, `MAIL_PASSWORD` phải là App Password, không phải mật khẩu chính của tài khoản Google.
## Cập nhật database: mã riêng cho từng quyển sách

File database hợp nhất đã có bảng mã quyển và các khóa ngoại. Xem [mô hình mã quyển](library/docs/BOOK_COPIES.md) và [hướng dẫn database](library/docs/DATABASE.md).

## Frontend Next.js

Frontend độc giả mới dùng Next.js App Router tại `frontend/`; chạy riêng ở `http://localhost:3000`, còn Spring Boot cung cấp API tại cổng 8080. Vào thư mục `frontend`, chạy `npm install` rồi `npm run dev`. Next rewrite `/api/*` tới Spring Boot để request giữ cùng origin. Chi tiết route và các API được gọi nằm trong [README frontend](frontend/README.md). Trang quản trị dùng Thymeleaf tại `/admin`; trang độc giả dùng Next.js trên cổng 3000.

Xem [tiến độ UX và lộ trình](library/docs/UX_ROADMAP.md) để biết phần đã triển khai và checklist kiểm tra.
