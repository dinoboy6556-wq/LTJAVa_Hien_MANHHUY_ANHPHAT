-- THU VIEN MOC - FILE KHOI TAO DATABASE DUY NHAT
-- MySQL 8.x / Laragon. Database: library_db. Encoding: UTF-8.
-- CANH BAO: IMPORT FILE NAY SE XOA VA TAO LAI CAC BANG CUA PROJECT.
-- Sao luu database va dung backend truoc khi import. Khong dung de nang cap du lieu dang van hanh.
-- Gom schema hien tai, bang OTP, danh muc sach/ma quyen, noi dung thu vien va 3 tai khoan thu nghiem.
-- Khong chua lich su giao dich, tai khoan ca nhan, OTP hay khoa thanh toan/mail cua may nguoi tao.
-- Quyen dang BORROWED trong danh muc duoc tra ve AVAILABLE vi khong mang theo phieu muon cu.
-- Tai khoan local: admin@library.com / admin123; librarian@library.com / librarian123; reader@gmail.com / reader123.
CREATE DATABASE IF NOT EXISTS `library_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `library_db`;
SET NAMES utf8mb4;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `target` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `authors` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `biography` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `book_copies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_copies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `book_id` bigint NOT NULL,
  `barcode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('AVAILABLE','BORROWED','DAMAGED','LOST','SOLD','UNAVAILABLE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `condition_note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKayqp2x56rl40hiofs5mqkjvqy` (`code`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `idx_copy_book_status` (`book_id`,`status`),
  CONSTRAINT `fk_copies_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `book_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_questions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `question` varchar(1200) NOT NULL,
  `answer` varchar(1200) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `answered_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_book_questions_book` (`book_id`),
  KEY `fk_book_question_user` (`user_id`),
  CONSTRAINT `fk_book_question_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `fk_book_question_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `book_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_reactions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `reaction` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK59dxui576hrlxu4dstpqpm9ow` (`user_id`,`book_id`),
  KEY `FK14cf4ed864r7v3a3ay8myki9d` (`book_id`),
  CONSTRAINT `FK14cf4ed864r7v3a3ay8myki9d` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `FKlr3p3vbgh8gyb442t7xbg8lln` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `book_readings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_readings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `read_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_book_reading_user_book` (`user_id`,`book_id`),
  KEY `fk_book_reading_book` (`book_id`),
  CONSTRAINT `fk_book_reading_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `fk_book_reading_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `book_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_reviews` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `comment` varchar(1200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `rating` int NOT NULL,
  `book_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK1ew19gxgp7nujgcbfx9lsm7l4` (`user_id`,`book_id`),
  KEY `FKcm2shivx19spbg0flc47mcrs1` (`book_id`),
  CONSTRAINT `FKcm2shivx19spbg0flc47mcrs1` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `FKon3wfhxgwpfu7kl1wu54mw78u` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isbn` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `author_id` bigint DEFAULT NULL,
  `publisher_id` bigint DEFAULT NULL,
  `total_quantity` int NOT NULL DEFAULT '0',
  `available_quantity` int NOT NULL DEFAULT '0',
  `rental_price` decimal(38,2) NOT NULL,
  `sale_price` decimal(38,2) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cover_image_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(4000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `isbn` (`isbn`),
  KEY `idx_books_status` (`status`),
  KEY `idx_books_title` (`title`),
  KEY `fk_books_category` (`category_id`),
  KEY `fk_books_author` (`author_id`),
  KEY `fk_books_publisher` (`publisher_id`),
  CONSTRAINT `fk_books_author` FOREIGN KEY (`author_id`) REFERENCES `authors` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_books_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_books_publisher` FOREIGN KEY (`publisher_id`) REFERENCES `publishers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `borrow_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `borrow_payments` (
  `id` varchar(32) NOT NULL,
  `user_id` bigint NOT NULL,
  `request_key` varchar(64) NOT NULL,
  `amount` decimal(19,2) NOT NULL,
  `status` varchar(30) NOT NULL,
  `request_json` text NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `loan_id` bigint DEFAULT NULL,
  `transaction_no` varchar(255) DEFAULT NULL,
  `message` varchar(1000) DEFAULT NULL,
  `method` varchar(20) NOT NULL DEFAULT 'VNPAY',
  `confirmed_by` varchar(255) DEFAULT NULL,
  `confirmed_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_borrow_payment_request` (`user_id`,`request_key`),
  UNIQUE KEY `UK30fqnot8tlyw1neyyjw3ox3ec` (`user_id`,`request_key`),
  CONSTRAINT `fk_borrow_payment_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `copy_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `copy_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `copy_id` bigint NOT NULL,
  `action` varchar(255) NOT NULL,
  `previous_status` varchar(255) DEFAULT NULL,
  `new_status` varchar(255) NOT NULL,
  `actor` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_copy_events_copy` (`copy_id`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favorites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `book_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKdj8u2xu5w2v2bp269hq2hl6et` (`user_id`,`book_id`),
  KEY `FKa6cfgr81tbdyhq61i1owech90` (`book_id`),
  CONSTRAINT `FKa6cfgr81tbdyhq61i1owech90` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `FKk7du8b8ewipawnnpg76d55fus` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `fines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `loan_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `amount` decimal(38,2) NOT NULL,
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `paid` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`),
  KEY `idx_fines_status` (`status`),
  KEY `fk_fines_loan` (`loan_id`),
  KEY `fk_fines_user` (`user_id`),
  CONSTRAINT `fk_fines_loan` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fines_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `library_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_content` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `kind` varchar(20) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `body` longtext,
  `link` varchar(500) DEFAULT NULL,
  `book_id` bigint DEFAULT NULL,
  `published` bit(1) NOT NULL DEFAULT b'0',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `loan_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `loan_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `book_copy_id` bigint DEFAULT NULL,
  `rental_price` decimal(38,2) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `returned_at` date DEFAULT NULL,
  `return_condition` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_requested_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_li_loan` (`loan_id`),
  KEY `fk_li_book` (`book_id`),
  KEY `fk_li_copy` (`book_copy_id`),
  CONSTRAINT `fk_li_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_li_copy` FOREIGN KEY (`book_copy_id`) REFERENCES `book_copies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_li_loan` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `loans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `loan_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `due_date` date NOT NULL,
  `return_date` date DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RENTING',
  `total_fee` decimal(12,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `borrow_date` date NOT NULL,
  `fine_amount` decimal(38,2) DEFAULT NULL,
  `rental_fee` decimal(38,2) NOT NULL,
  `renewal_count` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_loans_status` (`status`),
  KEY `idx_loans_user` (`user_id`),
  CONSTRAINT `fk_loans_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `publishers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `publishers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(19,2) NOT NULL,
  `request_key` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','PAID','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `sale_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_purchase_request` (`user_id`,`request_key`),
  UNIQUE KEY `uq_purchase_sale` (`sale_id`),
  KEY `fk_purchase_book` (`book_id`),
  CONSTRAINT `fk_purchase_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `fk_purchase_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`),
  CONSTRAINT `fk_purchase_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reservation_user_book` (`user_id`,`book_id`),
  UNIQUE KEY `UKmgnp0ii36iyecc10en92goeb3` (`user_id`,`book_id`),
  KEY `fk_reservation_book` (`book_id`),
  CONSTRAINT `fk_reservation_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`),
  CONSTRAINT `fk_reservation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `sale_id` bigint NOT NULL,
  `book_id` bigint NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(38,2) NOT NULL,
  `subtotal` decimal(38,2) NOT NULL,
  `book_copy_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_si_sale` (`sale_id`),
  KEY `fk_si_book` (`book_id`),
  KEY `FKb5w036c93x9oc26i1x1uyilhy` (`book_copy_id`),
  CONSTRAINT `fk_si_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_si_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FKb5w036c93x9oc26i1x1uyilhy` FOREIGN KEY (`book_copy_id`) REFERENCES `book_copies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `total_amount` decimal(38,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sales_user` (`user_id`),
  CONSTRAINT `fk_sales_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `fk_ur_role` (`role_id`),
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'CUSTOMER',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `avatar_data` longtext COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;



DROP TABLE IF EXISTS `password_change_otps`;
CREATE TABLE `password_change_otps` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_code` varchar(6) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `used` bit(1) NOT NULL DEFAULT b'0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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


INSERT INTO `authors` (`id`, `name`, `bio`, `biography`) VALUES (1,'Robert C. Martin',NULL,'Robert C. Martin, còn gọi là Uncle Bob, là tác giả và nhà tư vấn phần mềm. Ông viết Clean Code, The Clean Coder và Clean Architecture.');
INSERT INTO `authors` (`id`, `name`, `bio`, `biography`) VALUES (2,'Tô Hoài',NULL,'Tô Hoài (1920–2014), tên khai sinh Nguyễn Sen, là nhà văn Việt Nam. Ông được biết đến qua Dế Mèn phiêu lưu ký, Truyện Tây Bắc và Cát bụi chân ai.');
INSERT INTO `authors` (`id`, `name`, `bio`, `biography`) VALUES (3,'Nguyễn Minh An',NULL,'Tác giả hư cấu trong danh mục thư viện Mộc. Các đầu sách gắn với tên Nguyễn Minh An có chủ đề như thói quen và kỹ năng sống.');
INSERT INTO `authors` (`id`, `name`, `bio`, `biography`) VALUES (4,'Trần Thu Hà',NULL,'Tác giả hư cấu trong danh mục thư viện Mộc. Các đầu sách gắn với tên Trần Thu Hà có chủ đề như kỹ năng sống và ngoại ngữ.');
INSERT INTO `authors` (`id`, `name`, `bio`, `biography`) VALUES (5,'Lê Hoàng Nam',NULL,'Tác giả hư cấu trong danh mục thư viện Mộc. Các đầu sách gắn với tên Lê Hoàng Nam có chủ đề như kỹ năng sống và truyện thiếu nhi.');
INSERT INTO `authors` (`id`, `name`, `bio`, `biography`) VALUES (6,'Phạm Ngọc Linh',NULL,'Tác giả hư cấu trong danh mục thư viện Mộc. Các đầu sách gắn với tên Phạm Ngọc Linh có chủ đề như kỹ năng sống và khoa học phổ thông.');
INSERT INTO `authors` (`id`, `name`, `bio`, `biography`) VALUES (7,'Võ Thanh Bình',NULL,'Tác giả hư cấu trong danh mục thư viện Mộc. Các đầu sách gắn với tên Võ Thanh Bình có chủ đề như khoa học phổ thông và truyện thiếu nhi.');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (1,'Lập trình & CNTT','Sách về lập trình, thuật toán, công nghệ');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (2,'Văn học & Tiểu thuyết','Các tác phẩm văn học nổi tiếng');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (3,'Kinh tế & Quản trị','Sách kinh doanh, quản trị doanh nghiệp');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (4,'Kỹ năng sống','Sách kỹ năng sống.');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (5,'Khoa học phổ thông','Sách khoa học phổ thông.');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (6,'Lịch sử & Văn hóa','Sách lịch sử & văn hóa.');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (7,'Ngoại ngữ','Sách ngoại ngữ.');
INSERT INTO `categories` (`id`, `name`, `description`) VALUES (8,'Thiếu nhi','Sách thiếu nhi.');
INSERT INTO `publishers` (`id`, `name`, `address`, `phone`) VALUES (1,'NXB Thông tin và Truyền thông','Hà Nội','0241234567');
INSERT INTO `publishers` (`id`, `name`, `address`, `phone`) VALUES (2,'NXB Kim Đồng','Hà Nội','0247654321');
INSERT INTO `publishers` (`id`, `name`, `address`, `phone`) VALUES (3,'NXB Mộc Tri Thức','Hà Nội','02870000000');
INSERT INTO `publishers` (`id`, `name`, `address`, `phone`) VALUES (4,'NXB Mộc Sáng Tạo','TP. Hồ Chí Minh','02870000001');
INSERT INTO `publishers` (`id`, `name`, `address`, `phone`) VALUES (5,'NXB Mộc Văn Hóa','Đà Nẵng','02870000002');
INSERT INTO `publishers` (`id`, `name`, `address`, `phone`) VALUES (6,'NXB Mộc Học Tập','Huế','02870000003');
INSERT INTO `publishers` (`id`, `name`, `address`, `phone`) VALUES (7,'NXB Mộc Tuổi Thơ','Cần Thơ','02870000004');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (1,'Clean Code: A Handbook of Agile Software Craftsmanship','9780132350884',1,1,1,5,5,15000.00,350000.00,'AVAILABLE','2026-10-29 03:00:31','2026-11-05 20:23:23','/images/covers/moc-7cedd439b9cd.svg',NULL);
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (2,'Dế Mèn Phiêu Lưu Ký','9786042000001',2,2,2,10,9,5000.00,50000.00,'AVAILABLE','2026-10-29 03:00:31','2026-11-05 20:23:23','/images/covers/moc-dece88bd22b9.svg',NULL);
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (3,'Lập Trình Java Nâng Cao (Hết hàng )','9786042000002',1,1,1,2,0,20000.00,200000.00,'OUT_OF_STOCK','2026-10-29 03:00:31','2026-11-06 00:02:35','/images/covers/moc-102a9055663a.svg',NULL);
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (4,'Thói quen nhỏ mỗi ngày','20261106-01',4,3,4,3,3,5000.00,60000.00,'AVAILABLE','2026-11-05 20:16:23','2026-11-06 00:12:38','/images/covers/moc-9d24cf1c886f.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (5,'Quản lý thời gian hiệu quả','20261106-02',4,4,5,4,4,6000.00,70000.00,'AVAILABLE','2026-11-05 20:16:23','2026-11-06 00:12:38','/images/covers/moc-642047858126.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (6,'Lắng nghe và thấu hiểu','20261106-03',4,5,6,5,5,7000.00,80000.00,'AVAILABLE','2026-11-05 20:16:23','2026-11-06 00:12:38','/images/covers/moc-a03b946118f8.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (7,'Tự tin bước về phía trước','20261106-04',4,6,7,6,6,8000.00,90000.00,'AVAILABLE','2026-11-05 20:16:23','2026-11-06 00:12:38','/images/covers/moc-e23b02981196.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (8,'Khám phá hệ Mặt Trời','20261106-05',5,4,5,7,7,9000.00,100000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-b200fad081a5.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (9,'Khoa học trong căn bếp','20261106-06',5,5,6,3,3,10000.00,110000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-5cb232b62423.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (10,'Bí mật của đại dương','20261106-07',5,6,7,4,2,11000.00,120000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 03:32:23','/images/covers/moc-65482da7db10.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (11,'Thế giới thực vật quanh ta','20261106-08',5,7,3,5,5,12000.00,130000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-26587756cfbc.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (12,'Hành trình qua các di sản Việt Nam','20261106-09',6,5,6,6,6,13000.00,140000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-c6c7e10d6669.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (13,'Chuyện kể những làng nghề','20261106-10',6,6,7,7,7,14000.00,150000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-63cb9d435e52.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (14,'Một vòng văn hóa Việt','20261106-11',6,7,3,3,3,15000.00,160000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-db26fe178ad1.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (15,'Dấu chân trên con đường lịch sử','20261106-12',6,3,4,4,4,16000.00,170000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-25bc8fd02719.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (16,'Tiếng Anh giao tiếp mỗi ngày','20261106-13',7,6,7,5,5,17000.00,180000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-dba5b1dbd477.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (17,'Từ vựng tiếng Anh qua câu chuyện','20261106-14',7,7,3,6,6,18000.00,190000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-0edc65b0f740.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (18,'Ngữ pháp tiếng Anh dễ hiểu','20261106-15',7,3,4,7,7,19000.00,200000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-40467755bb18.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (19,'Luyện đọc tiếng Anh theo chủ đề','20261106-16',7,4,5,3,3,20000.00,210000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-90be3ea49fda.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (20,'Khu vườn của những giấc mơ','20261106-17',8,7,3,4,4,21000.00,220000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-fcc358ce8ed1.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (21,'Cuộc phiêu lưu trong rừng xanh','20261106-18',8,3,4,5,5,22000.00,230000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 00:12:38','/images/covers/moc-14120742c141.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (22,'Chú mèo và thành phố nhỏ','20261106-19',8,4,5,6,5,23000.00,240000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 03:27:06','/images/covers/moc-d1ad34eb60bb.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (23,'Những câu chuyện trước giờ ngủ','20261106-20',8,5,6,7,4,24000.00,250000.00,'AVAILABLE','2026-11-05 20:16:24','2026-11-06 03:26:16','/images/covers/moc-0f926f44f91f.svg','');
INSERT INTO `books` (`id`, `title`, `isbn`, `category_id`, `author_id`, `publisher_id`, `total_quantity`, `available_quantity`, `rental_price`, `sale_price`, `status`, `created_at`, `updated_at`, `cover_image_url`, `description`) VALUES (24,'sach anh phat','BB_AA',2,1,2,1,0,10000.00,12000.00,'OUT_OF_STOCK','2026-11-06 03:05:58','2026-11-06 03:31:07','/images/book-covers/5d9df04915e24c20913e4841b79708aa.png','sach dang cap nhat the gioi');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (1,1,NULL,'AVAILABLE','Sách mới','BC-CC-001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (2,1,NULL,'AVAILABLE','Sách mới','BC-CC-002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (3,1,NULL,'AVAILABLE','Hơi cũ góc bia','BC-CC-003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (4,1,NULL,'AVAILABLE','Sách mới','BC-CC-004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (5,1,NULL,'AVAILABLE','Sách mới','BC-CC-005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (6,2,NULL,'DAMAGED',NULL,'B2-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (7,2,NULL,'AVAILABLE',NULL,'B2-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (8,2,NULL,'AVAILABLE',NULL,'B2-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (9,2,NULL,'AVAILABLE',NULL,'B2-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (10,2,NULL,'AVAILABLE',NULL,'B2-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (11,2,NULL,'AVAILABLE',NULL,'B2-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (12,2,NULL,'AVAILABLE',NULL,'B2-00007');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (13,2,NULL,'AVAILABLE',NULL,'B2-00008');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (14,2,NULL,'AVAILABLE',NULL,'B2-00009');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (15,2,NULL,'AVAILABLE',NULL,'B2-00010');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (16,3,NULL,'UNAVAILABLE',NULL,'B3-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (17,3,NULL,'UNAVAILABLE',NULL,'B3-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (18,4,NULL,'AVAILABLE',NULL,'B4-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (19,4,NULL,'AVAILABLE',NULL,'B4-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (20,4,NULL,'AVAILABLE',NULL,'B4-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (21,5,NULL,'AVAILABLE',NULL,'B5-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (22,5,NULL,'AVAILABLE',NULL,'B5-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (23,5,NULL,'AVAILABLE',NULL,'B5-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (24,5,NULL,'AVAILABLE',NULL,'B5-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (25,6,NULL,'AVAILABLE',NULL,'B6-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (26,6,NULL,'AVAILABLE',NULL,'B6-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (27,6,NULL,'AVAILABLE',NULL,'B6-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (28,6,NULL,'AVAILABLE',NULL,'B6-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (29,6,NULL,'AVAILABLE',NULL,'B6-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (30,7,NULL,'AVAILABLE',NULL,'B7-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (31,7,NULL,'AVAILABLE',NULL,'B7-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (32,7,NULL,'AVAILABLE',NULL,'B7-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (33,7,NULL,'AVAILABLE',NULL,'B7-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (34,7,NULL,'AVAILABLE',NULL,'B7-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (35,7,NULL,'AVAILABLE',NULL,'B7-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (36,8,NULL,'AVAILABLE',NULL,'B8-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (37,8,NULL,'AVAILABLE',NULL,'B8-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (38,8,NULL,'AVAILABLE',NULL,'B8-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (39,8,NULL,'AVAILABLE',NULL,'B8-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (40,8,NULL,'AVAILABLE',NULL,'B8-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (41,8,NULL,'AVAILABLE',NULL,'B8-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (42,8,NULL,'AVAILABLE',NULL,'B8-00007');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (43,9,NULL,'AVAILABLE',NULL,'B9-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (44,9,NULL,'AVAILABLE',NULL,'B9-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (45,9,NULL,'AVAILABLE',NULL,'B9-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (46,10,NULL,'AVAILABLE',NULL,'B10-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (47,10,NULL,'AVAILABLE',NULL,'B10-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (48,10,NULL,'AVAILABLE',NULL,'B10-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (49,10,NULL,'AVAILABLE',NULL,'B10-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (50,11,NULL,'AVAILABLE',NULL,'B11-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (51,11,NULL,'AVAILABLE',NULL,'B11-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (52,11,NULL,'AVAILABLE',NULL,'B11-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (53,11,NULL,'AVAILABLE',NULL,'B11-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (54,11,NULL,'AVAILABLE',NULL,'B11-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (55,12,NULL,'AVAILABLE',NULL,'B12-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (56,12,NULL,'AVAILABLE',NULL,'B12-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (57,12,NULL,'AVAILABLE',NULL,'B12-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (58,12,NULL,'AVAILABLE',NULL,'B12-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (59,12,NULL,'AVAILABLE',NULL,'B12-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (60,12,NULL,'AVAILABLE',NULL,'B12-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (61,13,NULL,'AVAILABLE',NULL,'B13-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (62,13,NULL,'AVAILABLE',NULL,'B13-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (63,13,NULL,'AVAILABLE',NULL,'B13-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (64,13,NULL,'AVAILABLE',NULL,'B13-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (65,13,NULL,'AVAILABLE',NULL,'B13-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (66,13,NULL,'AVAILABLE',NULL,'B13-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (67,13,NULL,'AVAILABLE',NULL,'B13-00007');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (68,14,NULL,'AVAILABLE',NULL,'B14-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (69,14,NULL,'AVAILABLE',NULL,'B14-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (70,14,NULL,'AVAILABLE',NULL,'B14-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (71,15,NULL,'AVAILABLE',NULL,'B15-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (72,15,NULL,'AVAILABLE',NULL,'B15-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (73,15,NULL,'AVAILABLE',NULL,'B15-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (74,15,NULL,'AVAILABLE',NULL,'B15-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (75,16,NULL,'AVAILABLE',NULL,'B16-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (76,16,NULL,'AVAILABLE',NULL,'B16-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (77,16,NULL,'AVAILABLE',NULL,'B16-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (78,16,NULL,'AVAILABLE',NULL,'B16-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (79,16,NULL,'AVAILABLE',NULL,'B16-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (80,17,NULL,'AVAILABLE',NULL,'B17-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (81,17,NULL,'AVAILABLE',NULL,'B17-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (82,17,NULL,'AVAILABLE',NULL,'B17-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (83,17,NULL,'AVAILABLE',NULL,'B17-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (84,17,NULL,'AVAILABLE',NULL,'B17-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (85,17,NULL,'AVAILABLE',NULL,'B17-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (86,18,NULL,'AVAILABLE',NULL,'B18-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (87,18,NULL,'AVAILABLE',NULL,'B18-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (88,18,NULL,'AVAILABLE',NULL,'B18-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (89,18,NULL,'AVAILABLE',NULL,'B18-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (90,18,NULL,'AVAILABLE',NULL,'B18-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (91,18,NULL,'AVAILABLE',NULL,'B18-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (92,18,NULL,'AVAILABLE',NULL,'B18-00007');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (93,19,NULL,'AVAILABLE',NULL,'B19-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (94,19,NULL,'AVAILABLE',NULL,'B19-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (95,19,NULL,'AVAILABLE',NULL,'B19-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (96,20,NULL,'AVAILABLE',NULL,'B20-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (97,20,NULL,'AVAILABLE',NULL,'B20-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (98,20,NULL,'AVAILABLE',NULL,'B20-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (99,20,NULL,'AVAILABLE',NULL,'B20-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (100,21,NULL,'AVAILABLE',NULL,'B21-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (101,21,NULL,'AVAILABLE',NULL,'B21-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (102,21,NULL,'AVAILABLE',NULL,'B21-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (103,21,NULL,'AVAILABLE',NULL,'B21-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (104,21,NULL,'AVAILABLE',NULL,'B21-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (105,22,NULL,'AVAILABLE',NULL,'B22-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (106,22,NULL,'AVAILABLE',NULL,'B22-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (107,22,NULL,'AVAILABLE',NULL,'B22-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (108,22,NULL,'AVAILABLE',NULL,'B22-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (109,22,NULL,'AVAILABLE',NULL,'B22-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (110,22,NULL,'AVAILABLE',NULL,'B22-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (111,23,NULL,'DAMAGED',NULL,'B23-00001');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (112,23,NULL,'SOLD',NULL,'B23-00002');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (113,23,NULL,'AVAILABLE',NULL,'B23-00003');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (114,23,NULL,'AVAILABLE',NULL,'B23-00004');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (115,23,NULL,'AVAILABLE',NULL,'B23-00005');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (116,23,NULL,'AVAILABLE',NULL,'B23-00006');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (117,23,NULL,'AVAILABLE',NULL,'B23-00007');
INSERT INTO `book_copies` (`id`, `book_id`, `barcode`, `status`, `condition_note`, `code`) VALUES (118,24,NULL,'AVAILABLE',NULL,'B24-00001');
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (1,'EBOOK','Một trang sách mỗi ngày','doc-thu-1','MỘT TRANG SÁCH MỖI NGÀY\n\nCHƯƠNG 1 — BẮT ĐẦU TỪ ĐIỀU NHỎ\n\nMột cuốn sách không cần được đọc hết trong một buổi. Chọn một khoảng thời gian yên tĩnh, đặt điện thoại sang bên và bắt đầu bằng vài trang. Điều bạn cần là sự đều đặn và sự tò mò, thay vì một mục tiêu quá lớn khiến việc đọc trở thành áp lực.\n\nHãy viết xuống một câu hỏi trước khi đọc: mình muốn hiểu điều gì? Câu hỏi ấy giúp bạn nhận ra những đoạn quan trọng. Nếu một trang khó hiểu, đọc chậm lại, thử diễn đạt bằng lời của mình và tìm một ví dụ gần gũi.\n\nCHƯƠNG 2 — ĐỌC CHỦ ĐỘNG\n\nSau một phần ngắn, dừng lại để tự kể lại nội dung vừa đọc. Không cần chép nguyên văn; một vài ý chính là đủ. Phân biệt điều tác giả mô tả với suy nghĩ của chính bạn. Nếu còn thắc mắc, ghi câu hỏi vào sổ để tìm hiểu ở phần tiếp theo.\n\nKhi đọc cùng người khác, hãy lắng nghe những cách hiểu khác nhau. Một chi tiết quen thuộc có thể gợi ra một câu chuyện mới. Chia sẻ cảm nhận lịch sự và nêu rõ điều khiến bạn đồng ý hoặc chưa đồng ý.\n\nCHƯƠNG 3 — GIỮ GÌN VÀ CHIA SẺ\n\nSách thư viện được nhiều người sử dụng. Giữ tay sạch, dùng giấy đánh dấu thay vì gấp góc và tránh đặt sách gần nước. Nếu phát hiện sách rách, thiếu trang hoặc ẩm, báo thủ thư để được ghi nhận trước khi tiếp tục sử dụng.\n\nKết thúc một lần đọc, ghi một ý bạn muốn áp dụng. Một thay đổi nhỏ có thể làm kiến thức trở nên hữu ích hơn. Trả sách đúng hạn để người đọc tiếp theo có cơ hội bắt đầu hành trình của họ.\n\nBÀI TẬP NHỎ\n\n1. Chọn một thời điểm đọc trong ngày.\n2. Viết ba ý bạn nhớ mà không nhìn lại sách.\n3. Ghi một câu hỏi mới.\n4. Chia sẻ một gợi ý đọc với bạn bè.','',1,1,1);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (2,'EBOOK','Ghi chép để nhớ lâu','doc-thu-2','GHI CHÉP ĐỂ NHỚ LÂU\n\nCHƯƠNG 1 — BẮT ĐẦU TỪ ĐIỀU NHỎ\n\nMột cuốn sách không cần được đọc hết trong một buổi. Chọn một khoảng thời gian yên tĩnh, đặt điện thoại sang bên và bắt đầu bằng vài trang. Điều bạn cần là sự đều đặn và sự tò mò, thay vì một mục tiêu quá lớn khiến việc đọc trở thành áp lực.\n\nHãy viết xuống một câu hỏi trước khi đọc: mình muốn hiểu điều gì? Câu hỏi ấy giúp bạn nhận ra những đoạn quan trọng. Nếu một trang khó hiểu, đọc chậm lại, thử diễn đạt bằng lời của mình và tìm một ví dụ gần gũi.\n\nCHƯƠNG 2 — ĐỌC CHỦ ĐỘNG\n\nSau một phần ngắn, dừng lại để tự kể lại nội dung vừa đọc. Không cần chép nguyên văn; một vài ý chính là đủ. Phân biệt điều tác giả mô tả với suy nghĩ của chính bạn. Nếu còn thắc mắc, ghi câu hỏi vào sổ để tìm hiểu ở phần tiếp theo.\n\nKhi đọc cùng người khác, hãy lắng nghe những cách hiểu khác nhau. Một chi tiết quen thuộc có thể gợi ra một câu chuyện mới. Chia sẻ cảm nhận lịch sự và nêu rõ điều khiến bạn đồng ý hoặc chưa đồng ý.\n\nCHƯƠNG 3 — GIỮ GÌN VÀ CHIA SẺ\n\nSách thư viện được nhiều người sử dụng. Giữ tay sạch, dùng giấy đánh dấu thay vì gấp góc và tránh đặt sách gần nước. Nếu phát hiện sách rách, thiếu trang hoặc ẩm, báo thủ thư để được ghi nhận trước khi tiếp tục sử dụng.\n\nKết thúc một lần đọc, ghi một ý bạn muốn áp dụng. Một thay đổi nhỏ có thể làm kiến thức trở nên hữu ích hơn. Trả sách đúng hạn để người đọc tiếp theo có cơ hội bắt đầu hành trình của họ.\n\nBÀI TẬP NHỎ\n\n1. Chọn một thời điểm đọc trong ngày.\n2. Viết ba ý bạn nhớ mà không nhìn lại sách.\n3. Ghi một câu hỏi mới.\n4. Chia sẻ một gợi ý đọc với bạn bè.','',2,1,2);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (3,'EBOOK','Khám phá thư viện cùng bạn nhỏ','doc-thu-3','KHÁM PHÁ THƯ VIỆN CÙNG BẠN NHỎ\n\nCHƯƠNG 1 — BẮT ĐẦU TỪ ĐIỀU NHỎ\n\nMột cuốn sách không cần được đọc hết trong một buổi. Chọn một khoảng thời gian yên tĩnh, đặt điện thoại sang bên và bắt đầu bằng vài trang. Điều bạn cần là sự đều đặn và sự tò mò, thay vì một mục tiêu quá lớn khiến việc đọc trở thành áp lực.\n\nHãy viết xuống một câu hỏi trước khi đọc: mình muốn hiểu điều gì? Câu hỏi ấy giúp bạn nhận ra những đoạn quan trọng. Nếu một trang khó hiểu, đọc chậm lại, thử diễn đạt bằng lời của mình và tìm một ví dụ gần gũi.\n\nCHƯƠNG 2 — ĐỌC CHỦ ĐỘNG\n\nSau một phần ngắn, dừng lại để tự kể lại nội dung vừa đọc. Không cần chép nguyên văn; một vài ý chính là đủ. Phân biệt điều tác giả mô tả với suy nghĩ của chính bạn. Nếu còn thắc mắc, ghi câu hỏi vào sổ để tìm hiểu ở phần tiếp theo.\n\nKhi đọc cùng người khác, hãy lắng nghe những cách hiểu khác nhau. Một chi tiết quen thuộc có thể gợi ra một câu chuyện mới. Chia sẻ cảm nhận lịch sự và nêu rõ điều khiến bạn đồng ý hoặc chưa đồng ý.\n\nCHƯƠNG 3 — GIỮ GÌN VÀ CHIA SẺ\n\nSách thư viện được nhiều người sử dụng. Giữ tay sạch, dùng giấy đánh dấu thay vì gấp góc và tránh đặt sách gần nước. Nếu phát hiện sách rách, thiếu trang hoặc ẩm, báo thủ thư để được ghi nhận trước khi tiếp tục sử dụng.\n\nKết thúc một lần đọc, ghi một ý bạn muốn áp dụng. Một thay đổi nhỏ có thể làm kiến thức trở nên hữu ích hơn. Trả sách đúng hạn để người đọc tiếp theo có cơ hội bắt đầu hành trình của họ.\n\nBÀI TẬP NHỎ\n\n1. Chọn một thời điểm đọc trong ngày.\n2. Viết ba ý bạn nhớ mà không nhìn lại sách.\n3. Ghi một câu hỏi mới.\n4. Chia sẻ một gợi ý đọc với bạn bè.','',3,1,3);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (4,'POST','Bắt đầu sử dụng thư viện Mộc','huong-dan-su-dung','HƯỚNG DẪN CHO BẠN ĐỌC\n\n1. Đăng ký hoặc đăng nhập tài khoản độc giả.\n2. Tìm sách ở Khám phá sách, xem số quyển còn và phí mượn.\n3. Thêm sách vào giỏ, chọn thời hạn và phương thức thanh toán.\n4. Theo dõi phiếu tại Sách đang mượn, gia hạn khi đủ điều kiện.\n5. Hoàn tất trả sách; lịch sử đã trả giúp bạn xem lại hành trình đọc.','',NULL,1,10);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (5,'POST','Năm cách giữ gìn sách mượn','giu-gin-sach','DÙNG SÁCH CẨN THẬN\n\nGiữ tay sạch và khô khi đọc.\nKhông gấp góc hoặc viết vào sách.\nDùng túi bảo vệ khi mang sách ra ngoài.\nTránh nước và ánh nắng trực tiếp.\nBáo thủ thư khi phát hiện rách, thiếu trang hay ẩm mốc.\n\nTrước khi nhận trả, thư viện kiểm tra từng mã quyển và ghi nhận tình trạng.','',NULL,1,11);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (6,'POST','Cách chọn cuốn sách tiếp theo','goi-y-chon-sach','CHỌN SÁCH THEO NHU CẦU\n\nBắt đầu với một chủ đề bạn đang tò mò. Dùng bộ lọc thể loại, tác giả và phí mượn. Tham khảo phần được đánh giá cao, đọc các cảm nhận và xem sách cùng thể loại.\n\nNếu sách tạm hết, đăng ký chờ để theo dõi; đăng ký không có nghĩa là sách đã được giữ riêng.','',NULL,1,12);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (7,'PAGE','Giới thiệu thư viện','gioi-thieu','Mộc là thư viện cho mượn, bán sách tại quầy và cung cấp nội dung đọc online.\n\nBạn đọc có thể tìm sách, lưu yêu thích, theo dõi hạn trả, đánh giá và chia sẻ cảm nhận.','',NULL,1,20);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (8,'PAGE','Hướng dẫn mượn và trả','huong-dan-muon-tra','Phí mượn tính theo số ngày đã chọn. Hệ thống lấy phí gốc 14 ngày chia cho 14, nhân với số ngày mượn và làm tròn lên đến đồng cho mỗi quyển.\n\nChọn sách còn sẵn và xác nhận tại giỏ. Phương thức thanh toán gồm trực tiếp và chuyển khoản ngân hàng. Tồn kho chỉ được cấp khi yêu cầu được xác nhận.\n\nTheo dõi hạn trả tại Sách đang mượn. Có thể trả từng quyển hoặc trả tất cả; gia hạn từ 1–7 ngày khi hệ thống cho phép.\n\nPhạt trễ theo cấu hình nghiệp vụ hiện tại: 10.000đ/quyển/ngày; hỏng 50.000đ/quyển; mất theo giá bán. Hãy liên hệ thủ thư nếu có thắc mắc.','',NULL,1,21);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (9,'PAGE','Thông tin bán sách và thanh toán','chinh-sach-thanh-toan','Bán sách tại quầy\n\nChọn sách và thanh toán tại thư viện. Bạn sẽ nhận được thông tin hóa đơn gồm sách đã mua, số lượng và tổng tiền.\n\nThanh toán phí mượn\n\nBạn có thể thanh toán trực tiếp tại thư viện hoặc chuyển khoản ngân hàng. Trạng thái giao dịch được cập nhật sau khi thanh toán. Nếu đã chuyển tiền nhưng chưa có phiếu mượn, hãy liên hệ thư viện kèm mã giao dịch để được hỗ trợ; không chuyển tiền lặp lại.','',NULL,1,22);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (10,'PAGE','Liên hệ và hỗ trợ','lien-he','Liên hệ thư viện để được hỗ trợ về tài khoản, tìm sách, mượn/trả và thanh toán.\n\nKhi liên hệ, vui lòng cung cấp mã phiếu hoặc mã giao dịch cùng nội dung cần hỗ trợ.','',NULL,1,23);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (11,'CONFIG','Tên thư viện','library-name','mộc.','',NULL,1,40);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (12,'CONFIG','Email hỗ trợ','library-email','','',NULL,0,41);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (13,'CONFIG','Điện thoại','library-phone','','',NULL,0,42);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (14,'CONFIG','Địa chỉ','library-address','','',NULL,0,43);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (15,'CONFIG','Giờ mở cửa','library-hours','','',NULL,0,44);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (16,'CONFIG','Thông báo chung','library-announcement','Chào mừng bạn đến thư viện Mộc · Khám phá sách và bắt đầu hành trình đọc.','',NULL,1,45);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (17,'MENU','Giới thiệu','menu-gioi-thieu','','/read/gioi-thieu',NULL,1,60);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (18,'MENU','Hướng dẫn mượn trả','menu-muon-tra','','/read/huong-dan-muon-tra',NULL,1,61);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (19,'MENU','Thanh toán & bán sách','menu-thanh-toan','','/read/chinh-sach-thanh-toan',NULL,1,62);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (20,'MENU','Liên hệ','menu-lien-he','','/read/lien-he',NULL,1,63);
INSERT INTO library_content (id,kind,title,slug,body,link,book_id,published,sort_order) VALUES (21,'MENU','Khám phá sách','menu-kham-pha','','/books',NULL,1,64);
-- Dong bo lai bo dem tu tung ma quyen, tranh sai lech ton kho.
UPDATE books b SET
 total_quantity=(SELECT COUNT(*) FROM book_copies c WHERE c.book_id=b.id),
 available_quantity=(SELECT COUNT(*) FROM book_copies c WHERE c.book_id=b.id AND c.status='AVAILABLE');
UPDATE books SET status=IF(available_quantity>0,'AVAILABLE','OUT_OF_STOCK');
SET FOREIGN_KEY_CHECKS=1;
