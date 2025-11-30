#!/bin/bash

echo "Resetting MySQL root password..."
echo

# Stop MySQL
echo "Stopping MySQL service..."
systemctl stop mysql

# Start MySQL without grant tables
echo "Starting MySQL in safe mode..."
mysqld_safe --skip-grant-tables --skip-networking &

# Wait a moment for MySQL to start
sleep 3

# Connect and reset password
echo "Resetting password..."
mysql <<EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
EOF

# Kill MySQL safe mode
echo "Stopping MySQL safe mode..."
killall mysqld
sleep 2

# Start MySQL normally
echo "Starting MySQL normally..."
systemctl start mysql

echo
echo "Done! Now trying to create WebCat database..."
mysql -u root < /home/robug/Webcat/webcat_db_setup.sql

echo
echo "Testing connection..."
mysql -u webcat_dev -pwebcat123 -e "SELECT 'Success!' as Status;" webcat_db