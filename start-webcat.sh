#!/bin/bash

# Kill any existing processes
echo "Stopping any existing WebCat processes..."
pkill -f "ts-node-dev.*server.ts" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

echo "Starting WebCat Theme Editor Demo..."
echo ""

# Start backend
echo "Starting backend..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "Waiting for backend to start..."
while ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; do
    sleep 1
done
echo "✅ Backend is running on http://localhost:3001"

# Start frontend
echo "Starting frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to be ready
echo "Waiting for frontend to start..."
sleep 5

# Get the actual port (in case 5173 is taken)
FRONTEND_PORT=$(grep -o "http://localhost:[0-9]*" frontend.log | head -1 | cut -d: -f3)

echo ""
echo "=============================================="
echo "✅ WebCat is running!"
echo "=============================================="
echo ""
echo "Frontend: http://localhost:${FRONTEND_PORT:-5173}"
echo "Backend API: http://localhost:3001/api"
echo ""
echo "🔐 Admin Login:"
echo "   Email: admin@webcat.com"
echo "   Password: admin123"
echo ""
echo "🎨 To access Theme Editor:"
echo "   1. Login as admin"
echo "   2. Click username in top-right"
echo "   3. Select 'Theme Editor'"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=============================================="

# Function to cleanup
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "ts-node-dev.*server.ts" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    exit 0
}

trap cleanup INT

# Keep running
while true; do
    sleep 1
done