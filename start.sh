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