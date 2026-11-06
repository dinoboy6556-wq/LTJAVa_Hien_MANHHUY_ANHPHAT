# Phân quyền Thủ thư và cấu hình liên hệ

Thủ thư đăng nhập tại /admin/login, vào mặc định Sách & tồn kho. Các tab: Thể loại sách, Sách & tồn kho, Nhà xuất bản, Tác giả, Phiếu mượn, Sách điện tử. Có thể cập nhật đầu sách/ảnh bìa, nhập quyển, kiểm tra tình trạng, nhận trả sách và quản lý nội dung sách điện tử. Các ràng buộc tồn kho và lịch sử vẫn áp dụng.

Chỉ Admin quản lý tổng quan tài chính, khoản phạt/thanh toán, bán sách/hóa đơn, tài khoản, bài viết, trang thông tin, cấu hình, menu và báo cáo. API cũng kiểm tra quyền; không chỉ ẩn tab.

Admin vào Cấu hình thư viện, điền tên, email, điện thoại, địa chỉ, giờ mở cửa, rồi Lưu thông tin. Thông tin liên hệ hiện ở chân trang và trang Liên hệ. Ô trống không hiển thị. Thông báo website bật/tắt bằng checkbox. Không đổi bảng database; dùng library_content hiện có.

Chạy database/cleanup_ui_notes.sql để dọn các ghi chú do bộ dữ liệu trước thêm vào. Script chỉ sửa bản ghi còn trùng nội dung cũ, không ghi đè dữ liệu đã tự thay đổi. Dữ liệu sách hiện tại do nhóm biên soạn cho mục đích thử nghiệm; cần cập nhật thông tin xuất bản thật trước khi vận hành. Ba bài đọc là nội dung do nhóm biên soạn, không phải bản điện tử của đầu sách in liên kết.

Khóa thanh toán, mật khẩu và cấu hình máy chủ vẫn đặt trong biến môi trường hoặc application-local.properties (đã ignore), không nhập vào cấu hình thông tin liên hệ.
