-- Run once after upgrade_vnpay_cart_20261029.sql; back up first.
USE library_db;
ALTER TABLE borrow_payments
 ADD COLUMN method VARCHAR(20) NOT NULL DEFAULT 'VNPAY',
 ADD COLUMN confirmed_by VARCHAR(255) NULL,
 ADD COLUMN confirmed_at DATETIME(6) NULL;
