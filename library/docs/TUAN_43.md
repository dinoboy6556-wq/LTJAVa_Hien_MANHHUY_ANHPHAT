# Hoàn thiện Tuần 43 – Thống kê, ghép nối và kiểm thử

## 1. API thống kê

Các API đều có tiền tố `/api/v1/statistics` và yêu cầu đăng nhập JWT.

- `GET /api/v1/statistics/summary`: tổng số đầu sách, sách hết hàng, người dùng, hóa đơn bán, doanh thu bán sách, phiếu mượn đang hoạt động và doanh thu cho thuê.
- `GET /api/v1/statistics/out-of-stock`: danh sách sách có trạng thái `OUT_OF_STOCK`.
- `GET /api/v1/statistics/active-loans`: danh sách phiếu mượn chưa trả.
- `GET /api/v1/statistics/customers-borrowing`: danh sách phiếu mượn đang hoạt động kèm thông tin người mượn.

Các phép đếm và tổng doanh thu đã chuyển sang truy vấn JPA/JPQL để giảm việc tải toàn bộ dữ liệu lên bộ nhớ.

## 2. Xử lý trả sách hỏng/mất

Gửi `POST /api/v1/loans/{id}/return` kèm JWT. Trường hợp sách bình thường:

```json
{"condition":"NORMAL","note":""}
```

Trường hợp sách hỏng:

```json
{"condition":"DAMAGED","note":"Bìa sách bị rách"}
```

Trường hợp sách mất:

```json
{"condition":"LOST","note":"Độc giả báo mất sách"}
```

Quy tắc hiện tại:
- Trả bình thường: cộng số lượng sách trở lại kho.
- Sách hỏng: không cộng vào số lượng khả dụng, tạo khoản phạt 50.000 đồng/cuốn.
- Sách mất: không cộng vào số lượng khả dụng, tiền bồi thường tính theo giá bán của sách.
- Trả quá hạn: phạt 10.000 đồng/ngày/cuốn; nếu đồng thời hỏng/mất thì cộng thêm khoản phạt/bồi thường tương ứng.
- Trả phiếu đã trả trước đó: trả lỗi HTTP 409.

Mức phạt sách hỏng 50.000 đồng/cuốn là quy tắc mặc định để demo, có thể điều chỉnh theo yêu cầu của giảng viên.

## 3. Kiểm thử

Đã bổ sung unit test cho:
- Tổng hợp số liệu thống kê và doanh thu.
- Truy vấn danh sách sách hết hàng và phiếu mượn đang hoạt động.
- Trả sách bình thường, sách mất, phiếu đã trả và mã phiếu không tồn tại.

Chạy kiểm thử tại thư mục `library`:

```bash
./mvnw test
```

Trên Windows:

```bat
mvnw.cmd test
```

Lưu ý: trong môi trường sửa file hiện tại, Maven Wrapper không tải được Maven từ máy chủ Maven Central nên chưa thể xác nhận kết quả chạy test thực tế. Hãy chạy lệnh trên máy có kết nối mạng và JDK 21.
