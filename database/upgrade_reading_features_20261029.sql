-- Run against library_db after a backup, with all backend processes stopped.
-- Additive and safe to run again. MySQL / Laragon.
USE library_db;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='loan_items' AND column_name='returned_at')=0,
 'ALTER TABLE loan_items ADD COLUMN returned_at DATE NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='loan_items' AND column_name='return_condition')=0,
 'ALTER TABLE loan_items ADD COLUMN return_condition VARCHAR(30) NULL', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
-- Completed historical loans: date is known, condition is not inferred.
UPDATE loan_items i JOIN loans l ON l.id=i.loan_id
SET i.returned_at=l.return_date
WHERE l.status='RETURNED' AND i.returned_at IS NULL AND l.return_date IS NOT NULL;
CREATE TABLE IF NOT EXISTS reservations (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 user_id BIGINT NOT NULL,
 book_id BIGINT NOT NULL,
 created_at DATETIME(6) NOT NULL,
 CONSTRAINT uk_reservation_user_book UNIQUE (user_id,book_id),
 CONSTRAINT fk_reservation_user FOREIGN KEY (user_id) REFERENCES users(id),
 CONSTRAINT fk_reservation_book FOREIGN KEY (book_id) REFERENCES books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS copy_events (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 copy_id BIGINT NOT NULL,
 action VARCHAR(255) NOT NULL,
 previous_status VARCHAR(255) NULL,
 new_status VARCHAR(255) NOT NULL,
 actor VARCHAR(255) NOT NULL,
 created_at DATETIME(6) NOT NULL,
 INDEX idx_copy_events_copy (copy_id,id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
