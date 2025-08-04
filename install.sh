#!/bin/bash

# WebCat Installation Script
# This script sets up the entire WebCat project including backend and frontend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
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

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main installation function
main() {
    print_header "WebCat Installation Script"
    
    # Check Node.js
    print_status "Checking system requirements..."
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16+ required. Current version: $(node -v)"
        exit 1
    fi
    print_status "Node.js $(node -v) detected"
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm $(npm -v) detected"
    
    # Check MySQL (optional)
    if command_exists mysql; then
        print_status "MySQL detected"
        MYSQL_AVAILABLE=true
    else
        print_warning "MySQL not detected. You'll need to install it before running the application."
        MYSQL_AVAILABLE=false
    fi
    
    # Backend Setup
    print_header "Setting up Backend"
    
    if [ -d "backend" ]; then
        cd backend
        
        # Install dependencies
        print_status "Installing backend dependencies..."
        npm install
        
        # Setup environment file
        if [ ! -f ".env" ]; then
            print_status "Creating .env file from template..."
            cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=webcat_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=WebCat <noreply@webcat.com>

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
            print_warning "Please edit backend/.env with your database credentials"
        else
            print_status ".env file already exists"
        fi
        
        # Create uploads directory if it doesn't exist
        if [ ! -d "uploads" ]; then
            mkdir -p uploads/items
            touch uploads/.gitkeep
            print_status "Created uploads directory"
        fi
        
        # Build TypeScript
        print_status "Building TypeScript..."
        npm run build
        
        cd ..
    else
        print_error "Backend directory not found!"
        exit 1
    fi
    
    # Frontend Setup
    print_header "Setting up Frontend"
    
    if [ -d "frontend" ]; then
        cd frontend
        
        print_status "Installing frontend dependencies..."
        npm install
        
        # Setup environment file
        if [ ! -f ".env" ]; then
            print_status "Creating frontend .env file..."
            cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:3001/api
EOF
            print_status "Created frontend .env file"
        else
            print_status "Frontend .env file already exists"
        fi
        
        print_status "Building frontend..."
        npm run build
        
        cd ..
    else
        print_error "Frontend directory not found!"
        exit 1
    fi
    
    # Database Setup
    if [ "$MYSQL_AVAILABLE" = true ]; then
        print_header "Database Setup"
        
        read -p "Do you want to create the database now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_info "Creating database..."
            read -p "Enter MySQL root password: " -s MYSQL_PWD
            echo
            export MYSQL_PWD
            
            mysql -u root -e "CREATE DATABASE IF NOT EXISTS webcat_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
                print_error "Failed to create database. Please check your MySQL credentials."
                unset MYSQL_PWD
                exit 1
            }
            
            unset MYSQL_PWD
            print_status "Database 'webcat_db' created successfully"
            
            # Run migrations
            cd backend
            print_status "Running database migrations..."
            npm run db:migrate || {
                print_error "Failed to run migrations. Please check your database configuration in backend/.env"
                cd ..
                exit 1
            }
            
            # Run seeders
            read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Seeding database..."
                npm run db:seed || {
                    print_warning "Failed to seed database. You can run 'npm run db:seed' manually later."
                }
            fi
            
            cd ..
        fi
    fi
    
    # Create startup scripts
    print_header "Creating Startup Scripts"
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash

# WebCat Startup Script

echo "Starting WebCat services..."

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "Error: backend/.env not found. Please run install.sh first."
    exit 1
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "Error: Dependencies not installed. Please run install.sh first."
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\nShutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo -e "\n✅ WebCat is running!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo -e "\nPress Ctrl+C to stop all services"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
EOF
    
    chmod +x start.sh
    print_status "Created start.sh script"
    
    # Create stop script
    cat > stop.sh << 'EOF'
#!/bin/bash

# WebCat Stop Script

echo "Stopping WebCat services..."

# Kill processes on ports
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "Stopped backend server"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "Stopped frontend server"

echo "All services stopped."
EOF
    
    chmod +x stop.sh
    print_status "Created stop.sh script"
    
    # Summary
    print_header "Installation Complete!"
    
    echo -e "${GREEN}WebCat has been successfully installed!${NC}"
    echo
    echo "📋 Next steps:"
    echo "1. Edit ${YELLOW}backend/.env${NC} with your MySQL credentials"
    if [ "$MYSQL_AVAILABLE" = false ]; then
        echo "2. Install MySQL and create a database named 'webcat_db'"
        echo "3. Run database migrations: cd backend && npm run db:migrate"
    fi
    echo
    echo "🚀 To start WebCat:"
    echo "   ${GREEN}./start.sh${NC}"
    echo
    echo "🛑 To stop WebCat:"
    echo "   ${GREEN}./stop.sh${NC}"
    echo
    echo "📱 Access WebCat at:"
    echo "   Frontend: ${BLUE}http://localhost:5173${NC}"
    echo "   Backend API: ${BLUE}http://localhost:3001/api${NC}"
    echo
    echo "📚 Default credentials (after seeding):"
    echo "   Admin: admin@webcat.com / password123"
    echo "   Staff: staff@webcat.com / password123"
    echo "   Vendor: vendor@webcat.com / password123"
    echo
    print_status "Installation completed successfully! 🎉"
}

# Run main function
main