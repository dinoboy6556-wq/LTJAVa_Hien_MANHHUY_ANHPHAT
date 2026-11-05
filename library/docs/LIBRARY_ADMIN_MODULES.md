# Các mục quản trị thư viện
Sản phẩm -> Sách & tồn kho. Danh mục -> Thể loại sách. Thương hiệu -> Nhà xuất bản (thêm Tác giả). Đơn hàng -> Phiếu mượn và Bán sách & hóa đơn. Người dùng -> Tài khoản. Post -> Bài viết & tin thư viện. Trang đơn -> Trang thông tin. Cấu hình -> Cấu hình thư viện. Menu -> Menu điều hướng. Bổ sung Sách điện tử.

Chạy database/upgrade_library_content_20261029.sql sau khi sao lưu. Bảng mới library_content lưu POST/PAGE/EBOOK/CONFIG/MENU. Không thay đổi bảng sách cũ.
Thể loại, tác giả, nhà xuất bản có thêm/sửa; không xóa dữ liệu đang liên kết sách. Nội dung có bản nháp/xuất bản và sửa lại thành ẩn. Mã đường dẫn duy nhất toàn hệ thống.
Trang thông tin: tạo giới thiệu, chính sách mượn-trả, chính sách mua sách, liên hệ. Chỉ xuất bản thông tin chính thức của nhóm; không sinh chính sách tự động.
Sách điện tử: chọn đầu sách, nhập văn bản được phép cung cấp, xuất bản để đọc tại /user/read/{slug}; danh sách tại /user/library. Hiện đọc văn bản công khai miễn phí, chưa có PDF/EPUB, bán quyền đọc hoặc DRM.
Menu điều hướng quản lý liên kết bổ sung ở chân trang; không thay thế menu nghiệp vụ có phân quyền. Cấu hình thư viện quản lý thông tin công khai ở chân trang (tên, địa chỉ, giờ hoạt động, liên hệ). Không nhập mật khẩu/khóa bí mật vào đây.
Thủ thư quản lý sách, danh mục và nội dung. Admin riêng: tài khoản, thanh toán mượn, cấu hình, menu. Bán sách & hóa đơn giữ nghiệp vụ/API bán sách hiện có, chưa thêm giao hàng hay trạng thái đơn hàng thương mại điện tử.
