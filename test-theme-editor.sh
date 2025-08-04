#!/bin/bash

echo "=========================================="
echo "  WebCat Theme Editor Demo"
echo "=========================================="
echo ""
echo "Starting WebCat servers..."
echo ""

# Start backend
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend starting (PID: $BACKEND_PID)..."

# Wait for backend
sleep 5

# Start frontend
cd ../frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend starting (PID: $FRONTEND_PID)..."

# Wait for frontend
sleep 3

echo ""
echo "✅ WebCat is running!"
echo ""
echo "📋 Access the application:"
echo "   Frontend: http://localhost:5173 (or http://localhost:5174)"
echo ""
echo "🔐 Login credentials:"
echo "   Admin: admin@webcat.com / admin123"
echo ""
echo "🎨 Theme Editor:"
echo "   1. Login as admin"
echo "   2. Click on your username in navbar"
echo "   3. Select 'Theme Editor'"
echo ""
echo "✨ Features you can customize:"
echo "   - Site title and tagline"
echo "   - All colors (primary, secondary, background, etc.)"
echo "   - Typography (fonts and sizes)"
echo "   - Layout settings (border radius, container width)"
echo "   - Feature toggles (dark mode, vendor logos)"
echo ""
echo "📝 Changes are applied in real-time!"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    sleep 1
done