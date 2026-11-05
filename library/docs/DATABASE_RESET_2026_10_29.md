# Nhập lại dữ liệu 29/10/2026

Đã backup và thay toàn bộ dữ liệu library_db bằng bộ mẫu database/data.txt. Giữ schema hiện tại để không làm mất cấu trúc favorites/book_reviews/audit_logs; các bảng này được làm rỗng.

Script `database/reset_from_data_compatible.sql` chỉ dành cho database đã có schema của project hiện tại, XÓA TOÀN BỘ DỮ LIỆU. Dừng backend và backup trước khi chạy. Không chạy nguyên data.txt vì mapping không khớp Java.

Điều chỉnh: ROLE_CUSTOMER -> ROLE_USER; RENTED/RENTING -> BORROWED; barcode -> code; bio -> biography; loan_date -> borrow_date; total_fee -> rental_fee. Cột barcode cũ được cho phép null; loan_items.quantity mặc định 1; fines.user_id cũ cho phép null (user tra qua loan), paid mặc định false.

Giữ 3 tài khoản, 3 đầu sách, 1 phiếu mượn mẫu. Tạo thêm 10 mã quyển cho đầu sách 2 (AVAILABLE), 2 mã cho đầu sách 3 (UNAVAILABLE, cần kiểm kê vì mẫu chỉ ghi tồn kho 0). Tổng 17 quyển, 14 AVAILABLE, 1 BORROWED, 2 UNAVAILABLE. Các giá trị này khớp bộ đếm books.

Mật khẩu mẫu trong file gốc không có mật khẩu gốc xác định. Đã thay bằng BCrypt hợp lệ cho môi trường local:
- admin@library.com / admin123
- librarian@library.com / librarian123
- reader@gmail.com / reader123

Không dùng tài khoản/mật khẩu demo này trên môi trường công khai.

`app.seed.enabled=${APP_SEED_ENABLED:false}` ngăn tự thêm lại catalog mẫu cũ khi chạy. Test cần seed mẫu có thể đặt app.seed.enabled=true riêng. Backup dữ liệu cũ ở database/backups (đã ignore Git).
