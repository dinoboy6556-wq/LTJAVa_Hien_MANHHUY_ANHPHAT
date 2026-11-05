# Ảnh bìa, kệ sách và icon thao tác – 06/11/2026

## Người dùng

Các kệ gợi ý trang chủ dùng card nhỏ hơn, hiển thị khoảng 5 sách mỗi hàng trên desktop. Mỗi kệ tối đa 12 sách theo thứ tự xếp hạng thực; dùng mũi tên hai bên để xem tiếp, có hỗ trợ phím trái/phải khi focus vào kệ và cuộn ngang. Mũi tên tự vô hiệu khi đã đến đầu/cuối hoặc không đủ sách. Kệ ít lượt đánh giá/mượn không bịa thêm dữ liệu.

## Admin / thủ thư

Trong Sách & tồn kho có cột ảnh bìa. Thêm đầu sách hoặc icon bút chì mở form để:

- Nhập URL http/https hoặc đường dẫn /images/... như trước.
- Chọn JPG/PNG từ máy tối đa 2 MB, xem trước rồi nhấn Lưu. Ảnh được tải lên khi lưu, không cần tự đặt file vào project.
- Bỏ ảnh bìa rồi Lưu nếu muốn xóa liên kết ảnh. Không tự xóa file đang có thể dùng bởi sách khác.

API POST /api/v1/books/cover-upload chỉ ADMIN/LIBRARIAN, nhận multipart file và trả url. Backend kiểm tra dữ liệu ảnh thật, kích thước tối đa 12 triệu pixel/6000px mỗi chiều, resize tối đa 900×1350 rồi mã hóa PNG mới, không dùng tên file khách gửi. Không nhận SVG upload hoặc nội dung giả ảnh. GET /images/book-covers/{uuid}.png công khai để độc giả xem. Chính sách bảo mật chỉ cho phép blob ở nguồn ảnh để hiển thị ảnh xem trước, không mở quyền thực thi script.

Ảnh upload lưu trong library/uploads/book-covers, đã được Git bỏ qua. Có thể dùng BOOK_COVER_DIR trỏ thư mục bền vững khi triển khai; cần sao lưu cùng dữ liệu vận hành. Các ảnh này không tự xuất hiện trên máy thành viên khác khi pull code.

23 sách local trước đây chưa có ảnh đã được gắn **bìa minh họa**, không phải bìa xuất bản thật. 23 SVG tin cậy được dựng trong source tại library/src/main/resources/static/images/covers, được commit cùng code khi bạn commit. Có thể thay bằng ảnh thật qua admin.

## Đồng bộ nhóm / database

Không thêm bảng/cột. Dùng trường books.cover_image_url hiện có. Next.js proxy /images/** tới Spring Boot nên cả trang độc giả và admin dùng cùng URL ảnh.

Nếu đã có sách trong database mà còn trống ảnh, chạy database/update_sample_book_covers.sql trong library_db. Script chỉ gắn bìa minh họa cho ISBN tương ứng khi chưa có ảnh, không ghi đè ảnh tùy chỉnh. Nếu nạp mới 20 sách, sample_catalog_20.json và seed_catalog_20.ps1 đã kèm đường dẫn ảnh.

Cột Thao tác admin dùng icon, có title khi rê chuột và aria-label cho đọc màn hình/phím Tab. Hộp=kiểm kê/nhập quyển, bút=sửa, thùng rác đỏ=xóa; nhận trả, xác nhận thu và khóa/mở khóa có icon tương ứng. Xác nhận và phân quyền giữ nguyên.
