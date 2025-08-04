#!/bin/bash

# WebCat Installation Script
# This script checks for and installs all dependencies needed to run WebCat

set -e  # Exit on error

echo "================================================"
echo "       WebCat Installation Script"
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

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check version
check_version() {
    local cmd=$1
    local min_version=$2
    local current_version=$3
    
    if [ "$(printf '%s\n' "$min_version" "$current_version" | sort -V | head -n1)" = "$min_version" ]; then
        return 0
    else
        return 1
    fi
}

# Check OS
echo "Checking system requirements..."
OS=$(uname -s)
if [[ "$OS" != "Linux" && "$OS" != "Darwin" ]]; then
    print_error "This installer only supports Linux and macOS"
    exit 1
fi
print_status "Operating System: $OS"

# Check for Node.js
echo ""
echo "Checking Node.js..."
if command_exists node; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if check_version "18.0.0" "$NODE_VERSION" "$NODE_VERSION"; then
        print_status "Node.js v$NODE_VERSION found"
    else
        print_error "Node.js version $NODE_VERSION is too old. Please install Node.js 18 or higher"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    echo "Please install Node.js 18 or higher from https://nodejs.org/"
    exit 1
fi

# Check for npm
echo ""
echo "Checking npm..."
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_status "npm v$NPM_VERSION found"
else
    print_error "npm is not installed"
    exit 1
fi

# Check for MySQL
echo ""
echo "Checking MySQL..."
if command_exists mysql; then
    MYSQL_VERSION=$(mysql --version | awk '{print $5}' | awk -F',' '{print $1}')
    print_status "MySQL $MYSQL_VERSION found"
else
    print_warning "MySQL is not installed"
    read -p "Would you like to install MySQL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OS" == "Linux" ]]; then
            # Check if running on Ubuntu/Debian
            if command_exists apt-get; then
                print_status "Installing MySQL..."
                sudo apt-get update
                sudo apt-get install -y mysql-server
            else
                print_error "Automatic MySQL installation is only supported on Ubuntu/Debian"
                echo "Please install MySQL manually"
                exit 1
            fi
        elif [[ "$OS" == "Darwin" ]]; then
            if command_exists brew; then
                print_status "Installing MySQL using Homebrew..."
                brew install mysql
                brew services start mysql
            else
                print_error "Please install Homebrew first: https://brew.sh/"
                exit 1
            fi
        fi
    else
        print_error "MySQL is required. Please install it manually"
        exit 1
    fi
fi

# Setup MySQL database
echo ""
echo "Setting up MySQL database..."

# First try to connect without password (for auth_socket)
if sudo mysql -e "SELECT 1" >/dev/null 2>&1; then
    print_status "Connected to MySQL using sudo (auth_socket)"
    mysql_cmd="sudo mysql"
    USE_SUDO=true
else
    # If sudo doesn't work, ask for password
    read -p "Enter MySQL root password: " -s MYSQL_ROOT_PASS
    echo
    
    if [ -z "$MYSQL_ROOT_PASS" ]; then
        # Try without password
        if mysql -u root -e "SELECT 1" >/dev/null 2>&1; then
            mysql_cmd="mysql -u root"
        else
            print_error "Cannot connect to MySQL. On Ubuntu/Debian, try using: sudo ./install-webcat.sh"
            print_error "Or set a root password with: sudo mysql -e \"ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'yourpassword';\""
            exit 1
        fi
    else
        # Try with password
        if mysql -u root -p"$MYSQL_ROOT_PASS" -e "SELECT 1" >/dev/null 2>&1; then
            mysql_cmd="mysql -u root -p$MYSQL_ROOT_PASS"
        else
            print_error "Cannot connect to MySQL. Please check your root password"
            exit 1
        fi
    fi
fi

print_status "Creating database and user..."
$mysql_cmd <<EOF
CREATE DATABASE IF NOT EXISTS webcat_dev;
-- Drop user if exists to avoid conflicts
DROP USER IF EXISTS 'webcat_dev'@'localhost';
-- Create user with mysql_native_password for compatibility
CREATE USER 'webcat_dev'@'localhost' IDENTIFIED WITH mysql_native_password BY 'webcat123';
GRANT ALL PRIVILEGES ON webcat_dev.* TO 'webcat_dev'@'localhost';
FLUSH PRIVILEGES;
EOF

print_status "MySQL database setup complete"

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install
print_status "Backend dependencies installed"

# Setup backend environment
if [ ! -f .env ]; then
    print_status "Creating backend .env file..."
    cat > .env << EOF
# Environment
NODE_ENV=development

# Server
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=webcat_dev
DB_USER=webcat_dev
DB_PASSWORD=webcat123

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Email (optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=noreply@webcat.com
EOF
    print_status "Backend .env file created"
else
    print_warning "Backend .env file already exists, skipping..."
fi

# Run database migrations
echo ""
echo "Running database migrations..."
npm run db:migrate
print_status "Database migrations complete"

# Seed database with sample data
echo ""
read -p "Would you like to seed the database with sample data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    print_status "Database seeded with sample data"
fi

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd ../frontend
npm install
print_status "Frontend dependencies installed"

# Setup frontend environment
if [ ! -f .env ]; then
    print_status "Creating frontend .env file..."
    cat > .env << EOF
VITE_API_URL=http://localhost:3001/api
VITE_APP_NAME=WebCat
EOF
    print_status "Frontend .env file created"
else
    print_warning "Frontend .env file already exists, skipping..."
fi

# Create required directories
echo ""
echo "Creating required directories..."
cd ..
mkdir -p backend/uploads/items
mkdir -p backend/uploads/avatars
mkdir -p backend/logs
print_status "Directories created"

# Create start scripts
echo ""
echo "Creating start scripts..."

# Create start script for backend
cat > start-backend.sh << 'EOF'
#!/bin/bash
cd backend
npm run dev
EOF
chmod +x start-backend.sh

# Create start script for frontend
cat > start-frontend.sh << 'EOF'
#!/bin/bash
cd frontend
npm run dev
EOF
chmod +x start-frontend.sh

# Create combined start script
cat > start.sh << 'EOF'
#!/bin/bash
echo "Starting WebCat..."
echo ""
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

echo "Starting frontend server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo "WebCat is running!"
echo "================================================"
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3001/api"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Function to kill both processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
EOF
chmod +x start.sh

print_status "Start scripts created"

# Installation complete
echo ""
echo "================================================"
echo "       Installation Complete!"
echo "================================================"
echo ""
echo "Sample Login Credentials:"
echo "  Admin:    admin@webcat.com / admin123"
echo "  Staff:    staff@webcat.com / staff123"
echo "  Vendor:   john@vendor.com / vendor123"
echo ""
echo "To start WebCat:"
echo "  ./start.sh"
echo ""
echo "Or start servers individually:"
echo "  ./start-backend.sh   (Backend on port 3001)"
echo "  ./start-frontend.sh  (Frontend on port 5173)"
echo ""
echo "================================================"