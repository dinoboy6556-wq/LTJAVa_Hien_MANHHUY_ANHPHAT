# Đặt mua sách tại thư viện

Với database có sẵn, chạy `database/upgrade_purchase_orders.sql` trong `library_db` trước khi khởi động backend ở chế độ validate. Script thêm bảng `purchase_orders`, liên kết với sách, người mua và hóa đơn.

Độc giả chọn Mua sách, đặt số lượng, rồi xem hoặc hủy đơn đang chờ trong Hồ sơ → Đơn mua sách. Đơn chờ không giữ tồn kho. Admin kiểm tra sách và số tiền tại quầy rồi xác nhận thu tiền trong tab Đơn mua sách. Hệ thống kiểm tra lại giá và tồn kho, lập hóa đơn và ghi nhận từng quyển đã bán trong cùng giao dịch. Nếu giá thay đổi, hủy đơn và yêu cầu độc giả đặt lại trước khi thu tiền.
