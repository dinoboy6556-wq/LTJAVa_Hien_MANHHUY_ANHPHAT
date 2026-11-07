# Cài đặt và chạy thư viện Mộc

Hướng dẫn dành cho giáo viên và thành viên tải project từ GitHub. Thư mục này chỉ có một file database là **`library_db.sql`**. Không cần chạy thêm script nâng cấp.

## 1. Chuẩn bị

- JDK 21, kiểm tra bằng `java -version`.
- Node.js từ 20.9 trở lên và npm, kiểm tra bằng `node -v` và `npm -v`.
- Git và kết nối Internet để tải các thư viện lần đầu.
- Laragon có MySQL 8.x và HeidiSQL hoặc phpMyAdmin.
- Hai cổng trống `8080` cho backend và `3000` cho frontend.

Project có Maven Wrapper nên không bắt buộc cài Maven riêng. Các lệnh bên dưới dùng PowerShell trên Windows.

## 2. Clone project

Mở terminal tại thư mục muốn lưu project và chạy

```powershell
git clone https://github.com/dinoboy6556-wq/LTJAVa_Hien_MANHHUY_ANHPHAT.git
cd LTJAVa_Hien_MANHHUY_ANHPHAT
git switch main
```

Giữ terminal này ở thư mục gốc. Cấu trúc chính

```text
LTJAVa_Hien_MANHHUY_ANHPHAT/
├── database/
│   ├── README.md              Hướng dẫn này
│   └── library_db.sql         Cấu trúc và dữ liệu khởi tạo
├── library/                   Backend Spring Boot và trang quản trị
│   ├── pom.xml
│   ├── mvnw.cmd
│   ├── src/
│   └── docs/                  Tài liệu chức năng
└── frontend/                  Frontend Next.js dành cho độc giả
    ├── package.json
    └── package-lock.json
```

## 3. Import database trong Laragon

**File SQL sẽ xóa và tạo lại các bảng của project trong `library_db`. Nếu máy đã có dữ liệu cần giữ, dừng backend và xuất bản sao lưu trước khi import.** Việc clone hoặc pull mã nguồn không tự import file SQL.

1. Mở Laragon và bật MySQL. Đảm bảo MySQL đang chạy tại cổng `3306`.
2. Mở HeidiSQL bằng nút Database của Laragon, đăng nhập vào MySQL local. Mặc định Laragon thường dùng tài khoản `root`, mật khẩu trống.
3. Mở file `database/library_db.sql` bằng UTF-8. Chọn chạy toàn bộ file, không chỉ chạy dòng đang chọn. Với phpMyAdmin, dùng chức năng Import và chọn file này.
4. File tự tạo database `library_db` nếu chưa có. Refresh danh sách database sau khi chạy.
5. Kiểm tra có **25 bảng**, bảng `books` có **24 đầu sách**, `book_copies` có **118 mã quyển**, `users` có **3 tài khoản**.

Có thể kiểm tra trong cửa sổ SQL

```sql
USE library_db;
SHOW TABLES;
SELECT COUNT(*) AS so_dau_sach FROM books;
SELECT COUNT(*) AS so_ma_quyen FROM book_copies;
SELECT COUNT(*) AS so_tai_khoan FROM users;
```

Bộ khởi tạo gồm 8 thể loại, 7 tác giả, 7 nhà xuất bản và 21 nội dung/cấu hình/menu. Các phiếu mượn, đơn mua, giao dịch, khoản phạt và tài khoản cá nhân của máy phát triển không được mang theo. Những quyển từng đang mượn được đặt lại thành sẵn có trong bộ khởi tạo, các trạng thái kiểm kê khác được giữ và bộ đếm tồn kho được tính lại.

## 4. Chạy backend

Mở **terminal thứ nhất** tại thư mục gốc project

```powershell
cd library
$env:DB_URL='jdbc:mysql://127.0.0.1:3306/library_db'
$env:DB_USERNAME='root'
$env:DB_PASSWORD=''
$env:APP_SEED_ENABLED='false'
.\mvnw.cmd spring-boot:run
```

Nếu MySQL trên máy có mật khẩu hoặc cổng khác, sửa các biến tương ứng trước khi chạy. Biến môi trường đặt trong terminal này chỉ có hiệu lực cho tiến trình chạy từ terminal đó.

Đợi log có `Started LibraryApplication` và Tomcat chạy trên cổng `8080`. Giữ terminal đang mở. Lần đầu Maven sẽ tải thư viện nên có thể mất vài phút.

Linux/macOS dùng `./mvnw spring-boot:run` trong thư mục `library` sau khi thiết lập các biến môi trường tương ứng.

## 5. Chạy frontend

Mở **terminal thứ hai** tại thư mục gốc project

```powershell
cd frontend
npm ci
npm run dev
```

Đợi Next.js báo `Ready`, sau đó mở trang độc giả tại **http://localhost:3000**. Những lần chạy sau chỉ cần `npm run dev` nếu không thay đổi thư viện.

Frontend chuyển các yêu cầu `/api/*` đến backend `http://localhost:8080`. Cần giữ cả MySQL, backend và frontend đang chạy.

## 6. Địa chỉ và tài khoản thử

| Phần sử dụng | Địa chỉ |
|---|---|
| Trang độc giả | http://localhost:3000 |
| Đăng nhập độc giả | http://localhost:3000/login |
| Đăng nhập quản trị hoặc thủ thư | http://localhost:8080/admin/login |
| Trang quản trị | http://localhost:8080/admin |

| Vai trò | Email | Mật khẩu thử |
|---|---|---|
| Quản trị viên | admin@library.com | admin123 |
| Thủ thư | librarian@library.com | librarian123 |
| Độc giả | reader@gmail.com | reader123 |

Thủ thư dùng chung trang quản trị và chỉ được truy cập các mục thuộc quyền quản lý sách. Để thử nhiều tài khoản đồng thời, dùng các hồ sơ trình duyệt khác nhau hoặc cửa sổ riêng tư. Các tab cùng một hồ sơ trình duyệt có thể dùng chung thông tin đăng nhập.

Đổi các mật khẩu thử khi triển khai thực tế. Thông tin liên hệ, giờ mở cửa và thông báo có thể cập nhật tại **Quản trị → Cấu hình thư viện**.

## 7. Các dịch vụ cần cấu hình riêng

Không cần khóa dịch vụ để xem sách, đăng nhập, thử quản trị và thanh toán trực tiếp tại thư viện. Chuyển khoản ngân hàng, gửi Gmail và AI trực tuyến cần thông tin riêng của người triển khai. Thiết lập tại **terminal backend trước khi khởi động lại backend**.

### Chuyển khoản ngân hàng qua PayOS

```powershell
$env:PAYOS_CLIENT_ID='dien-client-id'
$env:PAYOS_API_KEY='dien-api-key'
$env:PAYOS_CHECKSUM_KEY='dien-checksum-key'
$env:PAYOS_RETURN_URL='http://localhost:3000/cart'
$env:PAYOS_CANCEL_URL='http://localhost:3000/cart'
```

Muốn nhận webhook khi website đóng trang thanh toán, cần triển khai backend bằng địa chỉ HTTPS công khai và cấu hình webhook theo [hướng dẫn PayOS](../library/docs/PAYOS_BANK_TRANSFER.md). Khi chưa có khóa hợp lệ, chọn thanh toán trực tiếp để kiểm thử.

### Gửi Gmail và mã xác nhận mật khẩu

```powershell
$env:LIBRARY_MAIL_ENABLED='true'
$env:LIBRARY_MAIL_USERNAME='dia-chi-gmail-cua-nguoi-gui'
$env:LIBRARY_MAIL_APP_PASSWORD='mat-khau-ung-dung-google'
```

Dùng mật khẩu ứng dụng của Google cho tài khoản gửi thư. Các biến trên lấy đúng tên từ cấu hình backend hiện tại.

### AI trực tuyến

```powershell
$env:OPENAI_API_KEY='dien-api-key'
```

Giữ khóa ở môi trường backend. Các file cấu hình local và khóa bí mật không được commit lên Git.

## 8. Kiểm tra nhanh sau khi chạy

1. Mở trang chủ và Khám phá sách, kiểm tra tên sách, ảnh bìa, bộ lọc và chi tiết sách.
2. Đăng nhập độc giả, thử yêu thích và thêm sách vào giỏ.
3. Tạo yêu cầu mượn bằng thanh toán trực tiếp, kiểm tra phiếu ở Sách đang mượn.
4. Đăng nhập quản trị/thủ thư ở cửa sổ khác, kiểm tra phiếu mượn và xử lý yêu cầu trả theo quyền.
5. Thử đăng nhập thủ thư để kiểm tra các tab được phép truy cập.

Để chạy kiểm thử backend, mở terminal khác tại `library` và chạy `.\mvnw.cmd test`. Kiểm thử giao diện cần đọc cấu hình Playwright tại `frontend/playwright.config.mjs`.

## 9. Lỗi thường gặp

| Hiện tượng | Cách xử lý |
|---|---|
| `Connection refused` hoặc lỗi kết nối MySQL | Bật MySQL Laragon, kiểm tra cổng, `DB_URL`, tài khoản và mật khẩu |
| `Unknown database library_db` hoặc thiếu bảng | Import toàn bộ `database/library_db.sql` vào đúng máy MySQL |
| Cổng `8080` hoặc `3000` đã được sử dụng | Dừng bản project đã chạy trong terminal cũ bằng Ctrl+C rồi chạy lại |
| Lỗi phiên bản Java | Dùng JDK 21 và kiểm tra lại `JAVA_HOME`, `java -version` |
| Không chạy được npm hoặc Next.js | Cài Node.js đủ phiên bản, mở lại terminal và chạy `npm ci` tại `frontend` |
| Giao diện mở nhưng không tải được sách | Kiểm tra backend đã khởi động thành công trên cổng `8080` |
| Chuyển khoản hoặc gửi email chưa hoạt động | Kiểm tra khóa dịch vụ/biến môi trường và khởi động lại backend |
| Ảnh tự tải từ máy thành viên khác không hiển thị | Ảnh runtime nằm trong `library/uploads`; cần sao chép thư mục ảnh riêng. Ảnh bìa đi kèm mã nguồn vẫn có sẵn |

Để dừng project, nhấn Ctrl+C lần lượt tại terminal frontend và backend. Không cần import lại SQL mỗi lần chạy. Không bật `APP_SEED_ENABLED=true` khi đã import bộ dữ liệu này.
