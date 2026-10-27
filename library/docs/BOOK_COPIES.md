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

## Cách cập nhật database có dữ liệu (mỗi thành viên thực hiện trên máy mình)

1. Nhận đầy đủ code mới. Dừng tất cả phiên backend cũ đang dùng database này; không cho người dùng mượn/trả trong lúc chuyển đổi.
2. Bật MySQL trong Laragon. Xuất backup **toàn bộ** `library_db` (cả cấu trúc lẫn dữ liệu) bằng HeidiSQL/phpMyAdmin trước khi chạy.
3. Kiểm tra `src/main/resources/application.properties` trỏ `jdbc:mysql://127.0.0.1:3306/library_db`, đúng tài khoản/mật khẩu máy bạn. Không đổi sang `library_management`. Giữ `spring.jpa.hibernate.ddl-auto=update`, KHÔNG dùng `create`/`create-drop` trên dữ liệu thật.
4. Mở terminal tại thư mục `library`, chạy một lần:

```powershell
.\mvnw.cmd "-Dspring-boot.run.arguments=--app.book-copies.migrate=true" spring-boot:run
```

Hibernate tạo bảng `book_copies` và hai cột FK kể trên. Runner chuyển đổi sau khi bộ dữ liệu mẫu khởi tạo xong. Cờ migrate mặc định **tắt**: chạy thường chỉ cập nhật schema, không tự suy diễn các quyển cho dữ liệu cũ.

5. Chỉ cho sử dụng sau khi ứng dụng hoàn tất khởi động, không có lỗi migration và các truy vấn đối chiếu bên dưới đạt. Kiểm tra trạng thái trên `/user/books/{id}`. Có thể dừng bằng Ctrl+C rồi chạy thường:

```powershell
.\mvnw.cmd spring-boot:run
```

Với database mới, cũng chạy cờ migrate một lần để tạo mã cho sách mẫu. Đầu sách thêm qua API sau đó tự sinh mã ngay; không cần bật cờ cho mỗi lần nhập sách.

Lệnh trên chạy được từ thư mục gốc qua wrapper ở root hoặc từ `library` qua wrapper trong module. Nếu không muốn dùng Maven Wrapper, dùng Maven đã cài sẵn: `mvn "-Dspring-boot.run.arguments=--app.book-copies.migrate=true" spring-boot:run`. Nếu Maven báo không mở được khóa trong `.m2/repository`, đóng các tiến trình Maven khác hoặc chuyển kho dependency sang chỗ có quyền ghi: `.\mvnw.cmd "-Dmaven.repo.local=$env:LOCALAPPDATA\maven-cache\repository" "-Dspring-boot.run.arguments=--app.book-copies.migrate=true" spring-boot:run`. Nếu wrapper không tải/cài được chính Maven distribution trong `.m2`, đặt `MAVEN_USER_HOME` sang thư mục ghi được. Nếu app bắt đầu nhưng báo lỗi kết nối, bật MySQL Laragon và kiểm tra `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`.

### Quy tắc chuyển đổi

- Tạo đúng `total_quantity` quyển cho mỗi đầu sách chưa có mã quyển.
- Gắn các phiếu BORROWED/OVERDUE đang mở với các quyển BORROWED. Dòng phiếu cũ có quantity > 1 được tách thành các dòng quantity=1; giữ cùng phiếu, giá mỗi quyển, tổng phí và ngày mượn/trả.
- Tạo `available_quantity` quyển AVAILABLE.
- Số còn lại thành UNAVAILABLE. Bộ đếm cũ không cho biết chính xác quyển nào hỏng/mất/đã bán; thủ thư kiểm kê và gắn mã lên sách vật lý. Không khẳng định mã vừa sinh là mã lịch sử thực tế.
- Phiếu đã trả và hóa đơn cũ giữ nguyên, copy FK null vì không thể truy ngược từng quyển từ số lượng gộp. Phiếu/hóa đơn mới có mã quyển rõ ràng.
- Nếu `available_quantity + số lượng đang mượn > total_quantity`, số âm hoặc dữ liệu mã quyển đã tạo nhưng không nhất quán: dừng và báo book ID để kiểm tra. Không tự tăng tổng để che dữ liệu sai.
- Chuyển đổi trong transaction **từng đầu sách**. Nếu lỗi giữa chừng, các đầu sách trước đã chuyển vẫn được giữ. Sửa dữ liệu bất nhất rồi chạy lại: đầu sách đã chuyển hợp lệ được bỏ qua, không tạo trùng mã.
- Không rollback bằng cách xóa `book_copies`: nếu cần quay về code cũ, khôi phục toàn bộ backup trong thời gian bảo trì; tránh làm mất giao dịch phát sinh sau backup.

### SQL đối chiếu trong Laragon

```sql
USE library_db;
-- Hai cột FK mới phải tồn tại.
SHOW COLUMNS FROM loan_items LIKE 'book_copy_id';
SHOW COLUMNS FROM sale_items LIKE 'book_copy_id';

-- Kết quả phải rỗng sau migration: kiểm tra bộ đếm.
SELECT b.id, b.title, b.total_quantity, b.available_quantity,
       COUNT(c.id) AS copies,
       COALESCE(SUM(c.status = 'AVAILABLE'), 0) AS available_copies
FROM books b LEFT JOIN book_copies c ON c.book_id = b.id
GROUP BY b.id, b.title, b.total_quantity, b.available_quantity
HAVING b.total_quantity <> COUNT(c.id)
    OR b.available_quantity <> COALESCE(SUM(c.status = 'AVAILABLE'), 0);

-- Kết quả phải rỗng: mọi dòng đang mượn có mã quyển đúng đầu sách/trạng thái.
SELECT li.id, li.book_id, li.book_copy_id
FROM loan_items li JOIN loans l ON l.id = li.loan_id
LEFT JOIN book_copies c ON c.id = li.book_copy_id
WHERE l.status IN ('BORROWED', 'OVERDUE')
  AND (c.id IS NULL OR c.book_id <> li.book_id OR c.status <> 'BORROWED' OR li.quantity <> 1);

-- Kết quả phải rỗng: một quyển không nằm trong hai phiếu đang mở.
SELECT li.book_copy_id, COUNT(*)
FROM loan_items li JOIN loans l ON l.id = li.loan_id
WHERE l.status IN ('BORROWED', 'OVERDUE') AND li.book_copy_id IS NOT NULL
GROUP BY li.book_copy_id HAVING COUNT(*) > 1;

-- Danh sách cần kiểm kê, không nhất thiết rỗng.
SELECT c.code, b.title, c.status
FROM book_copies c JOIN books b ON b.id = c.book_id
WHERE c.status = 'UNAVAILABLE';
```

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
