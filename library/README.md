# HỆ THỐNG QUẢN LÝ THƯ VIỆN & TỒN KHO - DỰ ÁN TUẦN 4 (TUẦN 43)

## 📌 Giới Thiệu
Dự án **Library Management System** được phát triển bởi nhóm 3 thành viên (**Lê Trần Minh Hiền, MẠNH HUY, ANH PHÁT**) cho môn Lập Trình Java.
Dự án được triển khai trên nền tảng **Java 21**, **Spring Boot 3.2.4**, **Spring Security (JWT)**, **Spring Data JPA**, và cơ sở dữ liệu **H2 In-Memory / MySQL**.

---

## 🚀 Các Tính Năng Đã Hoàn Thành Trong Tuần 4 (Tuần 43)
1. **Quản Lý Xác Thực & Phân Quyền (Authentication & Authorization)**:
   - Đăng ký / Đăng nhập sinh mã JWT Token.
   - Phân quyền theo các vai trò: `ROLE_ADMIN`, `ROLE_LIBRARIAN`, `ROLE_USER`.
   - Lớp mã hóa mật khẩu `BCryptPasswordEncoder`.

2. **Quản Lý Danh Mục & Kho Sách (Books & Inventory)**:
   - CRUD các thực thể: `Book`, `Category`, `Author`, `Publisher`.
   - Tự động quản lý số lượng tồn kho `availableQuantity` và cập nhật trạng thái `OUT_OF_STOCK`.
   - Trang khám phá sách phân trang 12 đầu sách/trang, có nút chọn số trang và giữ bộ lọc khi chuyển trang.

3. **Nghiệp Vụ Bán Sách (Sales Management)**:
   - Lập hóa đơn bán lẻ sách.
   - Tự động trừ số lượng tồn kho ngay khi tạo đơn bán thành công.
   - Kiểm tra rủi ro hết hàng (Race condition / validation).

4. **Nghiệp Vụ Mượn & Trả Sách / Tính Phạt (Loan & Return & Fines)**:
   - Tạo phiếu mượn sách có hẹn ngày trả (`dueDate`).
   - Tự động trừ số lượng tồn kho khi mượn.
   - Trả sách: Tự động hoàn trả tồn kho vào thư viện, tính phí phạt quá hạn (`Fine`) nếu trễ hạn trả.

5. **Hệ Thống API Thống Kê (Statistics Dashboard - Mốc Tuần 43)**:
   - API tổng hợp KPI: Tổng số sách, số sách hết hàng, tổng doanh thu bán sách, tổng doanh thu cho thuê.
   - API tra cứu danh sách sách hết hàng (`out-of-stock`).
   - API tra cứu danh sách các phiếu mượn đang hoạt động (`active-loans`).

6. **Giao Diện Web (Single Page Application)**:
   - Giao diện người dùng hiện đại xây dựng trên HTML5, Bootstrap 5, FontAwesome & REST API Fetch.
   - Tích hợp trọn vẹn 4 tab: Thống Kê, Kho Sách, Bán Hàng, Mượn/Trả Sách.

7. **Kiểm Thử Tự Động (Unit Tests)**:
   - Viết các bộ Unit Test với JUnit 5 & Mockito cho `BookServiceTest` và `SaleServiceTest`.

---

## 🛠️ Hướng Dẫn Khởi Chạy Dự Án
1. **Yêu cầu môi trường**:
   - JDK 21+
   - Maven 3.8+

2. **Các bước chạy ứng dụng**:
   ```bash
   # Di chuyển vào thư mục project
   cd library

   # Biên dịch và chạy Spring Boot
   mvn spring-boot:run
   ```

3. **Truy cập ứng dụng**:
   - Giao diện Web chính: `http://localhost:8080/`
   - Trang quản trị H2 Database Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:mem:librarydb`)

4. **Tài Khoản Mẫu Đã Seed Tự Động (`DataInitializer`)**:
   - **Tài khoản Admin**: `admin@library.com` / `admin123`
   - **Tài khoản Khách hàng**: `user@library.com` / `user123`
   - Lần chạy đầu, hệ thống tự thêm danh mục, tác giả, nhà xuất bản và 24 đầu sách mẫu để danh mục có nhiều trang. Khi chạy lại trên cùng database, dữ liệu mẫu không bị thêm trùng; dữ liệu hiện có được giữ nguyên.

5. **Nạp dữ liệu mẫu vào MySQL**:
   - Khởi động MySQL và tạo database `library_db` nếu chưa có.
   - Kiểm tra `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` trong `application.yml` hoặc biến môi trường.
   - Chạy ứng dụng bằng `mvnw.cmd spring-boot:run` từ thư mục `library`. `DataInitializer` sẽ tự nạp dữ liệu khi ứng dụng khởi động.
   - Các bản ghi đầu sách mẫu xuất hiện ở trang khám phá sách và trong trang quản trị. Dữ liệu này là dữ liệu minh họa; số lượng và giá có thể chỉnh trong `DataInitializer`.
   - Khi chạy migration mã quyển với `app.book-copies.migrate=true`, hệ thống còn thêm một tài khoản `demo@library.com` / `demo123` cùng dữ liệu minh họa liên kết cho mượn, tiền phạt, bán sách, yêu thích, đánh giá và nhật ký. Tồn kho được cập nhật qua trạng thái mã quyển; dữ liệu demo chỉ được tạo một lần.
