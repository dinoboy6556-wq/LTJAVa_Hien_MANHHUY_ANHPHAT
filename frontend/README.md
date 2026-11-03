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
Mọi API frontend đi qua lib/api.js; API LIVE hiển thị method/endpoint/status.

## Kiểm thử
- npm run lint
- npm run build
- node --test tests/cart.test.mjs
- npm run test:e2e (Microsoft Edge đã cài, app đang chạy ở 3000). Các thao tác mượn/thu tiền dùng mock API để không sửa database thật.
- PowerShell `$env:RUN_LIVE_SMOKE='1'; npm run test:e2e` bật thêm 3 ca đăng nhập demo/read-only API thật. Chỉ dùng với database demo local có tài khoản mẫu.
Chi tiết route/API/thanh toán xem library/docs/FRONTEND_BACKEND_SPLIT.md.
