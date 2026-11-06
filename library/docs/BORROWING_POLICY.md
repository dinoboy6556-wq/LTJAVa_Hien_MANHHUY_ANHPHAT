# Quy định mượn và xác nhận

Phiên bản: 2026-11-06-v1. Mức phạt không đổi: quá hạn 10.000đ/quyển/ngày, hỏng 50.000đ/quyển, mất theo giá bán; phí quá hạn có thể cộng với phí hỏng/mất.

Giỏ mượn hiển thị toàn bộ quy định và checkbox không chọn sẵn. API tạo yêu cầu tiền mặt, PayOS, VNPay và tạo phiếu trực tiếp yêu cầu policyAccepted=true và policyVersion đúng phiên bản. Phiên bản và đồng ý lưu trong borrow_payments.request_json, cùng created_at của giao dịch; không tạo bảng/cột mới. Các giao dịch cũ vẫn được đối soát/tiếp tục, không tự gán sự đồng ý cho lịch sử cũ. Trường này ghi nhận xác nhận trong ứng dụng, không chứng minh người dùng đã đọc hết nội dung.

Chi tiết sách và Sách đang mượn dùng cùng component quy định. Khi thay mức phạt cần cập nhật hằng số backend BorrowingPolicy, nội dung component và phiên bản ở cả hai phía.

Lời nhắc yêu cầu kiểm tra sách khi nhận và báo thủ thư. Chức năng ghi biên bản tình trạng giao sách trước khi mượn chưa được bổ sung ở đợt này; kiểm tra nhận trả hiện có vẫn giữ nguyên. Các mức phạt khi trả do hệ thống hiện tại tính; chưa thay đổi luồng nhận/trả.

Thời hạn mượn tự nhập số nguyên 1–365 ngày, phí làm tròn theo chu kỳ 14 ngày. Gia hạn vẫn theo điều kiện và giới hạn nghiệp vụ hiện tại.
