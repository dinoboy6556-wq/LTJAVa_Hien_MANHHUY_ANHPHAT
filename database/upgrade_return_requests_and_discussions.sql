USE library_db;

SET @add_request_column = IF(
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='loan_items' AND column_name='return_requested_at'),
  'SELECT 1',
  'ALTER TABLE loan_items ADD COLUMN return_requested_at DATETIME(6) NULL'
);
PREPARE migration_statement FROM @add_request_column;
EXECUTE migration_statement;
DEALLOCATE PREPARE migration_statement;

CREATE TABLE IF NOT EXISTS book_readings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  book_id BIGINT NOT NULL,
  read_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_book_reading_user_book (user_id, book_id),
  CONSTRAINT fk_book_reading_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_book_reading_book FOREIGN KEY (book_id) REFERENCES books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS book_questions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  book_id BIGINT NOT NULL,
  question VARCHAR(1200) NOT NULL,
  answer VARCHAR(1200) NULL,
  created_at DATETIME(6) NOT NULL,
  answered_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_book_questions_book (book_id),
  CONSTRAINT fk_book_question_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_book_question_book FOREIGN KEY (book_id) REFERENCES books(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
