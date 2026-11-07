# Quản lý từng quyển sách — cập nhật database cho cả nhóm

Ngày cập nhật: 24/10/2026. Database Laragon: `library_db`. Java 21, Spring Boot 3.

## Mô hình và ý nghĩa

- `books`: đầu sách (tên, ISBN, tác giả, giá). Không gộp đầu sách chỉ vì trùng tên.
- **Bảng mới `book_copies`**: mỗi dòng là một quyển vật lý, thuộc một `books.id`.
- Ví dụ: đầu sách ID 12 có các mã `B12-00001`, `B12-00002`. Mã sinh tự động, duy nhất toàn database.
- `loan_items.book_copy_id` và `sale_items.book_copy_id`: hai cột FK mới, có thể null cho lịch sử cũ. Một dòng giao dịch mới tương ứng một quyển, `quantity = 1`. Mượn/bán 3 quyển tạo 3 dòng; API yêu cầu đầu vào vẫn nhận `{bookId, quantity}` như trước.

| Cột book_copies | Kiểu | Ý nghĩa |
|---|---|---|
| id | BIGINT, PK, tự tăng | Khóa quyển |
| book_id | BIGINT, FK -> books.id, NOT NULL | Đầu sách |
| code | VARCHAR(64), UNIQUE, NOT NULL | Mã dán lên sách |
| status | VARCHAR(32), NOT NULL | Trạng thái |

Có index `(book_id, status)`. Không xóa bản sách đã phát sinh giao dịch; không sửa mã trực tiếp bằng SQL.

| Trạng thái | Hiển thị | Tác động tồn kho |
|---|---|---|
| AVAILABLE | Còn trong kho | Được mượn/bán |
| BORROWED | Đang mượn | Không được mượn/bán lần nữa |
| DAMAGED | Bị hỏng | Không sẵn có |
| LOST | Bị mất | Không sẵn có |
| SOLD | Đã bán | Không sẵn có |
| UNAVAILABLE | Cần kiểm kê | Số lượng cũ không xác định được lý do thiếu |

`books.available_quantity` được đồng bộ bằng số quyển AVAILABLE. `books.total_quantity` là tổng số mã quyển đã nhập, gồm cả các mã mất/hỏng/đã bán được giữ để theo dõi. Không nhập tay hai bộ đếm sau chuyển đổi. Giá và thông tin đầu sách vẫn ở `books`.

## Chuẩn bị database

Cài đặt database bằng file duy nhất `database/library_db.sql`. Xem [hướng dẫn database](DATABASE.md). File khởi tạo sẽ xóa và tạo lại các bảng, cần sao lưu trước khi import; không chạy trên dữ liệu cần giữ.

File đã có mã quyển và bộ đếm tồn kho phù hợp, không cần chạy runner chuyển đổi sau khi import.

## API dùng chung cho nhóm

- `GET /api/v1/books/{bookId}/copies`: danh sách ID, mã quyển, trạng thái; công khai như danh mục sách, không trả người mượn.
- `POST /api/v1/books/{bookId}/copies`, body `{"quantity": 2}`: nhập thêm quyển, sinh mã mới; chỉ ADMIN/LIBRARIAN.
- `PATCH /api/v1/books/{bookId}/copies/{copyId}`, body `{"status":"AVAILABLE"}`: kiểm kê/sửa chữa; chỉ ADMIN/LIBRARIAN. Không chỉnh trực tiếp quyển đang BORROWED hoặc SOLD; không đặt trạng thái BORROWED/SOLD bằng API kiểm kê.
- `POST /api/v1/loans`: đầu vào không đổi. Tự chọn các mã AVAILABLE theo ID tăng dần, chuyển BORROWED. Chưa hỗ trợ độc giả chọn đích danh một mã quyển.
- Trả phiếu NORMAL -> AVAILABLE; DAMAGED -> DAMAGED; LOST -> LOST. Hiện tại tình trạng trả áp dụng **cả phiếu**, chưa tách tình trạng từng quyển trên cùng phiếu.
- Bán sách -> SOLD, không đưa lại vào danh sách được mượn.
- Thao tác mượn/trả/bán/nhập/kiểm kê dùng transaction và khóa đầu sách để hai yêu cầu không lấy cùng quyển. Trả phiếu khóa thêm phiếu để tránh trả hai lần.
- Các API ghi dữ liệu cần `Authorization: Bearer <token>`; API quản lý quyển cần vai trò thủ thư/quản trị. Chưa có màn hình nhập/kiểm kê riêng; nhóm có thể dùng Postman gọi các API này.

## Kiểm thử và giới hạn xác nhận

```powershell
.\mvnw.cmd test
node --test src/test/js/*.test.cjs
```

Kiểm thử database chạy trên H2 tạm, không sửa dữ liệu Laragon. Bao gồm sinh mã, mượn/trả/hỏng/mất/bán, chuyển đổi phiếu gộp, dữ liệu sai, quyền quản lý và hai yêu cầu cùng lấy quyển cuối. Cần thực hiện đối chiếu trên MySQL sau migration của từng máy; Hibernate update schema không thay thế việc sao lưu/kiểm kê thực tế.
