# Các mục sách trang chủ
API công khai GET /api/v1/books/home-selections, tối đa 4 sách/mục.
- Mới lên kệ: id sách giảm dần, tức thứ tự thêm vào hệ thống; không phải ngày phát hành.
- Được bạn đọc quan tâm: tổng số quyển đã mượn trong loan_items, rồi số favorites, rồi id giảm dần. Chỉ chọn sách có lượt mượn hoặc yêu thích. Đếm toàn bộ lịch sử, không phải riêng tuần/tháng.
- Được đánh giá cao: điểm trung bình giảm dần, số lượt đánh giá giảm dần; chỉ chọn sách đã có đánh giá.
- Mượn sách tiết kiệm: sách còn hàng và phí mượn không âm, giá tăng dần. Đây là phí thật, không phải giá khuyến mãi hay phần trăm giảm giá.
Dữ liệu thống kê dùng query group, không lộ thông tin người mượn. Trang chủ dùng chung BookCard, hiển thị điểm từ API tổng hợp, không gọi đánh giá riêng cho từng card tại trang chủ.
Không thêm bảng hoặc cột database. Khi chưa có dữ liệu, mục tương ứng hiển thị trạng thái trống, không thay bằng số liệu giả.
