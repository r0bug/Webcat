#!/bin/bash

# WebCat Development Startup Script (bypasses TypeScript errors)

echo "Starting WebCat in development mode..."

# Check if backend/.env exists
if [ ! -f "backend/.env" ]; then
    echo "Error: backend/.env not found. Creating from template..."
    cd backend
    cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=webcat_db
DB_USER=root
DB_PASSWORD=

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
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=WebCat <noreply@webcat.com>

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
EOF
    echo "Created backend/.env - Please update with your MySQL credentials"
    cd ..
fi

# Check if frontend/.env exists
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env..."
    cd frontend
    cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:3001/api
EOF
    cd ..
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\nShutting down services..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Start backend with ts-node-dev (bypasses build errors)
echo "Starting backend server (bypassing TypeScript errors)..."
cd backend
npx ts-node-dev --transpile-only --ignore-watch node_modules src/server.ts &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "Warning: Backend may not be running properly. Check for errors above."
else
    echo "✅ Backend is running at http://localhost:3001"
fi

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev -- --host &
FRONTEND_PID=$!
cd ..

echo -e "\n✅ WebCat is starting!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo -e "\nPress Ctrl+C to stop all services"
echo
echo "⚠️  Note: Running in development mode with TypeScript errors suppressed."
echo "   Some features may not work correctly until types are fixed."

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID