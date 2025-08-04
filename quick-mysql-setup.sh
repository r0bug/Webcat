#!/bin/bash

# Quick MySQL Setup for WebCat
# This script uses mysql without password first, then with password if needed

echo "Quick MySQL Setup for WebCat"
echo "============================"
echo

# Try to connect without password first
echo "Attempting to connect to MySQL..."

# Create SQL commands
SQL_COMMANDS="
-- Create database
CREATE DATABASE IF NOT EXISTS webcat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create or update user
DROP USER IF EXISTS 'webcat_dev'@'localhost';
CREATE USER 'webcat_dev'@'localhost' IDENTIFIED BY 'webcat123';

-- Grant all privileges
GRANT ALL PRIVILEGES ON webcat_db.* TO 'webcat_dev'@'localhost';
GRANT CREATE, ALTER, DROP, DELETE, INDEX, INSERT, SELECT, UPDATE, REFERENCES ON webcat_db.* TO 'webcat_dev'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Show result
SELECT 'Database webcat_db created!' as Status;
SELECT User, Host FROM mysql.user WHERE User = 'webcat_dev';
"

# Try different connection methods
echo "Method 1: Trying without password..."
if mysql -u root <<< "$SQL_COMMANDS" 2>/dev/null; then
    echo "✓ Success! Database created without password"
else
    echo "Method 2: Trying with password prompt..."
    echo "Enter MySQL root password (or press Enter if none):"
    if mysql -u root -p <<< "$SQL_COMMANDS"; then
        echo "✓ Success! Database created with password"
    else
        echo "Method 3: Trying with sudo..."
        if echo "$SQL_COMMANDS" | sudo mysql 2>/dev/null; then
            echo "✓ Success! Database created with sudo"
        else
            echo "❌ Failed to connect to MySQL"
            echo
            echo "Please try one of these commands manually:"
            echo "1. sudo mysql"
            echo "2. mysql -u root -p"
            echo "3. mysql -u root"
            echo
            echo "Then run these SQL commands:"
            echo "$SQL_COMMANDS"
            exit 1
        fi
    fi
fi

echo
echo "Testing connection with webcat_dev user..."
if mysql -u webcat_dev -pwebcat123 -D webcat_db -e "SELECT 'Connection successful!' as Status;" 2>/dev/null; then
    echo "✓ Database connection test passed!"
    echo
    echo "Database is ready! Your credentials:"
    echo "  Database: webcat_db"
    echo "  User: webcat_dev"
    echo "  Password: webcat123"
    echo "  Host: localhost"
    echo
    echo "These match your backend/.env file."
    echo "You can now run: ./start-dev.sh"
else
    echo "❌ Connection test failed"
    echo "Check if the user was created properly"
fi