#!/bin/bash

echo "=========================================="
echo "  Starting WebCat on Port 80"
echo "=========================================="
echo ""
echo "NOTE: This requires sudo privileges to bind to port 80"
echo ""

# Kill any existing processes
echo "Stopping any existing WebCat processes..."
sudo pkill -f "ts-node-dev.*server.ts" 2>/dev/null || true
sudo pkill -f "vite" 2>/dev/null || true
sudo lsof -ti:80 | xargs -r sudo kill -9 2>/dev/null || true
sleep 2

# Start backend
echo "Starting backend on port 3001..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "Waiting for backend to start..."
while ! curl -s http://localhost:3001/api/health > /dev/null 2>&1; do
    sleep 1
done
echo "✅ Backend is running on http://localhost:3001"

# Start frontend with sudo
echo "Starting frontend on port 80 (requires sudo)..."
cd frontend
sudo npm run dev > ../frontend-80.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "Waiting for frontend to start..."
sleep 5

echo ""
echo "=============================================="
echo "✅ WebCat is running on PORT 80!"
echo "=============================================="
echo ""
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:3001/api"
echo ""
echo "🔐 Admin Login:"
echo "   Email: admin@webcat.com"
echo "   Password: admin123"
echo ""
echo "🎨 To access Theme Editor:"
echo "   1. Go to http://localhost"
echo "   2. Login as admin"
echo "   3. Click username in top-right"
echo "   4. Select 'Theme Editor'"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=============================================="

# Function to cleanup
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    sudo kill $FRONTEND_PID 2>/dev/null
    sudo pkill -f "ts-node-dev.*server.ts" 2>/dev/null || true
    sudo pkill -f "vite" 2>/dev/null || true
    exit 0
}

trap cleanup INT

# Keep running
while true; do
    sleep 1
done