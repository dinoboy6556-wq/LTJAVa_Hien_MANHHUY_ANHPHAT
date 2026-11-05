-- Back up library_db first. Stop backend before applying. Additive migration.
USE library_db;
CREATE TABLE IF NOT EXISTS borrow_payments (
 id VARCHAR(32) NOT NULL PRIMARY KEY,
 user_id BIGINT NOT NULL,
 request_key VARCHAR(64) NOT NULL,
 amount DECIMAL(19,2) NOT NULL,
 status VARCHAR(30) NOT NULL,
 request_json TEXT NOT NULL,
 created_at DATETIME(6) NOT NULL,
 expires_at DATETIME(6) NOT NULL,
 loan_id BIGINT NULL,
 transaction_no VARCHAR(255) NULL,
 message VARCHAR(1000) NULL,
 CONSTRAINT uk_borrow_payment_request UNIQUE(user_id,request_key),
 CONSTRAINT fk_borrow_payment_user FOREIGN KEY(user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
