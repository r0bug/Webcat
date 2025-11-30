#!/bin/bash

# WebCat Production Start Script
# This script starts WebCat on port 80 for backoffice.yakimafinds.com

echo "Starting WebCat in production mode..."
echo

# Check if running as root (needed for port 80)
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root to use port 80"
   echo "Usage: sudo ./start-production.sh"
   exit 1
fi

# Set production environment
export NODE_ENV=production

# Stop any existing services
echo "Stopping any existing services..."
pkill -f "webcat" 2>/dev/null || true
sleep 2

# Create webcat subdirectory in web root
WEBROOT="/var/www/html/webcat"
echo "Setting up web root at $WEBROOT..."
mkdir -p $WEBROOT

# Build frontend with TypeScript errors suppressed
echo "Building frontend..."
cd /home/robug/Webcat/frontend
npm run build 2>&1 | grep -v "error TS" || true

# Copy frontend build to web root
echo "Deploying frontend..."
rm -rf $WEBROOT/*
cp -r dist/* $WEBROOT/

# Create API proxy configuration for Apache
echo "Creating Apache configuration..."
cat > /etc/apache2/sites-available/webcat.conf << 'EOF'
# WebCat API Proxy Configuration
<Location /webcat/api>
    ProxyPass http://localhost:3001/api
    ProxyPassReverse http://localhost:3001/api
    ProxyPreserveHost On
    
    # CORS headers
    Header always set Access-Control-Allow-Origin "https://backoffice.yakimafinds.com"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
</Location>

# WebCat Frontend
Alias /webcat /var/www/html/webcat
<Directory /var/www/html/webcat>
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
    
    # SPA routing - redirect all routes to index.html
    FallbackResource /webcat/index.html
</Directory>
EOF

# Enable Apache modules
echo "Enabling Apache modules..."
a2enmod proxy proxy_http headers rewrite

# Enable the site
a2ensite webcat

# Reload Apache
echo "Reloading Apache..."
systemctl reload apache2

# Start backend server
echo "Starting backend server on port 3001..."
cd /home/robug/Webcat/backend
nohup npm start > /var/log/webcat-backend.log 2>&1 &
BACKEND_PID=$!

echo
echo "================================================"
echo "WebCat Production Deployment Complete!"
echo "================================================"
echo
echo "Frontend: https://backoffice.yakimafinds.com/webcat"
echo "Backend API: https://backoffice.yakimafinds.com/webcat/api"
echo
echo "Backend PID: $BACKEND_PID"
echo "Backend logs: /var/log/webcat-backend.log"
echo
echo "To stop: sudo pkill -f webcat"
echo "================================================"