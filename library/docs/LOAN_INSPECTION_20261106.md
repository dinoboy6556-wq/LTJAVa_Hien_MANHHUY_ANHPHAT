# Thứ tự phiếu và kiểm tra sách

- API danh sách phiếu quản trị và giao diện đều xếp ngày mượn giảm dần; cùng ngày xếp ID giảm dần, nên người mượn sau nằm trên.
- Nút icon mắt **Kiểm tra sách** có ở mọi phiếu, xem từng mã quyển, ngày trả và tình trạng ghi nhận lúc trả. Phiếu cũ thiếu kết quả hiện rõ chưa ghi nhận, không tự suy đoán sách bình thường.
- Trong cửa sổ kiểm tra có thể chuyển sang **Kiểm tra và nhận trả** đối với phiếu chưa hoàn tất. Chọn quyển nhận lần này và chọn rõ Bình thường/Hỏng/Mất. Form không mặc định Bình thường. Nếu các quyển khác tình trạng thì xử lý từng nhóm riêng.
- Kiểm tra bìa/gáy, rách/thiếu trang, bẩn/ẩm mốc; ghi chú khi nhận trả. Tình trạng nằm ở loan_items.return_condition hiện có, tồn kho và nhật ký CopyEvent dùng luồng cũ. Không thêm bảng/cột.
- Luồng cũ tính phạt: hỏng 50.000đ/quyển; mất theo giá bán; cộng phạt trễ 10.000đ/quyển/ngày. Ghi chú hiện được lưu trong lý do khoản phạt khi phát sinh phạt; chưa có hồ sơ kiểm định độc lập/ảnh hiện trạng. Kết quả hiện tại là ghi nhận lúc nhận trả, không phải kiểm định trước khi giao sách.
- Chức năng độc giả tự trả sách vẫn giữ nguyên theo thiết kế hiện có; không tự nhận rằng tất cả sách đã được thủ thư kiểm định. Muốn bắt buộc mọi lượt trả chờ thủ thư kiểm tra cần bổ sung quy trình duyệt trả riêng.
