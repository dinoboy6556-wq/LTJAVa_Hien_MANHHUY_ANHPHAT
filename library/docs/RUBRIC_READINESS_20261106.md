# Đối chiếu phiếu chấm điểm đồ án – 06/11/2026

Đối chiếu file PHIẾU CHẤM ĐIỂM ĐỒ ÁN CUỐI MÔN HỌC.docx. Mục tiêu chuẩn bị minh chứng mức 1,7; điểm thực tế do giảng viên đánh giá. Bảo mật trong phiếu có các mức 1,3 / 1,5 / 2,0, không có mốc 1,7. Mục kỹ thuật nâng cao không có mô tả cụ thể nên không tự nhận điểm.

| Tiêu chí | Hiện có / bổ sung | Minh chứng cần trình bày |
|---|---|---|
| Database | Sách, thể loại, tác giả, NXB, từng quyển, user/role, phiếu/items, bán/items, phạt, thanh toán, yêu thích, đánh giá, chờ sách; PK/FK/unique và transaction | Sơ đồ quan hệ, SQL hiện có, dữ liệu liên kết nhiều nhóm. Seed tùy chọn 40 sách bổ sung, ít nhất 10 phiếu/bán/đánh giá; thử chạy lặp không trùng |
| CRUD cơ bản | Tạo/xem/sửa/xóa sách; thêm DELETE an toàn; kiểm tra giá, số lượng, liên kết không tồn tại, độ dài, ảnh bìa | Tạo sách chưa có lịch sử, sửa, xóa; nhập số âm bị từ chối |
| CRUD trung bình | CRUD sách, thể loại, tác giả, NXB; chặn xóa dữ liệu đang được sử dụng; tìm/lọc/phân trang/thông báo | Xóa thể loại đang có sách bị chặn, dữ liệu còn nguyên; lọc tác giả/phí/tình trạng |
| CRUD nâng cao | Quan hệ cập nhật có kiểm tra, input phù hợp kiểu dữ liệu; sách và tồn kho riêng; phân trang server 12 sách/lần và tối đa 5 nút trang | Danh mục 85+ sách có kiểm thử, trang vượt giới hạn được điều chỉnh; chọn entity liên quan bằng select |
| Bảo mật | JWT/BCrypt/roles/ownership/throttle; tách phiên admin/reader; từ chối JWT sai, khóa H2 console, security headers, validation và escape HTML; bỏ secret mặc định cố định | Reader gọi API admin bị 403; giả token 401; body roles lúc đăng ký không nâng thành admin; chuỗi SQL không đăng nhập; nội dung HTML không chạy script |
| Thanh toán | CASH + chuyển khoản PAYOS; VNPay cũ tương thích. Giá tính lại ở server, idempotency, chữ ký, đối soát, REVIEW_REQUIRED | **Cần điền khóa và thanh toán thật trước khi chứng minh mức thanh toán online**. Xem PAYOS_BANK_TRANSFER.md. Mock không thay cho giao dịch thật |
| UI/UX | Next.js reader, Spring admin; thẻ đều, trạng thái loading/empty/error, form khóa khi gửi, xác nhận xóa, bảng cuộn; bổ sung admin layout <=900px | Màn hình desktop và tablet, danh sách dài, lỗi mạng; giỏ–thanh toán–theo dõi; header và menu dễ tìm |
| Chức năng mở rộng | Trả từng phần/toàn bộ, gia hạn, chờ sách, yêu thích, đánh giá/reaction, avatar, đọc online, báo cáo/thống kê, audit tồn kho; thêm form đổi mật khẩu | Demo đủ điều kiện và ngoại lệ: hết sách sau khi chuyển tiền, callback lặp, trả lặp, đăng ký chờ/hủy, bỏ yêu thích |

## Các phần vừa hoàn thiện

- CRUD xóa an toàn cho 4 nhóm. Sách có lịch sử mượn/bán/yêu thích/đánh giá/chờ/thanh toán/nội dung không bị xóa mất liên kết. Bản sao có lịch sử thay đổi không bị xóa tùy tiện.
- Validation đầu vào, từ chối liên kết sai, lỗi dữ liệu trả thông báo thay vì chi tiết SQL.
- Phân trang danh mục ở backend và frontend; đổi mật khẩu trong hồ sơ.
- Bảo mật JWT, cấu hình secret, security headers; giữ compatibility APP_JWT_SECRET nhưng ưu tiên JWT_SECRET. Nếu không có secret dùng khóa ngẫu nhiên từng lần chạy: phải đăng nhập lại sau restart. Nên đặt secret riêng >=32 byte ở môi trường.
Cài đặt database bằng file duy nhất `database/library_db.sql`. Xem [hướng dẫn database](DATABASE.md). File khởi tạo sẽ xóa và tạo lại các bảng, cần sao lưu trước khi import; không chạy trên dữ liệu cần giữ.
- Menu: Tổng quan → Thể loại sách → Sách & tồn kho → Nhà xuất bản → Tác giả → nghiệp vụ còn lại → Báo cáo cuối cùng.
- PayOS: xem PAYOS_BANK_TRANSFER.md; không thêm bảng/cột ở đợt này.

## Kịch bản trình bày 10–15 phút

1. Giới thiệu mô hình reader Next.js gọi REST API Spring Boot; admin riêng, vai trò USER/LIBRARIAN/ADMIN.
2. Mở sơ đồ DB và dữ liệu liên kết; không dùng bảng rời ít dữ liệu.
3. Admin tạo thể loại/tác giả/NXB, tạo sách chọn các quan hệ; sửa phí/số lượng, xóa sách chưa dùng; thử xóa danh mục còn được dùng.
4. Reader tìm/lọc/phân trang, yêu thích, đánh giá, thêm giỏ; CASH tạo phiếu chờ thu tiền, admin xác nhận.
5. Sau khi có khóa PayOS: demo chuyển khoản thật, quay lại và đối soát; callback lặp vẫn một phiếu. Không đánh dấu PAID bằng URL hoặc sửa DB.
6. Trả từng phần, trả hết, kiểm tra lịch sử chỉ đã trả; gia hạn/chờ sách và tình huống bị từ chối.
7. Reader gọi API admin bị từ chối; phiên admin và reader độc lập, blocked user không đăng nhập được.
8. Chạy test backend và Playwright; minh họa network error/empty state và layout nhỏ.

## Giới hạn cần nói rõ

Không cam kết điểm số. Chưa điền khóa PayOS và webhook công khai nên chưa có bằng chứng ngân hàng thật; chưa có hoàn tiền tự động. Seed thanh toán tổng hợp chỉ để minh họa DB. Phân trang admin hiện lọc/phân trang phía client, không nên tự nhận tối ưu hàng triệu bản ghi. Chưa triển khai demo public trong lượt này.

## Kết quả xác minh ngày 06/11/2026

- Tổng báo cáo backend: 99 tests, 0 failures/errors (gồm 17 PayosIntegrationTest và 3 PayosGatewayTest).
- 22 kiểm thử UI giả lập qua Playwright; 5 kiểm thử đăng nhập/phân quyền/tách phiên trên backend MySQL thật; 4 kiểm thử lưu giỏ/idempotency đều qua.
- Next production build qua; ESLint 0 lỗi, còn 4 cảnh báo có sẵn về ảnh avatar và import chưa dùng.
- Backend khởi động với schema validate và seed=false, không áp seed hoặc thay schema dữ liệu thật. API PayOS khi thiếu khóa trả 409 với thông báo chưa cấu hình; danh mục API trả đúng cấu trúc phân trang.
- Chưa thử chuyển tiền ngân hàng thật vì chưa có khóa/kênh/webhook công khai.
