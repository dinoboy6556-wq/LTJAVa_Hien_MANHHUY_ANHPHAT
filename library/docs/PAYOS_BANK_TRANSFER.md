# Chuyển khoản ngân hàng qua PayOS

Giao diện hiển thị **Chuyển khoản ngân hàng**. Phương thức nội bộ PAYOS; thanh toán trực tiếp CASH vẫn hoạt động. Callback VNPay cũ giữ lại để đối soát giao dịch cũ.

## Điền cấu hình sau

Không gửi khóa lên chat. Chọn một trong hai cách:

1. Sao chép `library/src/main/resources/application-local.properties.example` thành `application-local.properties` cùng thư mục, điền Client ID, API Key, Checksum Key vào 3 dòng `app.payos.*`. File đích đã được .gitignore. Tại thư mục library chạy:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

2. Khai báo biến môi trường backend: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY. Tùy chọn PAYOS_RETURN_URL và PAYOS_CANCEL_URL, mặc định http://localhost:3000/cart. Khởi động lại backend sau khi sửa. Không dùng NEXT_PUBLIC_* cho khóa. Spring Boot không tự đọc file .env.

Frontend: tại frontend chạy `npm run dev`, mở http://localhost:3000. Backend mặc định 8080, không cần khóa ở Next.js.

## Webhook bắt buộc

Trên kênh thanh toán tại my.payos.vn cấu hình URL:

```text
https://<backend-cong-khai>/api/v1/payments/payos/webhook
```

URL phải truy cập được từ PayOS qua HTTPS; localhost không nhận callback Internet. Khi thử local dùng đường hầm HTTPS đến cổng 8080 và đăng ký URL đó trên PayOS. Return/cancel URL trỏ tới frontend khách truy cập được. Không đưa JWT vào webhook; backend xác thực HMAC bằng checksum key.

Khóa chưa điền: báo chưa cấu hình, không tạo phiếu hay ghi nhận đã trả. Tài khoản PayOS cần có kênh ngân hàng đủ điều kiện. API merchant mặc định là môi trường PayOS thực; các kiểm thử dự án dùng giả lập, không chuyển tiền thật.

## Nghiệp vụ

- Phí trên máy chủ: số quyển × phí cơ bản × ceil(số ngày / 14). Chuyển khoản nhận VND nguyên từ 1 đến 999.999.999 đồng.
- Lưu đơn PENDING trước khi gọi PayOS. Timeout: thử lại cùng giỏ/mã yêu cầu sẽ dùng cùng orderCode. Mở link chưa tạo phiếu.
- Trang PayOS hiển thị QR/ngân hàng để chuyển khoản.
- Webhook xác minh chữ ký rồi truy vấn trạng thái có chữ ký từ PayOS. Kiểm tra orderCode, amount và amountPaid; PAID mới tạo phiếu/trừ tồn kho trong cùng transaction. Khóa hàng ngăn callback lặp tạo nhiều phiếu.
- Giao dịch PENDING có nút **Tiếp tục chuyển khoản** để mở lại cùng đơn sau lỗi mạng/tải lại trang, không tạo đơn khác.
- Nút **Kiểm tra trạng thái** đối soát từ backend. Tham số return/cancel không có quyền xác nhận tiền hay xóa giỏ. Đóng trình duyệt vẫn xử lý được webhook.
- Chỉ FAILED khi ngân hàng xác nhận hủy/hết hạn. Local hết hạn vẫn cần đối soát trước đơn mới.
- Đã nhận tiền nhưng hết sách, đổi phí, khóa tài khoản, nhận dư hoặc nhận sau khi hủy: REVIEW_REQUIRED. Quản trị liên hệ khách để xử lý/hoàn tiền tại ngân hàng/PayOS; chưa tự động hoàn tiền.
- CASH tạo phiếu UNPAID, admin xác nhận khi thu tiền. Không xác nhận tiền mặt cho đơn chuyển khoản.

## Database / gửi nhóm

**Không thêm bảng hoặc cột trong đợt PayOS này.** Dùng lại borrow_payments. Cột method (VARCHAR) lưu thêm PAYOS; id bắt đầu PO kèm orderCode. Không cần SQL mới nếu đã đồng bộ schema trước đó. Không xóa đơn đang chờ để thử lại.

## Kiểm tra thật sau khi điền khóa

1. Cấu hình webhook, return/cancel URL rồi khởi động lại backend.
2. Thêm sách, chọn Chuyển khoản ngân hàng, xác nhận; đối chiếu tiền trên PayOS.
3. Thử hủy: kiểm tra trạng thái, giỏ còn và chưa có phiếu.
4. Thanh toán thật có kiểm soát: PAID, đúng một phiếu, tồn kho giảm đúng; đối soát nhiều lần vẫn một phiếu.
5. Đối chiếu admin Thanh toán mượn với PayOS; kiểm tra riêng thanh toán trực tiếp.

Chưa có khóa nên chưa xác minh giao dịch ngân hàng thật. Test tự động chỉ xác minh logic giả lập, gồm vector chữ ký chính thức.

Nguồn: https://payos.vn/docs/api/ và https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/

## Kết quả xác minh ngày 06/11/2026

- Tổng báo cáo backend: 99 tests, 0 failures/errors (gồm 17 PayosIntegrationTest và 3 PayosGatewayTest).
- 22 kiểm thử UI giả lập qua Playwright; 5 kiểm thử đăng nhập/phân quyền/tách phiên trên backend MySQL thật; 4 kiểm thử lưu giỏ/idempotency đều qua.
- Next production build qua; ESLint 0 lỗi, còn 4 cảnh báo có sẵn về ảnh avatar và import chưa dùng.
- Backend khởi động với schema validate và seed=false, không áp seed hoặc thay schema dữ liệu thật. API PayOS khi thiếu khóa trả 409 với thông báo chưa cấu hình; danh mục API trả đúng cấu trúc phân trang.
- Chưa thử chuyển tiền ngân hàng thật vì chưa có khóa/kênh/webhook công khai.
