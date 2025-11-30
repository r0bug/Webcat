#!/bin/bash

echo "Using Debian system maintenance user..."
echo

# Get debian-sys-maint credentials
DEBIAN_USER=$(grep user /etc/mysql/debian.cnf | head -1 | cut -d'=' -f2 | tr -d ' ')
DEBIAN_PASS=$(grep password /etc/mysql/debian.cnf | head -1 | cut -d'=' -f2 | tr -d ' ')

echo "Found Debian MySQL user: $DEBIAN_USER"
echo

# Create database using debian-sys-maint
echo "Creating WebCat database..."
mysql -u "$DEBIAN_USER" -p"$DEBIAN_PASS" < /home/robug/Webcat/webcat_db_setup.sql

# Also try to fix root access
echo
echo "Fixing root access..."
mysql -u "$DEBIAN_USER" -p"$DEBIAN_PASS" <<EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
EOF

# Test connections
echo
echo "Testing root access..."
mysql -u root -e "SELECT 'Root access restored!' as Status;"

echo
echo "Testing WebCat user..."
mysql -u webcat_dev -pwebcat123 -e "SELECT 'WebCat ready!' as Status;" webcat_db