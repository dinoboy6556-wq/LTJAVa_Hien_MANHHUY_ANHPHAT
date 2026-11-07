# Duyệt trả sách và quyền đánh giá

Cài đặt database bằng file duy nhất `database/library_db.sql`. Xem [hướng dẫn database](DATABASE.md). File khởi tạo sẽ xóa và tạo lại các bảng, cần sao lưu trước khi import; không chạy trên dữ liệu cần giữ.

## Thay đổi database

- loan_items thêm cột return_requested_at để ghi nhận yêu cầu trả từng quyển.
- book_readings lưu xác nhận đã đọc sách điện tử theo tài khoản và đầu sách.
- book_questions lưu câu hỏi và câu trả lời của nhân viên, tách khỏi điểm đánh giá.

## Trả sách

Độc giả gửi yêu cầu từ Sách đang mượn. Sách còn trong phiếu đang mượn và chưa cộng tồn kho. Admin hoặc thủ thư mở Phiếu mượn, lọc Chờ duyệt trả, kiểm tra từng mã quyển và chọn tình trạng trước khi nhận trả. Chỉ khi duyệt mới cập nhật ngày trả, tồn kho, khoản phạt và thông báo thành công. Các quyển chưa duyệt tiếp tục nằm trong Sách đang mượn. Phạt quá hạn được tính đến ngày thư viện nhận trả. Trang độc giả tự kiểm tra cập nhật mỗi 10 giây khi đang mở.

## Đánh giá và hỏi đáp

Chỉ được chấm sao và bình luận khi có phiếu mượn của sách, hóa đơn mua sách hoặc xác nhận đã đọc sách điện tử liên kết đúng đầu sách. Đơn mua đang chờ hoặc đã hủy chưa đủ điều kiện. Quyền được kiểm tra ở backend. Dữ liệu đánh giá cũ được giữ.

Người đã đăng nhập đều được đặt câu hỏi. Admin và thủ thư trả lời trong Sách & tồn kho qua nút Câu hỏi sách. Câu hỏi không tính vào điểm đánh giá.

Sau khi đọc sách điện tử đã xuất bản, bấm Xác nhận đã đọc để lưu trên server. Đây là xác nhận của độc giả, hệ thống không xác minh mức độ đọc hiểu.

## Tổ chức frontend

- frontend/features/book-discussion/ chứa giao diện đánh giá, hỏi đáp và hook gọi API.
- components/loan-card.jsx chứa thao tác trên từng phiếu mượn.
- components/loan-list.jsx chứa danh sách và theo dõi cập nhật trả sách.
- app/read/[slug]/page.jsx trình bày trang đọc và xác nhận đã đọc.
- lib/api.js tập trung các lời gọi API.
- lib/session.js dùng chung việc theo dõi phiên đăng nhập.
