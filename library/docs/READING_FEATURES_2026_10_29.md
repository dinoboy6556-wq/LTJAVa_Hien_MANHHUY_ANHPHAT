# Cập nhật trả từng quyển, sửa sách, đăng ký chờ, thông báo và nhật ký

## Cập nhật database cho nhóm
1. Dừng các phiên backend đang chạy; sao lưu library_db bằng Export SQL trong Laragon/HeidiSQL.
Cài đặt database bằng file duy nhất `database/library_db.sql`. Xem [hướng dẫn database](DATABASE.md). File khởi tạo sẽ xóa và tạo lại các bảng, cần sao lưu trước khi import; không chạy trên dữ liệu cần giữ.
3. Khởi động lại backend, Ctrl+F5 trên trình duyệt.

Cấu trúc này đã có đầy đủ trong file khởi tạo hợp nhất. Dữ liệu giao dịch cũ không được đưa vào bộ khởi tạo.

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

## Độc giả tự trả sách
Sách đang mượn chỉ hiện các quyển chưa trả, có nút Trả quyển này và Trả tất cả quyển còn lại. Có xác nhận trước thao tác. API POST /api/v1/loans/{id}/my-return kiểm tra đúng chủ phiếu, dùng cùng transaction và cách tính phạt như nghiệp vụ trả hiện có. Giao diện tự trả dùng tình trạng NORMAL; sách hỏng/mất liên hệ thủ thư. Đây là trả trực tiếp, chưa có bước chờ thủ thư duyệt. Không thêm bảng/cột.
Lịch sử là trang chỉ đọc của toàn bộ phiếu đã từng tạo (gồm đang mượn và đã trả), hiển thị ngày trả từng quyển, không có nút trả/gia hạn.
