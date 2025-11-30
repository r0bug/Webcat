#!/bin/bash

# WebCat MySQL Setup Script
# This script attempts to set up MySQL database for WebCat

echo "WebCat MySQL Database Setup"
echo "=========================="
echo

# SQL commands to create database and user
SQL_COMMANDS="
-- Create database
CREATE DATABASE IF NOT EXISTS webcat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (drop first to avoid conflicts)
DROP USER IF EXISTS 'webcat_dev'@'localhost';
CREATE USER 'webcat_dev'@'localhost' IDENTIFIED BY 'webcat123';

-- Grant privileges
GRANT ALL PRIVILEGES ON webcat_db.* TO 'webcat_dev'@'localhost';
FLUSH PRIVILEGES;

-- Show results
SELECT 'Database webcat_db created successfully!' as Result;
"

echo "This script will attempt to create:"
echo "  - Database: webcat_db"
echo "  - User: webcat_dev@localhost"
echo "  - Password: webcat123"
echo

# Method 1: Try without password
echo "Attempting method 1: MySQL without password..."
if mysql -u root <<EOF 2>/dev/null
$SQL_COMMANDS
EOF
then
    echo "✓ Success! Database created."
    exit 0
fi

# Method 2: Try with empty password
echo "Attempting method 2: MySQL with empty password..."
if mysql -u root -p'' <<EOF 2>/dev/null
$SQL_COMMANDS
EOF
then
    echo "✓ Success! Database created."
    exit 0
fi

# Method 3: Request password
echo "Attempting method 3: MySQL with password prompt..."
echo "Please enter the MySQL root password:"
mysql -u root -p <<EOF
$SQL_COMMANDS
EOF

if [ $? -eq 0 ]; then
    echo "✓ Success! Database created."
else
    echo
    echo "If the above methods failed, please run these commands manually:"
    echo
    echo "1. Access MySQL as root:"
    echo "   sudo mysql"
    echo "   OR"
    echo "   mysql -u root -p"
    echo
    echo "2. Run these SQL commands:"
    echo "$SQL_COMMANDS"
fi