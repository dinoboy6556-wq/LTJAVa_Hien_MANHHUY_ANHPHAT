# Đặt mua sách tại thư viện

Cài đặt database bằng file duy nhất `database/library_db.sql`. Xem [hướng dẫn database](DATABASE.md). File khởi tạo sẽ xóa và tạo lại các bảng, cần sao lưu trước khi import; không chạy trên dữ liệu cần giữ.

Độc giả chọn Mua sách, đặt số lượng, rồi xem hoặc hủy đơn đang chờ trong Hồ sơ → Đơn mua sách. Đơn chờ không giữ tồn kho. Admin kiểm tra sách và số tiền tại quầy rồi xác nhận thu tiền trong tab Đơn mua sách. Hệ thống kiểm tra lại giá và tồn kho, lập hóa đơn và ghi nhận từng quyển đã bán trong cùng giao dịch. Nếu giá thay đổi, hủy đơn và yêu cầu độc giả đặt lại trước khi thu tiền.
