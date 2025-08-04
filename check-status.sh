#!/bin/bash

echo "WebCat Status Check"
echo "==================="
echo

# Check backend
echo "Backend Status:"
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is running at http://localhost:3001"
    HEALTH=$(curl -s http://localhost:3001/api/health)
    echo "   Health: $HEALTH"
else
    echo "❌ Backend is not accessible"
fi

echo

# Check frontend
echo "Frontend Status:"
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is running at http://localhost:5173"
    TITLE=$(curl -s http://localhost:5173 | grep -o '<title>.*</title>' | sed 's/<[^>]*>//g')
    echo "   Page title: $TITLE"
else
    echo "❌ Frontend is not accessible"
fi

echo

# Check database
echo "Database Status:"
if mysql -u webcat_dev -pwebcat123 -e "USE webcat_db; SELECT COUNT(*) as item_count FROM items;" 2>/dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed"
fi

echo

# Show running processes
echo "Running Processes:"
ps aux | grep -E "(node|npm)" | grep -v grep | awk '{print "   " $11 " " $12 " (PID: " $2 ")"}'

echo

# Show listening ports
echo "Listening Ports:"
ss -tlnp 2>/dev/null | grep -E "(3001|5173)" | awk '{print "   " $4 " (" $1 ")"}'

echo
echo "==================="
echo "If you can't access the frontend in your browser, try:"
echo "1. Clear your browser cache"
echo "2. Try incognito/private mode"
echo "3. Try http://127.0.0.1:5173 instead of localhost"
echo "4. Check if you have any firewall or proxy settings"
echo "5. Try a different browser"