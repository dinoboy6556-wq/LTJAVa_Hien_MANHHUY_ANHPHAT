-- DESTRUCTIVE: backup first. For existing project schema only.
SET NAMES utf8mb4;
USE library_db;
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `authors`;
TRUNCATE TABLE `book_copies`;
TRUNCATE TABLE `book_reviews`;
TRUNCATE TABLE `books`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `favorites`;
TRUNCATE TABLE `fines`;
TRUNCATE TABLE `loan_items`;
TRUNCATE TABLE `loans`;
TRUNCATE TABLE `publishers`;
TRUNCATE TABLE `roles`;
TRUNCATE TABLE `sale_items`;
TRUNCATE TABLE `sales`;
TRUNCATE TABLE `user_roles`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS=1;
ALTER TABLE book_copies MODIFY barcode VARCHAR(50) NULL;
ALTER TABLE loan_items MODIFY quantity INT NOT NULL DEFAULT 1;
ALTER TABLE fines MODIFY user_id BIGINT NULL, MODIFY paid BIT(1) NOT NULL DEFAULT 0;
-- Chèn Roles
INSERT INTO roles (name) VALUES 
('ROLE_ADMIN'), 
('ROLE_LIBRARIAN'), 
('ROLE_USER');

-- Chèn Mật khẩu mẫu (Lưu ý: Trong thực tế Spring Security dùng BCryptPasswordEncoder)
INSERT INTO users (email, password, full_name, phone, address, user_type) VALUES 
('admin@library.com', '$2a$10$8DOlD/.fN0q46lWBZVXzwOwBSm8qUCSbhrl.81PyTpAS0e/LReBmi', 'Quản trị viên', '0901234567', 'Hà Nội', 'ADMIN'),
('librarian@library.com', '$2a$10$PdIVsrmuinm2VG2kAEgur.clOxFrzx9lgmAXQGW9.EimGPlKGBjES', 'Thủ thư Nguyễn Văn A', '0912345678', 'TP. Hồ Chí Minh', 'LIBRARIAN'),
('reader@gmail.com', '$2a$10$C68725Bap25MFoKUkT2.XO5z47ehkGUZIBywVCyvav4.n0CC3RlMa', 'Trần Văn Độc Giả', '0987654321', 'Đà Nẵng', 'CUSTOMER');

-- Gán Role người dùng
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, 1), (2, 2), (3, 3);

-- Chèn Danh mục
INSERT INTO categories (name, description) VALUES 
('Lập trình & CNTT', 'Sách về lập trình, thuật toán, công nghệ'),
('Văn học & Tiểu thuyết', 'Các tác phẩm văn học nổi tiếng'),
('Kinh tế & Quản trị', 'Sách kinh doanh, quản trị doanh nghiệp');

-- Chèn Tác giả
INSERT INTO authors (name, biography) VALUES 
('Robert C. Martin', 'Robert C. Martin, còn gọi là Uncle Bob, là tác giả và nhà tư vấn phần mềm. Ông viết Clean Code, The Clean Coder và Clean Architecture.'),
('Tô Hoài', 'Tô Hoài (1920–2014), tên khai sinh Nguyễn Sen, là nhà văn Việt Nam. Ông được biết đến qua Dế Mèn phiêu lưu ký, Truyện Tây Bắc và Cát bụi chân ai.');

-- Chèn Nhà xuất bản
INSERT INTO publishers (name, address, phone) VALUES 
('NXB Thông tin và Truyền thông', 'Hà Nội', '0241234567'),
('NXB Kim Đồng', 'Hà Nội', '0247654321');

-- Chèn Đầu sách mẫu
INSERT INTO books (title, isbn, category_id, author_id, publisher_id, total_quantity, available_quantity, rental_price, sale_price, status) VALUES 
('Clean Code: A Handbook of Agile Software Craftsmanship', '9780132350884', 1, 1, 1, 5, 4, 15000.00, 350000.00, 'AVAILABLE'),
('Dế Mèn Phiêu Lưu Ký', '9786042000001', 2, 2, 2, 10, 10, 5000.00, 50000.00, 'AVAILABLE'),
('Lập Trình Java Nâng Cao (Hết hàng mẫu)', '9786042000002', 1, 1, 1, 2, 0, 20000.00, 200000.00, 'OUT_OF_STOCK');

-- Chèn Mã vạch từng bản sao (Book copies)
INSERT INTO book_copies (book_id, code, status, condition_note) VALUES 
(1, 'BC-CC-001', 'BORROWED', 'Sách mới'),
(1, 'BC-CC-002', 'AVAILABLE', 'Sách mới'),
(1, 'BC-CC-003', 'AVAILABLE', 'Hơi cũ góc bia'),
(1, 'BC-CC-004', 'AVAILABLE', 'Sách mới'),
(1, 'BC-CC-005', 'AVAILABLE', 'Sách mới');

-- Chèn Đơn Mượn Mẫu
INSERT INTO loans (user_id, borrow_date, due_date, status, rental_fee) VALUES 
(3, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY), 'BORROWED', 15000.00);

-- Chèn Chi tiết Đơn Mượn
INSERT INTO loan_items (loan_id, book_id, book_copy_id, rental_price) VALUES 
(1, 1, 1, 15000.00);
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00001','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00002','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00003','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00004','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00005','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00006','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00007','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00008','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00009','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(2,'B2-00010','AVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(3,'B3-00001','UNAVAILABLE');
INSERT INTO book_copies(book_id,code,status) VALUES(3,'B3-00002','UNAVAILABLE');