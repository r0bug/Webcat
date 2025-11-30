#!/bin/bash

echo "MySQL Root Password Reset"
echo "========================"
echo
echo "Choose your method:"
echo
echo "METHOD 1: Using sudo (Ubuntu/Debian)"
echo "Run these commands:"
echo
echo "sudo mysql"
echo "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_new_password';"
echo "FLUSH PRIVILEGES;"
echo "exit;"
echo
echo "-----------------------------------"
echo
echo "METHOD 2: Skip Grant Tables (if sudo doesn't work)"
echo "Run these commands:"
echo
echo "# Step 1: Stop MySQL"
echo "sudo systemctl stop mysql"
echo
echo "# Step 2: Start MySQL without password"
echo "sudo mysqld_safe --skip-grant-tables &"
echo
echo "# Step 3: Connect to MySQL"
echo "mysql -u root"
echo
echo "# Step 4: In MySQL, run:"
echo "FLUSH PRIVILEGES;"
echo "ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_new_password';"
echo "FLUSH PRIVILEGES;"
echo "exit;"
echo
echo "# Step 5: Stop and restart MySQL normally"
echo "sudo killall mysqld"
echo "sudo systemctl start mysql"
echo
echo "-----------------------------------"
echo
echo "METHOD 3: Set empty password (for development only)"
echo "If you're already logged in as root in MySQL:"
echo
echo "ALTER USER 'root'@'localhost' IDENTIFIED BY '';"
echo "FLUSH PRIVILEGES;"