# Giao diện chính và lộ trình — 27/10/2026

## Quyết định
Thymeleaf (`/user`, `/user/books`, `/user/profile`) là giao diện độc giả chính. Chạy một Spring Boot, không cần npm. React trong `frontend/` là bản thử nghiệm lưu tham khảo, chưa đồng bộ tính năng; không coi hai ứng dụng là hai giao diện chính. Admin hiện tại vẫn ở `/index.html`, cần thống nhất thiết kế ở đợt sau.

## Đợt ưu tiên đã triển khai
- Tìm theo tên sách/tác giả/thể loại, lọc riêng tác giả/thể loại, khoảng **phí mượn mỗi cuốn**, còn sách/tạm hết.
- Sắp xếp tên, tác giả, thể loại, phí mượn; thêm ID làm thứ tự phụ ổn định.
- Phân trang sách tại database, 12 đầu sách/trang; giữ bộ lọc khi chuyển trang; trang vượt giới hạn trở về trang cuối.
- Lỗi khoảng giá, trạng thái không có kết quả và nút xóa bộ lọc.
- Bộ lọc và header thích ứng điện thoại/tablet, vùng chạm 44px, focus bàn phím, bảng mã quyển có thể cuộn ngang.
- Mượn sách có xác nhận số lượng/số ngày trước gửi; đã có trạng thái tải, ngăn gửi trùng, báo lỗi tồn kho và chuyển tới phiếu mượn sau thành công.
- Luồng mã quyển/mượn/trả/bán có test tích hợp. Chuyển dữ liệu cũ theo BOOK_COPIES.md trước sử dụng.

Không thay đổi schema trong đợt này. Chưa đo hiệu năng hay kiểm tra trực quan trên thiết bị thật; cần chạy checklist dưới đây trước demo.

## Checklist bàn giao
1. Đăng nhập tại `/user/login`, mở sách, chọn số lượng/ngày; hủy xác nhận phải không tạo phiếu.
2. Xác nhận mượn: phiếu xuất hiện trong Sách đang mượn, mã quyển đổi BORROWED và tồn kho giảm.
3. Thủ thư trả qua API: mã trở lại AVAILABLE (hoặc DAMAGED/LOST theo điều kiện); xem lịch sử và hạn trả.
4. Thử không đủ tồn kho, token hết hạn, mất mạng; không báo thành công giả.
5. Kiểm tra ở 360px, 768px và desktop: menu, bộ lọc, chi tiết, biểu mẫu và bảng không che nút.
6. Danh sách hơn 12 sách: lọc và chuyển trang phải giữ tham số, không trùng đầu sách.

## Chưa triển khai — các đợt tiếp theo
- Đồng bộ thiết kế trang admin; phân trang người dùng/phiếu mượn/hóa đơn, bộ lọc admin.
- Ảnh bìa/mô tả (nguồn ảnh thật), đánh giá và sách liên quan; cần thiết kế dữ liệu/quyền đánh giá.
- Yêu thích; gia hạn có quy tắc (số lần, sách quá hạn, khoản phạt); giao diện khoản phạt/trạng thái thanh toán.
- Quên/đổi mật khẩu và xác minh email: cần SMTP, token một lần và thời hạn; không mô phỏng gửi email thành công.
- Dashboard biểu đồ, quản lý vai trò/khóa tài khoản, lịch sử nhập/điều chỉnh kho và audit log.
- Xuất Excel/PDF, phân quyền chi tiết, giới hạn đăng nhập sai và kiểm tra đầu vào bổ sung.
- Biến môi trường DB/JWT, cấu hình demo riêng và hướng dẫn triển khai; cần chọn nơi triển khai và tài khoản dịch vụ. Chưa có demo công khai.

## Chạy kiểm thử
Từ thư mục library: `./mvnw.cmd test` và `node --test src/test/js/*.test.cjs`. H2 dùng riêng trong test, không sửa MySQL Laragon.
