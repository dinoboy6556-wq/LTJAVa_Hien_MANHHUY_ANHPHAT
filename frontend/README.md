# Mộc — frontend độc giả Next.js

## Chạy
Node.js >=20.9. Bật MySQL Laragon và Spring Boot cổng 8080.
Trong frontend: `npm install`, `npm run dev`. Mở http://localhost:3000.
Production local: `npm run build`, `npm start`.
SPRING_API_URL cấu hình backend proxy (mặc định http://localhost:8080).

## Phân tách
Next.js dựng tất cả trang độc giả. Spring Boot cung cấp REST API và dựng trang quản trị Thymeleaf tại /admin (Next proxy cùng origin).
Không còn trang độc giả Thymeleaf; /user/... cũ chỉ redirect sang route Next.
Danh sách trang: /, /books, /books/{id}, /login, /register, /cart, /account/profile, /account/favorites, /account/loans, /account/history, /library, /read/{slug}.
Mọi API frontend đi qua lib/api.js; Xem lời gọi API bằng tab Network của trình duyệt.

## Vị trí mã giao diện

- `app/` giữ các tuyến Next.js và lắp ghép màn hình.
- `features/borrow-cart/` chứa danh sách giỏ, tóm tắt phí, giao dịch và hook `useBorrowCheckout`.
- `features/catalog/` chứa thẻ sách dùng ở trang chủ, khám phá và yêu thích, bộ lọc và hook `useCatalog`.
- `features/book-discussion/` tách form đánh giá, hỏi đáp và hook `useBookDiscussion`.
- `features/assistant/` tách danh sách tin nhắn, ô gửi, kiểu giao diện và hook `useLibraryChat`.
- `components/` chứa các thành phần dùng chung như header và footer. `lib/` chứa HTTP client, phiên đăng nhập và lưu giỏ.

## Kiểm thử
- npm run lint
- npm run build
- node --test tests/cart.test.mjs
- npm run test:e2e (Microsoft Edge đã cài, app đang chạy ở 3000). Các thao tác mượn/thu tiền dùng mock API để không sửa database thật.
- PowerShell `$env:RUN_LIVE_SMOKE='1'; npm run test:e2e` bật thêm 3 ca đăng nhập demo/read-only API thật. Chỉ dùng với database demo local có tài khoản mẫu.
Chi tiết route/API/thanh toán xem library/docs/FRONTEND_BACKEND_SPLIT.md.

Đăng nhập độc lập: `/login` cho độc giả, `/admin/login` cho admin/thủ thư. Token quản trị lưu ở `library_admin_token`, không dùng chung `library_token` của độc giả. Đăng xuất một bên giữ phiên bên còn lại.
