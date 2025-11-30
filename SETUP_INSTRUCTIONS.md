# WebCat Setup Instructions

WebCat is installed and running, but needs final configuration for web access.

## Current Status
- ✅ Database: Created and populated
- ✅ Backend: Running on port 3001 (PID: 8036)
- ✅ Frontend: Built and ready
- ⚠️ Web Access: Needs nginx configuration

## DNS Issue
The domain `backoffice.yakimafinds.com` points to IP `137.184.245.149`, but this server is at `209.38.135.39`.

## To Complete Setup

### Option 1: Access via IP Address (Immediate)

Run these commands as root:

```bash
# Create symlink for WebCat in nginx default root
sudo ln -sf /home/robug/YFEvents/www/html/webcat /var/www/html/webcat

# Test access
curl http://209.38.135.39/webcat/
```

Then access WebCat at: **http://209.38.135.39/webcat/**

### Option 2: Fix Domain Access (Recommended)

Either:
1. Update DNS for backoffice.yakimafinds.com to point to 209.38.135.39
2. Or deploy WebCat to the server at 137.184.245.149

### Option 3: Alternative Setup

If the nginx configuration isn't working, run as root:

```bash
# Copy the nginx config
sudo cp /home/robug/Webcat/nginx-webcat.conf /etc/nginx/sites-available/webcat
sudo ln -s /etc/nginx/sites-available/webcat /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/backoffice.yakimafinds.com
sudo nginx -t
sudo systemctl reload nginx
```

## Login Credentials
- Admin: admin@webcat.com / password123
- Staff: staff@webcat.com / password123
- Vendor: john@vendor.com / password123

## Backend Management
```bash
# Check status
ps aux | grep "node dist/server.js"

# View logs
tail -f /home/robug/Webcat/backend.log

# Restart
pkill -f "node dist/server.js"
cd /home/robug/Webcat/backend
NODE_ENV=production nohup npm start > /home/robug/Webcat/backend.log 2>&1 &
```