#!/bin/bash

echo "=========================================="
echo "  Starting WebCat on Port 80"
echo "=========================================="
echo ""

# Kill any existing processes
echo "Stopping any existing processes..."
echo "6809Timer" | sudo -S pkill -f "ts-node-dev.*server.ts" 2>/dev/null || true
echo "6809Timer" | sudo -S pkill -f "vite" 2>/dev/null || true
echo "6809Timer" | sudo -S lsof -ti:80 | xargs -r sudo kill -9 2>/dev/null || true
sleep 2

# Start backend
echo "Starting backend on port 3001..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend
echo "Waiting for backend to start..."
sleep 5
echo "✅ Backend started"

# Start frontend on port 80
echo "Starting frontend on port 80..."
cd frontend
echo "6809Timer" | sudo -S -E npm run dev > ../frontend-80.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend
echo "Waiting for frontend to start..."
sleep 5

echo ""
echo "=============================================="
echo "✅ WebCat is running!"
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
echo "   3. Click username → Theme Editor"
echo ""
echo "Press Ctrl+C to stop all services"
echo "=============================================="

# Function to cleanup
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    echo "6809Timer" | sudo -S kill $FRONTEND_PID 2>/dev/null
    echo "6809Timer" | sudo -S pkill -f "vite" 2>/dev/null || true
    pkill -f "ts-node-dev" 2>/dev/null || true
    exit 0
}

trap cleanup INT

# Keep running
while true; do
    sleep 1
done