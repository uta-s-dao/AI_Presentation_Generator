CREATE TABLE presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(100) NOT NULL,
    title VARCHAR(80) NOT NULL,
    company VARCHAR(50) NOT NULL,
    creator VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    createdAt DATE NOT NULL, 
    updatedAt DATE NOT NULL, 
    thumbnailUrl VARCHAR(500) NOT NULL
);

INSERT INTO presentations (id, unique_id, title, company, creator, content, createdAt, updatedAt, thumbnailUrl) VALUES
(1, 'asferg3rgear-asdfasd-','Space X', 'Space X', 'Yuta', 'Space Xのプレゼン資料', '2025-07-02', '2025-07-02', ''); 