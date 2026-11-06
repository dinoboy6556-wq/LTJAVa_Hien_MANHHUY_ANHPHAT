# Hoàn thiện các tab quản trị – 06/11/2026

## Bán sách & hóa đơn

- Nút Lập hóa đơn bán sách: email tài khoản độc giả đã có, chọn sách còn sẵn/có giá bán, số lượng, thêm/bỏ dòng và tổng dự kiến. Cần tích xác nhận đã thu tiền và xác nhận trước khi ghi nhận.
- API /sales/counter dành ADMIN/LIBRARIAN. Tính tiền theo giá DB, giới hạn số dòng/số lượng, chặn trùng đầu sách/thiếu tồn/khách bị khóa. Mã quyển chuyển SOLD trong cùng transaction với hóa đơn; không bán được quyển đang mượn.
- Danh sách hóa đơn mới trước, tìm kiếm và phân trang. Icon mắt mở chi tiết từng mã quyển, giá và tổng tiền; In hóa đơn hỗ trợ in/PDF bằng trình duyệt.
- Hóa đơn là phiếu bán nội bộ, không phải hóa đơn thuế điện tử. Chưa có mua sách online/cổng thanh toán cho đơn bán hoặc hoàn/huỷ hóa đơn. Không cho xóa lịch sử để tránh sai tồn và doanh thu. Nếu mạng lỗi sau khi lưu, kiểm tra danh sách trước khi lập lại.
- POST /sales cũ cũng chỉ ADMIN/LIBRARIAN; độc giả không được tự ghi nhận bán. Hệ thống không tạo doanh thu hoặc hóa đơn demo trên database thật trong lần này.

## Sách điện tử / bài viết / trang thông tin

Form tách đúng chức năng, có tiêu đề/slug, nội dung văn bản, nháp/xuất bản và thứ tự; sách điện tử bắt buộc liên kết đầu sách. Không xuất bản nội dung rỗng. Danh sách có tìm kiếm, lọc xuất bản/ẩn, phân trang, chỉnh sửa, xuất bản/ẩn và xem.

Xóa chỉ khi đã ẩn và không còn menu trỏ tới trang. Chỉ nội dung xuất bản mới có thể đọc công khai. Hỗ trợ văn bản có xuống dòng; không thực thi HTML/script; chưa nhận file PDF/EPUB. Bài đọc mẫu do nhóm biên soạn, có ghi rõ không phải bản điện tử thật của sách in đang liên kết minh họa.

Frontend /library có tìm và lọc Sách điện tử/Bài viết/Trang thông tin; /read/{slug} có cỡ chữ 16–28px, nền tối/sáng và lưu vị trí đọc local trên trình duyệt. Liên kết trở lại thông tin đầu sách khi có bookId.

## Cấu hình thư viện / menu

Chỉ ADMIN. Cấu hình cho các khóa công khai library-name/email/phone/address/hours/announcement. Không lưu thông tin bí mật tại tab này. Tên và thông báo hiện trên đầu trang; email/phone/address/hours hiển thị tại footer khi xuất bản. Thay đổi cần tải lại trang độc giả để lấy dữ liệu mới.

Menu hỗ trợ /, /books, /books/{id}, /library, /read/{slug}, /cart, /account/... và đường dẫn /user/... cũ; chặn external/javascript/API/admin. Liên kết hiển thị tại footer, sắp theo thứ tự đã chọn và ẩn khi chưa xuất bản. Menu trang trùng với liên kết PAGE không bị hiện hai lần.

## Dữ liệu và đồng bộ nhóm

Không thêm bảng/cột. Tái sử dụng sales, sale_items, book_copies, library_content hiện có. Đã nạp 21 bản ghi: 3 EBOOK, 3 POST, 4 PAGE, 6 CONFIG, 5 MENU. Thông tin liên hệ là giá trị mẫu, cần quản trị thay bằng thực tế. Không xóa hay ghi đè nội dung đã có.

Sau khi pull code và chạy backend, từ thư mục gốc:

```powershell
.\database\seed_library_content.ps1
```

Script hỏi mật khẩu admin; dữ liệu ở sample_library_content.json. Chạy lại nhận diện slug và bỏ qua, không nhân đôi, không tạo hóa đơn giả. Bộ 20 đầu sách riêng vẫn dùng seed_catalog_20.ps1.

## Xác minh bản cập nhật cuối

124 test backend, 48 test JavaScript và 36 test browser đều qua; Next production build qua, lint không có lỗi (4 cảnh báo ảnh avatar/import có sẵn). Đã thử PayOS thật cho tạo link, hủy QR, mở link mới, lặp tiếp tục không tạo trùng và Hủy yêu cầu về CANCELLED. Các link thử đều đã hủy, không chuyển tiền hoặc tạo phiếu thử. Tự PAID được kiểm thử bằng mock/webhook, không giả mạo thanh toán trên dữ liệu thật. Kiểm tra đủ dữ liệu nội dung đã nạp 21 mục và chạy lại không trùng. Không thêm bảng/cột và không commit khóa local.
