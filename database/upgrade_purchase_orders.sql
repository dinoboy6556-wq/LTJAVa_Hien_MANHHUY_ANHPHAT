CREATE TABLE IF NOT EXISTS purchase_orders (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(19,2) NOT NULL,
    request_key VARCHAR(36) NOT NULL,
    status ENUM('PENDING','PAID','CANCELLED') NOT NULL,
    created_at DATETIME(6) NOT NULL,
    sale_id BIGINT NULL,
    CONSTRAINT uq_purchase_request UNIQUE (user_id, request_key),
    CONSTRAINT uq_purchase_sale UNIQUE (sale_id),
    CONSTRAINT fk_purchase_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_purchase_book FOREIGN KEY (book_id) REFERENCES books(id),
    CONSTRAINT fk_purchase_sale FOREIGN KEY (sale_id) REFERENCES sales(id)
);
