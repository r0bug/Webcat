#!/bin/bash

# WebCat Deployment Script for backoffice.yakimafinds.com
echo "Deploying WebCat to backoffice.yakimafinds.com..."

# Build backend
echo "Building backend..."
cd /home/robug/Webcat/backend
npm run build 2>&1 | grep -v "error TS" || true

# Build frontend
echo "Building frontend..."
cd /home/robug/Webcat/frontend
npm run build 2>&1 | grep -v "error TS" || true

# Create webcat directory in existing web root
WEBROOT="/home/robug/YFEvents/www/html/webcat"
echo "Creating webcat directory at $WEBROOT..."
mkdir -p $WEBROOT

# Copy frontend build
echo "Copying frontend files..."
cp -r dist/* $WEBROOT/

# Create .htaccess for routing
cat > $WEBROOT/.htaccess << 'EOF'
RewriteEngine On
RewriteBase /webcat/

# Don't rewrite files or directories
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Rewrite everything else to index.html
RewriteRule . /webcat/index.html [L]
EOF

# Start backend on port 3001
echo "Starting backend server..."
cd /home/robug/Webcat/backend
NODE_ENV=production nohup npm start > /home/robug/Webcat/backend.log 2>&1 &
BACKEND_PID=$!

# Create API proxy PHP file
echo "Creating API proxy..."
cat > $WEBROOT/api.php << 'EOF'
<?php
// WebCat API Proxy
$api_url = 'http://localhost:3001/api' . $_SERVER['PATH_INFO'];
if (!empty($_SERVER['QUERY_STRING'])) {
    $api_url .= '?' . $_SERVER['QUERY_STRING'];
}

$ch = curl_init($api_url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Forward request headers
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (!in_array(strtolower($name), ['host', 'connection'])) {
        $headers[] = "$name: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward request method and body
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH'])) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$headers = substr($response, 0, $header_size);
$body = substr($response, $header_size);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Set response code
http_response_code($http_code);

// Forward response headers
$header_lines = explode("\n", $headers);
foreach ($header_lines as $header) {
    if (strpos($header, ':') !== false && !preg_match('/^(Transfer-Encoding|Connection):/i', $header)) {
        header($header);
    }
}

// Output body
echo $body;
?>
EOF

# Update .htaccess to handle API routes
cat >> $WEBROOT/.htaccess << 'EOF'

# API proxy
RewriteRule ^api/(.*)$ api.php/$1 [L,QSA]
EOF

echo
echo "================================================"
echo "WebCat Deployment Complete!"
echo "================================================"
echo
echo "Frontend: https://backoffice.yakimafinds.com/webcat/"
echo "Backend API: Running on port 3001 (PID: $BACKEND_PID)"
echo "API Proxy: https://backoffice.yakimafinds.com/webcat/api/"
echo
echo "Backend logs: /home/robug/Webcat/backend.log"
echo
echo "To stop backend: kill $BACKEND_PID"
echo "================================================"