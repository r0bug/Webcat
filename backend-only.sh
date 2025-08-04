#!/bin/bash

# Start only the backend server for WebCat

cd /home/robug/Projects/WebCat/backend

echo "Starting WebCat Backend Server..."
echo "================================"
echo

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Error: backend/.env not found!"
    exit 1
fi

# Display connection info
echo "Database connection:"
grep "DB_" .env | grep -v PASSWORD
echo

# Start the server
echo "Starting backend on port 3001..."
npx ts-node-dev --transpile-only --respawn src/server.ts