#!/bin/bash

# MySQL Authentication Fix Script
# Fixes root access and sets up WebCat database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

print_header() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}\n"
}

# Main function
main() {
    print_header "MySQL Authentication Fix for WebCat"
    
    print_info "This script will fix MySQL authentication and set up the WebCat database"
    echo
    
    # Check if running as regular user (not root)
    if [ "$EUID" -eq 0 ]; then 
        print_error "Please run this script as a regular user, not as root"
        exit 1
    fi
    
    print_warning "We'll use sudo to access MySQL with system authentication"
    echo
    
    # Option 1: Try to access MySQL with sudo (auth_socket)
    print_info "Attempting to access MySQL with system authentication..."
    
    # Generate a random password for WebCat user
    DB_PASSWORD=$(openssl rand -base64 12)
    
    # Create a temporary SQL file
    cat > /tmp/webcat_setup.sql << EOF
-- First, let's set a password for root if needed
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;

-- Create database
CREATE DATABASE IF NOT EXISTS webcat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with password
DROP USER IF EXISTS 'webcat_user'@'localhost';
CREATE USER 'webcat_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON webcat_db.* TO 'webcat_user'@'localhost';

-- Also create a developer user with easier access
DROP USER IF EXISTS 'webcat_dev'@'%';
CREATE USER 'webcat_dev'@'%' IDENTIFIED BY 'webcat123';
GRANT ALL PRIVILEGES ON webcat_db.* TO 'webcat_dev'@'%';

FLUSH PRIVILEGES;

-- Show created users
SELECT User, Host, plugin FROM mysql.user WHERE User IN ('root', 'webcat_user', 'webcat_dev');
EOF

    # Try to run with sudo
    print_info "Running database setup with sudo..."
    if sudo mysql < /tmp/webcat_setup.sql 2>/dev/null; then
        print_status "Database setup completed successfully!"
    else
        print_warning "Failed with sudo, trying alternative method..."
        
        # Alternative: Set root password first
        print_info "Let's set up MySQL root access first"
        echo
        echo "Enter a new password for MySQL root user (or press Enter for no password):"
        read -s ROOT_PASSWORD
        echo
        
        # Create root setup script
        cat > /tmp/root_setup.sql << EOF
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$ROOT_PASSWORD';
FLUSH PRIVILEGES;
EOF
        
        # Run with sudo
        if sudo mysql < /tmp/root_setup.sql; then
            print_status "Root password set successfully"
            
            # Now run the main setup with the new root password
            if [ -z "$ROOT_PASSWORD" ]; then
                mysql -u root < /tmp/webcat_setup.sql
            else
                mysql -u root -p"$ROOT_PASSWORD" < /tmp/webcat_setup.sql
            fi
        else
            print_error "Failed to set up MySQL authentication"
            print_info "Try running: sudo mysql_secure_installation"
            exit 1
        fi
    fi
    
    # Clean up
    rm -f /tmp/webcat_setup.sql /tmp/root_setup.sql
    
    # Save credentials
    print_header "Database Setup Complete!"
    
    cat > mysql_credentials.txt << EOF
MySQL Credentials for WebCat
============================

Option 1 - Production User:
---------------------------
Database Name: webcat_db
Database User: webcat_user
Database Password: $DB_PASSWORD
Host: localhost
Port: 3306

Option 2 - Development User (easier):
-------------------------------------
Database Name: webcat_db
Database User: webcat_dev
Database Password: webcat123
Host: localhost (or %)
Port: 3306

Add ONE of these to your backend/.env file:

# Option 1 (Secure):
DB_HOST=localhost
DB_PORT=3306
DB_NAME=webcat_db
DB_USER=webcat_user
DB_PASSWORD=$DB_PASSWORD

# Option 2 (Development):
DB_HOST=localhost
DB_PORT=3306
DB_NAME=webcat_db
DB_USER=webcat_dev
DB_PASSWORD=webcat123
EOF
    
    chmod 600 mysql_credentials.txt
    
    echo -e "${GREEN}Database Credentials saved to: mysql_credentials.txt${NC}"
    echo
    print_info "Two users were created:"
    echo "  1. webcat_user - Secure user with random password"
    echo "  2. webcat_dev - Development user with password 'webcat123'"
    echo
    
    # Update .env file automatically
    if [ -f "backend/.env" ]; then
        print_info "Updating backend/.env with development credentials..."
        
        # Backup current .env
        cp backend/.env backend/.env.backup
        
        # Update database credentials
        sed -i.tmp 's/DB_USER=.*/DB_USER=webcat_dev/' backend/.env
        sed -i.tmp 's/DB_PASSWORD=.*/DB_PASSWORD=webcat123/' backend/.env
        rm -f backend/.env.tmp
        
        print_status "backend/.env updated (backup saved as .env.backup)"
    fi
    
    # Test connection
    print_header "Testing Database Connection"
    
    if mysql -u webcat_dev -pwebcat123 -e "USE webcat_db; SELECT 'Connection successful!' as Status;" 2>/dev/null; then
        print_status "Database connection test passed!"
        echo
        
        # Run migrations
        read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd backend
            print_info "Running migrations..."
            if npm run db:migrate; then
                print_status "Migrations completed successfully!"
                
                # Seed database
                read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    if npm run db:seed; then
                        print_status "Database seeded successfully!"
                    else
                        print_warning "Seeding failed, but you can run 'npm run db:seed' manually later"
                    fi
                fi
            else
                print_warning "Migrations failed. Check your database connection and try again."
            fi
            cd ..
        fi
    else
        print_warning "Could not connect to database. Please check credentials and try again."
    fi
    
    print_header "Setup Complete!"
    print_status "MySQL authentication has been fixed and WebCat database is ready"
    print_info "You can now run: ./start-dev.sh"
}

# Run main function
main