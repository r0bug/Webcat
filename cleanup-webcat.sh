#!/bin/bash

# WebCat Cleanup Script
# This script removes WebCat installation and optionally the database

set -e  # Exit on error

echo "================================================"
echo "       WebCat Cleanup Script"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if running from WebCat directory
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    print_error "This script must be run from the WebCat root directory"
    exit 1
fi

# Stop any running servers
echo "Stopping any running WebCat servers..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node.*server.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
print_status "Servers stopped"

# Remove node_modules
echo ""
read -p "Remove node_modules directories? This will free up significant disk space. (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing node_modules..."
    rm -rf backend/node_modules
    rm -rf frontend/node_modules
    print_status "node_modules removed"
fi

# Remove environment files
echo ""
read -p "Remove environment files (.env)? You'll need to reconfigure on next install. (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f backend/.env
    rm -f frontend/.env
    print_status "Environment files removed"
fi

# Remove uploaded files
echo ""
read -p "Remove uploaded files? This will delete all uploaded images. (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf backend/uploads/*
    print_status "Uploaded files removed"
fi

# Remove logs
echo ""
read -p "Remove log files? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf backend/logs/*
    rm -f backend/*.log
    rm -f frontend/*.log
    rm -f *.log
    print_status "Log files removed"
fi

# Database cleanup
echo ""
print_warning "Database cleanup requires MySQL root access"
read -p "Remove WebCat database and user? This will DELETE ALL DATA! (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Are you ABSOLUTELY SURE? Type 'DELETE' to confirm: " CONFIRM
    
    if [ "$CONFIRM" = "DELETE" ]; then
        # Try to connect to MySQL
        if sudo mysql -e "SELECT 1" >/dev/null 2>&1; then
            mysql_cmd="sudo mysql"
        else
            read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASS
            echo
            if [ -z "$MYSQL_ROOT_PASS" ]; then
                mysql_cmd="mysql -u root"
            else
                mysql_cmd="mysql -u root -p$MYSQL_ROOT_PASS"
            fi
        fi
        
        # Drop database and user
        echo "Removing database and user..."
        $mysql_cmd <<EOF 2>/dev/null || true
DROP DATABASE IF EXISTS webcat_dev;
DROP USER IF EXISTS 'webcat_dev'@'localhost';
FLUSH PRIVILEGES;
EOF
        print_status "Database and user removed"
    else
        print_warning "Database cleanup cancelled"
    fi
fi

# Remove generated files
echo ""
echo "Removing generated files..."
rm -f start.sh start-backend.sh start-frontend.sh 2>/dev/null || true
rm -rf backend/dist frontend/dist 2>/dev/null || true
print_status "Generated files removed"

# Final summary
echo ""
echo "================================================"
echo "       Cleanup Complete!"
echo "================================================"
echo ""
echo "The following items may still exist:"
echo "  - Source code files"
echo "  - Package configuration files (package.json, etc.)"
echo "  - Documentation files"
echo ""
echo "To completely remove WebCat, delete the entire WebCat directory:"
echo "  cd .. && rm -rf WebCat"
echo ""
echo "================================================"