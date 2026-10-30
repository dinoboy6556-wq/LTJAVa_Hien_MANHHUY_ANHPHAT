# Mộc Library — Next.js frontend

Giao diện độc giả dùng Next.js App Router, kết nối API Spring Boot qua proxy của Next. Bảng `API LIVE` ở góc phải màn hình hiển thị method, endpoint, mã HTTP và thời gian của request gần nhất.

## Chạy local

Yêu cầu Node.js 20.9 trở lên và Spring Boot đang chạy tại `http://localhost:8080`.

```powershell
cd frontend
npm install
npm run dev
```

Mở `http://localhost:3000`. Để trỏ tới backend khác, đặt biến `SPRING_API_URL` trước khi chạy Next, ví dụ `http://localhost:8080`.

## Các route

- `/` trang chủ và sách gợi ý
- `/books` tìm kiếm, lọc thể loại và phân trang
- `/books/{id}` thông tin, đánh giá và sách liên quan
- `/login`, `/register` đăng nhập JWT và đăng ký
- `/account/loans`, `/account/history`, `/account/favorites` dữ liệu tài khoản

`lib/api.js` tập trung các hàm gọi `/api/v1/*`; `next.config.mjs` chuyển tiếp `/api/*` sang Spring Boot. Token gửi trong header `Authorization: Bearer ...`.

## API đang sử dụng

`GET /books`, `GET /books/{id}`, `GET /books/{id}/related`, `GET /categories`, `GET/PUT/DELETE /favorites`, `GET/PUT /books/{id}/reviews`, `GET /loans/my-loans`, `POST /auth/login` và `POST /auth/register`.
