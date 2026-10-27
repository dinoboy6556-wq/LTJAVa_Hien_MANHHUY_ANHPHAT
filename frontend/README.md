> Bản thử nghiệm tham khảo. Giao diện độc giả chính hiện là Thymeleaf tại http://localhost:8080/user. Không cần chạy React để dùng các chức năng mới.

# Giao diện người dùng thư viện Mộc (React + Vite)

Frontend này được bổ sung riêng cho độc giả. Giao diện quản trị HTML hiện có trong Spring Boot không bị xóa hoặc thay thế.

## Yêu cầu
- Node.js 18 trở lên (khuyến nghị Node.js 20+)
- Backend Spring Boot chạy tại `http://localhost:8080`

## Cài đặt và chạy
Mở terminal tại thư mục `frontend` rồi chạy:

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`.

## Các trang
- `/` — Trang chủ
- `/sach` — Danh sách, tìm kiếm và lọc sách
- `/sach/:id` — Chi tiết sách
- `/dang-nhap` — Đăng nhập bằng API JWT hiện có
- `/dang-ky` — Đăng ký độc giả
- `/tai-khoan/sach-dang-muon` — Phiếu mượn hiện tại
- `/tai-khoan/lich-su` — Lịch sử mượn/trả

## Kết nối API
`vite.config.js` chuyển tiếp `/api` sang `http://localhost:8080`. Token JWT được thêm vào `Authorization: Bearer ...` tự động trong `src/api.js`.

API được sử dụng:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/books`
- `GET /api/v1/books/{id}`
- `GET /api/v1/categories`
- `GET /api/v1/loans/my-loans`

Để khách chưa đăng nhập có thể xem danh mục sách, `SecurityConfig` được cập nhật để cho phép GET công khai với sách, danh mục và tác giả. Các thao tác còn lại vẫn theo quy tắc bảo vệ hiện tại.

## Lưu ý
- Frontend không tự tạo dữ liệu sách giả; dữ liệu hiển thị lấy từ Spring Boot.
- Backend hiện chưa cung cấp API mô tả dài/ảnh bìa sách, vì vậy giao diện dùng bìa minh họa CSS và thông tin mô tả chung ở trang chi tiết.
- Tính năng mượn trực tuyến chưa được bật; trang người dùng hiển thị phiếu mượn từ API hiện có và hướng dẫn liên hệ thủ thư để mượn sách.
