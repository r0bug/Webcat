-- WebCat Database Setup
CREATE DATABASE IF NOT EXISTS webcat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'webcat_dev'@'localhost';
CREATE USER 'webcat_dev'@'localhost' IDENTIFIED BY 'webcat123';
GRANT ALL PRIVILEGES ON webcat_db.* TO 'webcat_dev'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Database setup complete!' as Status;