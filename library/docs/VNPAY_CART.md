# Giỏ mượn và VNPay sandbox

## Database
Cài đặt database bằng file duy nhất `database/library_db.sql`. Xem [hướng dẫn database](DATABASE.md). File khởi tạo sẽ xóa và tạo lại các bảng, cần sao lưu trước khi import; không chạy trên dữ liệu cần giữ.

## Cấu hình cần cung cấp
Đăng ký merchant sandbox VNPay để lấy TmnCode/HashSecret. Không commit hoặc gửi khóa vào chat.
Biến môi trường của tiến trình backend:
- VNPAY_TMN_CODE: mã website sandbox.
- VNPAY_HASH_SECRET: khóa sandbox.
- VNPAY_URL: mặc định https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
- VNPAY_RETURN_URL: mặc định http://localhost:8080/user/cart; khi demo dùng URL của site.
Đăng ký IPN URL công khai HTTPS tại VNPay: https://TEN-MIEN/api/v1/payments/vnpay/ipn. VNPay không truy cập localhost. Cần domain/tunnel do nhóm cấu hình và đăng ký với VNPay; không tự bật public trong bản này.
Tài liệu chính thức: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html

## Luồng
1. Chi tiết sách > Thêm vào giỏ mượn. Giỏ lưu riêng theo email trong trình duyệt, không đồng bộ giữa máy.
2. /user/cart tải lại giá/tồn kho, chỉnh số lượng, chọn số ngày chung, tổng hợp phí (phí mỗi quyển cho một lượt, không nhân số ngày).
3. Thanh toán VNPay: backend tính lại tiền, tạo giao dịch PENDING và ký HMAC-SHA512. Chưa cấu hình thì báo lỗi, không tạo phiếu giả.
4. Browser Return URL chỉ mở giỏ để xem trạng thái từ backend, không dùng query URL để xác nhận đã trả tiền.
5. IPN kiểm tra chữ ký, merchant, amount và khóa giao dịch. Thành công tạo đúng một phiếu; gọi lặp không tạo thêm. Hủy/thất bại không tạo phiếu.
6. Trang Giỏ > Giao dịch của bạn > Kiểm tra kết quả. Giỏ được xóa sau khi đúng giao dịch được xác nhận PAID. Admin > Thanh toán mượn xem giao dịch.

## Giới hạn rõ ràng
- Sandbox, chưa thử giao dịch thật vì chưa có merchant credentials/IPN public.
- Giỏ/thanh toán chưa giữ riêng tồn kho. Nếu trả tiền xong nhưng hết sách, đổi giá hoặc tài khoản bị khóa: REVIEW_REQUIRED, không tạo phiếu; admin đối soát và hoàn tiền qua VNPay merchant. Chưa có API hoàn tiền tự động.
- PENDING hết 15 phút không có nghĩa đã thất bại; kiểm tra đối soát trước khi tạo giao dịch mới. Không tự coi Return URL hoặc hết thời gian là thanh toán thành công/thất bại.
- Nút mượn trực tiếp cũ vẫn tồn tại cho luồng mượn tại thư viện; không được coi đó là thanh toán online. Nếu yêu cầu tất cả lượt mượn phải trả tiền online cần khóa luồng trực tiếp theo chính sách riêng.
- /user/history chỉ hiển thị phiếu RETURNED. Phiếu đang mượn/trả một phần chỉ ở Sách đang mượn.

## Hai phương thức thanh toán (29/10/2026)
Cài đặt database bằng file duy nhất `database/library_db.sql`. Xem [hướng dẫn database](DATABASE.md). File khởi tạo sẽ xóa và tạo lại các bảng, cần sao lưu trước khi import; không chạy trên dữ liệu cần giữ.
- CASH: giỏ tạo một phiếu, phân bổ sách, ghi UNPAID (chưa thu tiền). Không cần khóa VNPay. Admin > Thanh toán mượn > Xác nhận đã thu tiền sau khi thực nhận tiền. Lưu người và thời gian xác nhận; nhấn lặp không ghi nhận hai lần.
- VNPAY: chuyển khoản/thanh toán ngân hàng qua cổng VNPay đã chọn; giữ luồng xác thực IPN. Không phải chuyển khoản thủ công đến số tài khoản riêng. Admin không được dùng nút thu tiền mặt để xác nhận VNPay.
- Lưu ý phiếu CASH bắt đầu hạn mượn ngay khi tạo phiếu; chưa có luồng chờ đến nhận sách riêng. Trả sách không tự xóa nghĩa vụ thanh toán.
