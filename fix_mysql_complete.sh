#!/bin/bash

echo "Complete MySQL Fix"
echo "=================="
echo

# Create socket directory
echo "Creating socket directory..."
mkdir -p /var/run/mysqld
chown mysql:mysql /var/run/mysqld

# Stop MySQL if running
echo "Stopping MySQL..."
systemctl stop mysql
pkill -f mysql

# Wait a moment
sleep 2

# Start MySQL with skip-grant-tables
echo "Starting MySQL in recovery mode..."
mysqld_safe --skip-grant-tables --skip-networking &

# Wait for MySQL to start
echo "Waiting for MySQL to start..."
sleep 5

# Reset root password
echo "Resetting root password..."
mysql -u root <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
EOF

# If that fails, try the older syntax
if [ $? -ne 0 ]; then
    echo "Trying alternative method..."
    mysql -u root <<EOF
use mysql;
UPDATE user SET authentication_string='' WHERE User='root' AND Host='localhost';
UPDATE user SET plugin='mysql_native_password' WHERE User='root' AND Host='localhost';
FLUSH PRIVILEGES;
EOF
fi

# Kill mysqld_safe
echo "Stopping recovery mode..."
pkill -f mysqld_safe
pkill -f mysqld
sleep 3

# Start MySQL normally
echo "Starting MySQL service..."
systemctl start mysql

# Test connection
echo
echo "Testing root connection..."
mysql -u root -e "SELECT 'Root access OK' as Status;"

# Create WebCat database
echo
echo "Creating WebCat database..."
mysql -u root < /home/robug/Webcat/webcat_db_setup.sql

# Test WebCat user
echo
echo "Testing WebCat user..."
mysql -u webcat_dev -pwebcat123 -e "SELECT 'WebCat user OK' as Status;" webcat_db