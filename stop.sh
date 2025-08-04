#!/bin/bash

# WebCat Stop Script

echo "Stopping WebCat services..."

# Kill processes on ports
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "Stopped backend server"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "Stopped frontend server"

echo "All services stopped."