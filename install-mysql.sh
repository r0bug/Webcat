#!/bin/bash

# MySQL Installation Script for WebCat
# Supports Ubuntu/Debian and macOS

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

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            OS=$NAME
            VER=$VERSION_ID
            if [[ "$ID" == "ubuntu" ]] || [[ "$ID" == "debian" ]]; then
                DISTRO="ubuntu"
            elif [[ "$ID" == "centos" ]] || [[ "$ID" == "rhel" ]] || [[ "$ID" == "fedora" ]]; then
                DISTRO="redhat"
            else
                DISTRO="unknown"
            fi
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        DISTRO="macos"
    else
        OS="Unknown"
        DISTRO="unknown"
    fi
}

# Install MySQL on Ubuntu/Debian
install_mysql_ubuntu() {
    print_header "Installing MySQL on Ubuntu/Debian"
    
    # Update package index
    print_info "Updating package index..."
    sudo apt-get update
    
    # Install MySQL Server
    print_info "Installing MySQL Server..."
    sudo apt-get install -y mysql-server
    
    # Start MySQL service
    print_info "Starting MySQL service..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
    
    print_status "MySQL installed successfully!"
}

# Install MySQL on macOS
install_mysql_macos() {
    print_header "Installing MySQL on macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
        print_error "Homebrew is not installed. Please install Homebrew first:"
        echo "Visit: https://brew.sh"
        exit 1
    fi
    
    # Install MySQL
    print_info "Installing MySQL via Homebrew..."
    brew install mysql
    
    # Start MySQL service
    print_info "Starting MySQL service..."
    brew services start mysql
    
    print_status "MySQL installed successfully!"
}

# Secure MySQL installation
secure_mysql() {
    print_header "Securing MySQL Installation"
    
    print_info "Running MySQL secure installation..."
    print_warning "You'll be prompted to:"
    echo "  1. Set a root password (if not already set)"
    echo "  2. Remove anonymous users"
    echo "  3. Disallow root login remotely"
    echo "  4. Remove test database"
    echo "  5. Reload privilege tables"
    echo
    
    read -p "Do you want to run mysql_secure_installation now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo mysql_secure_installation
    else
        print_warning "Skipping secure installation. Run 'sudo mysql_secure_installation' later."
    fi
}

# Create WebCat database and user
setup_webcat_db() {
    print_header "Setting up WebCat Database"
    
    print_info "Creating WebCat database and user..."
    
    # Generate a random password
    DB_PASSWORD=$(openssl rand -base64 12)
    
    # Create database setup script
    cat > /tmp/webcat_db_setup.sql << EOF
-- Create database
CREATE DATABASE IF NOT EXISTS webcat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user with password
CREATE USER IF NOT EXISTS 'webcat_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON webcat_db.* TO 'webcat_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
EOF

    # Execute the script
    print_info "Please enter your MySQL root password:"
    mysql -u root -p < /tmp/webcat_db_setup.sql
    
    # Clean up
    rm /tmp/webcat_db_setup.sql
    
    print_status "Database created successfully!"
    
    # Save credentials
    echo -e "\n${GREEN}Database Credentials:${NC}"
    echo "Database Name: webcat_db"
    echo "Database User: webcat_user"
    echo "Database Password: $DB_PASSWORD"
    echo
    echo "These credentials have been saved to: mysql_credentials.txt"
    
    cat > mysql_credentials.txt << EOF
MySQL Credentials for WebCat
============================
Database Name: webcat_db
Database User: webcat_user
Database Password: $DB_PASSWORD
Host: localhost
Port: 3306

Add these to your backend/.env file:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=webcat_db
DB_USER=webcat_user
DB_PASSWORD=$DB_PASSWORD
EOF
    
    chmod 600 mysql_credentials.txt
}

# Verify MySQL installation
verify_mysql() {
    print_header "Verifying MySQL Installation"
    
    if command -v mysql &> /dev/null; then
        MYSQL_VERSION=$(mysql --version | awk '{print $3}' | cut -d',' -f1)
        print_status "MySQL $MYSQL_VERSION is installed"
        
        # Check if service is running
        if [[ "$DISTRO" == "ubuntu" ]]; then
            if sudo systemctl is-active --quiet mysql; then
                print_status "MySQL service is running"
            else
                print_warning "MySQL service is not running"
                print_info "Starting MySQL service..."
                sudo systemctl start mysql
            fi
        elif [[ "$DISTRO" == "macos" ]]; then
            if brew services list | grep mysql | grep started &> /dev/null; then
                print_status "MySQL service is running"
            else
                print_warning "MySQL service is not running"
                print_info "Starting MySQL service..."
                brew services start mysql
            fi
        fi
        
        return 0
    else
        print_error "MySQL is not installed"
        return 1
    fi
}

# Main installation function
main() {
    print_header "MySQL Installation for WebCat"
    
    # Detect OS
    detect_os
    print_info "Detected OS: $OS ($DISTRO)"
    
    # Check if MySQL is already installed
    if verify_mysql; then
        print_info "MySQL is already installed"
        read -p "Do you want to create the WebCat database? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            setup_webcat_db
        fi
        exit 0
    fi
    
    # Install MySQL based on OS
    case $DISTRO in
        ubuntu)
            install_mysql_ubuntu
            ;;
        macos)
            install_mysql_macos
            ;;
        *)
            print_error "Unsupported operating system: $OS"
            print_info "Please install MySQL manually for your system"
            echo
            echo "For other Linux distributions:"
            echo "  - CentOS/RHEL: sudo yum install mysql-server"
            echo "  - Fedora: sudo dnf install mysql-server"
            echo "  - Arch: sudo pacman -S mysql"
            echo
            echo "For Windows:"
            echo "  - Download MySQL installer from https://dev.mysql.com/downloads/installer/"
            exit 1
            ;;
    esac
    
    # Secure installation
    secure_mysql
    
    # Create WebCat database
    read -p "Do you want to create the WebCat database now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_webcat_db
    fi
    
    # Update .env file if it exists
    if [ -f "backend/.env" ]; then
        print_info "Updating backend/.env with database credentials..."
        if [ -f "mysql_credentials.txt" ]; then
            print_warning "Please manually update backend/.env with the credentials from mysql_credentials.txt"
        fi
    fi
    
    print_header "Installation Complete!"
    print_status "MySQL has been installed and configured for WebCat"
    print_info "Next steps:"
    echo "1. Update backend/.env with the database credentials"
    echo "2. Run: cd backend && npm run db:migrate"
    echo "3. Run: cd backend && npm run db:seed (optional)"
    echo "4. Start WebCat: ./start.sh"
}

# Run main function
main