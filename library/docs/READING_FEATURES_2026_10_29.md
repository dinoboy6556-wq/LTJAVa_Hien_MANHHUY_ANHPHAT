# Cập nhật trả từng quyển, sửa sách, đăng ký chờ, thông báo và nhật ký

## Cập nhật database cho nhóm
1. Dừng các phiên backend đang chạy; sao lưu library_db bằng Export SQL trong Laragon/HeidiSQL.
2. Chạy file `database/upgrade_reading_features_20261029.sql` tại gốc project. Chạy được nhiều lần, không xóa dữ liệu.
3. Khởi động lại backend, Ctrl+F5 trên trình duyệt.

Thêm cột loan_items.returned_at (DATE) và return_condition (VARCHAR). Thêm bảng reservations (mỗi tài khoản/đầu sách một đăng ký) và copy_events (nhật ký trạng thái từng quyển). Script cập nhật ngày trả cho các phiếu cũ đã hoàn tất; không suy đoán tình trạng cũ. Hibernate ddl-auto=update có thể tạo cấu trúc nhưng không thay thế bước cập nhật dữ liệu cũ trong script.

## Sử dụng
- Admin > Phiếu mượn > Nhận trả: chọn quyển cần trả và tình trạng. Nếu tình trạng khác nhau, trả theo từng nhóm. Phiếu vẫn đang mượn đến khi trả hết; phạt chỉ tính cho những quyển trả lần đó và cộng dồn vào phiếu. Gửi lại quyển đã trả bị từ chối.
- Admin > Sách & tồn kho > Sửa đầu sách: chỉnh tên, ISBN, tác giả, thể loại, nhà xuất bản, ảnh, mô tả, giá. Số lượng không sửa ở đây, dùng Nhập thêm/kiểm kê.
- Trang chi tiết sách hết: Đăng ký chờ. Độc giả xem/hủy tại Sách đang mượn. Khi sách có lại, thông báo dẫn đến trang sách. Đây là đăng ký nhận thông báo trên web, chưa giữ riêng quyển, không bảo đảm thứ tự ưu tiên. Mượn thành công tự xóa đăng ký tương ứng.
- Thông báo ở đầu các trang người dùng: phiếu đến hạn trong 3 ngày, hôm nay, quá hạn và sách đã đăng ký có lại. Tính lại lúc tải trang; chưa gửi email/push và không chạy nhắc khi website đóng.
- Admin > Từng quyển > Lịch sử quyển: thời gian, người thao tác, trạng thái trước/sau, nhập/mượn/trả/bán/kiểm kê. Nhật ký bắt đầu từ bản cập nhật này; không dựng lại lịch sử trước đó. Nhật ký cùng transaction với nghiệp vụ, lỗi thì rollback cả nhật ký.
- Font tiêu đề dùng Segoe UI/Arial để hỗ trợ tiếng Việt ổn định.

## API
POST /api/v1/loans/{id}/return nhận {"itemIds":[1,2],"condition":"NORMAL","note":"..."}. Bỏ itemIds vẫn trả tất cả quyển còn lại để tương thích client cũ.
PUT /api/v1/books/{id}: trường như tạo sách; totalQuantity không thay đổi tồn kho khi cập nhật.
GET/PUT/DELETE /api/v1/reservations (PUT/DELETE thêm /{bookId}).
GET /api/v1/notifications: chỉ dữ liệu của người đang đăng nhập.
GET /api/v1/books/{bookId}/copies/{copyId}/history: ADMIN/LIBRARIAN.

## Kiểm tra
Backend `library/mvnw.cmd -B -f library/pom.xml test` từ gốc project (H2). Frontend `node --test library/src/test/js/*.test.cjs`.
Trước khi triển khai dùng MySQL: chạy migration, kiểm tra một phiếu 2 quyển trả 1 rồi trả phần còn lại; kiểm tra khoản phạt, tồn kho, lịch sử và thông báo đúng tài khoản.
