CREATE TABLE presentations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(80) NOT NULL,
    company VARCHAR(50) NOT NULL,
    creator VARCHAR(50) NOT NULL,
    content VARCHAR(500) NOT NULL,
    createdAt DATE NOT NULL, 
    updatedAt DATE NOT NULL, 
    thumbnailUrl VARCHAR(500) NOT NULL
);

INSERT INTO presentations (id, title, company, creator, content, createdAt, updatedAt, thumbnailUrl) VALUES
(1, 'Space X', 'Space X', 'Yuta', 'Space Xのプレゼン資料', '2025-07-02', '2025-07-02', ''); 