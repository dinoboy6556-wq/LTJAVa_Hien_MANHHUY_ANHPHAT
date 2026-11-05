USE library_db;
SET NAMES utf8mb4;

-- Add the avatar storage column to existing databases without touching user data.
SET @ddl = IF(
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = DATABASE()
          AND table_name = 'users'
          AND column_name = 'avatar_data'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN avatar_data LONGTEXT NULL'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
