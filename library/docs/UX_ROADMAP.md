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
- Lưu sách yêu thích theo tài khoản; thêm/xóa và trang xem danh sách.
- Gia hạn một lần thêm 7 ngày nếu phiếu còn hạn và không có khoản phạt chưa thanh toán.
- Độc giả xem trạng thái khoản phạt; thủ thư/quản trị có thể ghi nhận đã thanh toán.
- Thêm mô tả và URL ảnh bìa sách, API đánh giá 1–5 sao và gợi ý sách cùng thể loại.
- Thêm API quản trị danh sách tài khoản, cập nhật vai trò/khóa tài khoản; giới hạn các thao tác quản lý sách, danh mục, tác giả, nhà xuất bản và thống kê cho admin/thủ thư.
- Cho phép cấu hình database/JWT bằng biến môi trường; thêm wrapper Windows ở thư mục gốc để chạy lệnh migration thuận tiện.
- Trang `/admin` có thẻ thống kê, quản lý vai trò/khóa tài khoản và tải báo cáo CSV; audit log ghi các API ghi dữ liệu thành công và có API xem theo trang.
- Đổi mật khẩu khi đã đăng nhập; tạm khóa đăng nhập 15 phút sau 5 lần sai liên tiếp cho cùng email (bộ nhớ tiến trình).

Không thay đổi schema trong đợt này. Chưa đo hiệu năng hay kiểm tra trực quan trên thiết bị thật; cần chạy checklist dưới đây trước demo.

## Checklist bàn giao
1. Đăng nhập tại `/user/login`, mở sách, chọn số lượng/ngày; hủy xác nhận phải không tạo phiếu.
2. Xác nhận mượn: phiếu xuất hiện trong Sách đang mượn, mã quyển đổi BORROWED và tồn kho giảm.
3. Thủ thư trả qua API: mã trở lại AVAILABLE (hoặc DAMAGED/LOST theo điều kiện); xem lịch sử và hạn trả.
4. Thử không đủ tồn kho, token hết hạn, mất mạng; không báo thành công giả.
5. Kiểm tra ở 360px, 768px và desktop: menu, bộ lọc, chi tiết, biểu mẫu và bảng không che nút.
6. Danh sách hơn 12 sách: lọc và chuyển trang phải giữ tham số, không trùng đầu sách.

## Chưa triển khai — các đợt tiếp theo
- Màn hình quản trị phiếu mượn, hóa đơn, khoản phạt và quản lý chi tiết từng quyển; hiện trang quản trị tập trung vào tổng quan và tài khoản.
- Phân trang/lọc các bảng quản trị; biểu đồ lịch sử theo thời gian; lịch sử tồn kho cụ thể (audit log hiện ghi route và người thực hiện, chưa lưu snapshot thay đổi).
- Quên mật khẩu và xác minh email cần SMTP đã cấu hình; không giả lập việc gửi email.
- Thanh toán trực tuyến cần chọn cổng thanh toán; thao tác “đã thanh toán” hiện là ghi nhận thủ công của thủ thư/quản trị.
- Xuất XLSX/PDF; báo cáo hiện là CSV có thể mở trong Excel.
- Giới hạn đăng nhập sai hiện lưu trong bộ nhớ, cần chuyển sang lưu bền vững nếu triển khai nhiều instance.
- Chọn môi trường demo/triển khai cùng tài khoản dịch vụ; chưa có demo công khai.

## Chạy kiểm thử
Từ thư mục library: `./mvnw.cmd test` và `node --test src/test/js/*.test.cjs`. H2 dùng riêng trong test, không sửa MySQL Laragon.
