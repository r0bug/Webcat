#!/bin/bash

# Start both backend and frontend for WebCat

echo "Starting WebCat Services..."
echo "=========================="
echo

# Kill any existing processes on the ports
echo "Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 2

# Start backend
echo "Starting backend server on port 3001..."
cd /home/robug/Projects/WebCat/backend
npx ts-node-dev --transpile-only --respawn src/server.ts &
BACKEND_PID=$!

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Check if backend is running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:3001"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo
echo "Starting frontend server on port 5173..."
cd /home/robug/Projects/WebCat/frontend
npm run dev &
FRONTEND_PID=$!

# Wait for frontend to start
echo "Waiting for frontend to start..."
sleep 5

echo
echo "✅ WebCat is running!"
echo "===================="
echo "Frontend: http://localhost:5173"
echo "Backend API: http://localhost:3001/api"
echo
echo "Login credentials:"
echo "  Admin: admin@webcat.com / password123"
echo "  Staff: staff@webcat.com / password123"
echo "  Vendor: john@vendor.com / password123"
echo
echo "Press Ctrl+C to stop both services"

# Function to cleanup on exit
cleanup() {
    echo -e "\nShutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# Keep script running
wait