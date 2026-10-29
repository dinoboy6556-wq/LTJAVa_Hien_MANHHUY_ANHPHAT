# Kiểm tra mượn/trả và yêu thích (29/10/2026)

## Thay đổi
- Yêu thích: thêm/xóa có transaction và khóa theo tài khoản; PUT lặp lại hoặc đồng thời chỉ tạo một bản ghi.
- API yêu thích không trả thông tin tài khoản trong từng mục.
- Trang chi tiết tải trạng thái đã lưu, cho thêm/bỏ yêu thích. Xử lý hết phiên, lỗi mạng, bấm trùng và danh sách rỗng.
- Phiếu đang mượn có hạn trả trước hôm nay được hiển thị Quá hạn.
- Từ chối phần tử null trong danh sách sách gửi lên khi mượn.

## Database
Không thêm bảng hoặc cột; không cần chạy SQL. Sử dụng bảng favorites và ràng buộc duy nhất (user_id, book_id) hiện có.

## Kiểm thử
Backend: từ thư mục library chạy `.\mvnw.cmd -B test` (các kiểm thử tích hợp dùng H2, không thay dữ liệu Laragon).
Frontend: từ thư mục project chạy `node --test library/src/test/js/*.test.cjs`.

Bao phủ: cấp quyển cuối đồng thời, hoàn tác phiếu mượn thiếu sách, hoàn tác trả sách lỗi giữa chừng, trả đúng quyển, trả trùng, tiền phạt quá hạn, sách mất/hỏng, gia hạn một lần, chặn gia hạn quá hạn/đã trả/còn phạt, quyền trả/gia hạn và dữ liệu yêu thích riêng từng người.

## Kiểm tra trên trình duyệt sau khi khởi động lại backend
1. Đăng nhập độc giả, mở chi tiết sách, thêm yêu thích; tải lại trang phải hiện Bỏ yêu thích.
2. Vào Yêu thích, mở lại sách, bỏ yêu thích; bỏ mục cuối phải hiện thông báo danh sách rỗng.
3. Mượn sách, xem phiếu và mã quyển. Nhân viên trả sách, tải lại trang để kiểm tra tồn kho và lịch sử.
4. Kiểm tra tài khoản khác không thấy yêu thích/phiếu mượn của tài khoản đầu.

Giới hạn: nút mượn ngăn gửi lặp trên trang hiện tại; API tạo phiếu chưa có khóa idempotency để khử các POST độc lập từ nhiều tab hoặc client tự retry. Kiểm thử đồng thời dùng H2; nên kiểm tra thêm với MySQL trước khi triển khai thực tế.
