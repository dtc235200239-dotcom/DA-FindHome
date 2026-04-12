-- DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE houses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    area VARCHAR(100) NOT NULL,
    address VARCHAR(500) NOT NULL,
    district VARCHAR(100) NOT NULL,
    price BIGINT NOT NULL,
    area_m2 INT NOT NULL,
    rating DECIMAL(3,1) DEFAULT NULL,
    description TEXT,
    verified TINYINT(1) DEFAULT 0,
    status ENUM('active','draft','hidden') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE house_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    house_id INT NOT NULL,
    url VARCHAR(500) NOT NULL,
    is_primary TINYINT(1) DEFAULT 0,

    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE house_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    house_id INT NOT NULL,
    tag VARCHAR(100) NOT NULL,

    FOREIGN KEY (house_id) REFERENCES houses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE INDEX idx_area ON houses(area);
CREATE INDEX idx_status ON houses(status);
CREATE INDEX idx_house_id ON house_images(house_id);
CREATE INDEX idx_house_tags ON house_tags(house_id);

-- test
INSERT INTO houses (name, type, area, address, district, price, area_m2, rating)
VALUES 
('Phòng trọ giá rẻ', 'phong_tro', 'Thái Nguyên', '123 đường ABC', 'TP Thái Nguyên', 1500000, 20, 4.5),
('Căn hộ mini', 'can_ho', 'Thái Nguyên', '456 đường XYZ', 'Sông Công', 3000000, 35, 4.8);

-- thêm chức năng kiểm tra đăng nhập 
ALTER TABLE users 
ADD COLUMN role ENUM('user','admin') DEFAULT 'user';


ALTER TABLE users
    ADD COLUMN IF NOT EXISTS `status` ENUM('active','locked') NOT NULL DEFAULT 'active',
    ADD COLUMN IF NOT EXISTS `phone` VARCHAR(20) DEFAULT NULL;

-- Xác nhận cấu trúc bảng
DESCRIBE users;

-- Xác nhận cấu trúc bảng houses (cần có cột status, verified)
DESCRIBE houses;

-- Thêm phone vào bảng houses
ALTER TABLE houses ADD COLUMN phone VARCHAR(20) DEFAULT NULL;

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    house_id INT NULL,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    is_read TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_chat (sender_id, receiver_id, house_id, id),
    INDEX idx_unread (receiver_id, sender_id, is_read, house_id)
);