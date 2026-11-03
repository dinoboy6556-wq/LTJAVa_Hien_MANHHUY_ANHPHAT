# Độc giả Next.js — quản trị Spring Boot

## Cấu trúc hiện tại
- frontend/: toàn bộ trang độc giả Next.js.
- library/: REST API, nghiệp vụ, database và trang admin Thymeleaf. Đã bỏ templates/user và controller dựng trang độc giả.
- Cổng truy cập: http://localhost:3000. Admin: http://localhost:3000/admin. Next chuyển tiếp /admin, /css, /js và /api sang Spring 8080.
- URL /user/... cũ chuyển hướng tới route Next tương ứng (giữ query, bao gồm Return URL cũ của VNPay).
- Khi truy cập trực tiếp Spring 8080, FRONTEND_URL cấu hình địa chỉ Next (mặc định http://localhost:3000). Admin trực tiếp 8080 có thể cần đăng nhập riêng vì khác origin.

## Trang độc giả và API
| Trang | API chính |
|---|---|
| /, /books, /books/{id} | GET /api/v1/books, /books/{id}, /books/{id}/related |
| /login, /register | POST /auth/login, /auth/register |
| /account/profile | GET/PUT /profile |
| /account/favorites | GET /favorites, PUT/DELETE /favorites/{bookId} |
| /cart | GET /payments/my, POST /payments/cash hoặc /payments/checkout |
| /account/loans | GET /loans/my-loans, POST /loans/{id}/my-return và /renew |
| /account/history | GET /loans/my-loans, chỉ hiển thị RETURNED |
| /account/loans | GET /notifications, /reservations, /fines/my-fines |
| /books/{id} | PUT/DELETE /reservations/{bookId}; GET/PUT /books/{id}/reviews |
| /library, /read/{slug} | GET /content/catalog, /content/read/{slug} |

API frontend tập trung tại frontend/lib/api.js, mọi request dùng /api/v1 và Bearer token. Các thành phần React không truy cập database. Bảng API LIVE hiển thị request để theo dõi.
Token library_token, hồ sơ library_user; khôi phục token cũ cùng origin nếu còn libraryToken. Không chuyển token qua URL. Huy hiệu giỏ đếm tổng quyển, lưu giỏ theo email và cập nhật tức thì.

## Thanh toán
- CASH tạo phiếu và ghi UNPAID, admin xác nhận thu tiền. Tạo lại cùng mã yêu cầu không sinh phiếu thứ hai.
- VNPAY chỉ tạo phiếu khi IPN đã xác thực; trang quay về /cart lấy kết quả từ API. Không tin query kết quả trong trình duyệt.
- Cấu hình VNPAY_RETURN_URL=http://localhost:3000/cart hoặc domain Next thực tế. Đăng ký IPN công khai /api/v1/payments/vnpay/ipn với VNPay. Chưa có credentials/public IPN thì không thể thử thanh toán ngân hàng đầu cuối; trang báo rõ thiếu cấu hình.
- Giỏ chưa giữ riêng tồn kho. Giao dịch đã trả tiền nhưng tồn kho/giá thay đổi phải được thư viện đối soát, REVIEW_REQUIRED; chưa tự hoàn tiền.

## Chạy và kiểm tra
1. Bật MySQL Laragon.
2. library: .\mvnw.cmd spring-boot:run
3. frontend: npm install; npm run dev
4. Kiểm tra: npm run lint; npm run build; npm run test:e2e (cần Microsoft Edge, Next đang chạy cổng 3000).
5. Backend: .\mvnw.cmd test (H2 độc lập).
Kiểm thử trình duyệt dùng API fixtures có kiểm tra request/payload để không tạo phiếu hay thu tiền thật; kiểm thử H2 xác minh nghiệp vụ thực tế. Không thêm bảng/cột database trong đợt chuyển giao diện.

Các script user.js/cart.js/... cũ trong static chỉ là mã tương thích chưa được tải bởi trang độc giả mới; user.css vẫn dùng cho admin. Tài liệu lịch sử đề cập trang Thymeleaf độc giả không còn áp dụng.

Kết quả kiểm tra đợt chuyển: 64 ca backend H2; 14 ca trình duyệt (11 fixture + 3 login/read-only với API thật); 4 ca unit giỏ. Lint và production build đều được kiểm tra. VNPay ngân hàng đầu cuối chưa xác minh vì chưa cấu hình merchant/IPN public.
