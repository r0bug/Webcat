const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PACKAGE_PATH = path.join(__dirname, '..', 'webcat-package.tar.gz');

const server = http.createServer((req, res) => {
  if (req.url === '/download' || req.url === '/webcat-package.tar.gz') {
    // Check if package exists
    if (!fs.existsSync(PACKAGE_PATH)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Package not found');
      return;
    }

    // Get file stats
    const stat = fs.statSync(PACKAGE_PATH);
    const fileSize = stat.size;

    // Set headers
    res.writeHead(200, {
      'Content-Type': 'application/gzip',
      'Content-Length': fileSize,
      'Content-Disposition': 'attachment; filename="webcat-package.tar.gz"'
    });

    // Stream the file
    const readStream = fs.createReadStream(PACKAGE_PATH);
    readStream.pipe(res);
  } else if (req.url === '/') {
    // Serve a simple download page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>WebCat Package Download</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
          }
          .download-btn {
            display: inline-block;
            padding: 15px 30px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-size: 18px;
            margin: 20px 0;
          }
          .download-btn:hover {
            background-color: #0056b3;
          }
          .info {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
          }
          code {
            background-color: #f1f1f1;
            padding: 2px 5px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <h1>WebCat Package Download</h1>
        <p>WebCat is a consignment mall catalog system with authentication, item management, messaging, and more.</p>
        
        <a href="/download" class="download-btn">Download WebCat Package</a>
        
        <div class="info">
          <h2>Package Contents:</h2>
          <ul>
            <li>Complete WebCat source code (backend & frontend)</li>
            <li>Installation script with dependency checking</li>
            <li>Database setup and migration scripts</li>
            <li>Sample data seeder</li>
            <li>Start scripts for easy deployment</li>
          </ul>
        </div>

        <div class="info">
          <h2>Quick Start:</h2>
          <ol>
            <li>Download the package</li>
            <li>Extract: <code>tar -xzf webcat-package.tar.gz</code></li>
            <li>Navigate: <code>cd WebCat</code></li>
            <li>Install: <code>./install-webcat.sh</code></li>
            <li>Start: <code>./start.sh</code></li>
            <li>Access at <a href="http://localhost:5173">http://localhost:5173</a></li>
          </ol>
        </div>

        <div class="info">
          <h2>System Requirements:</h2>
          <ul>
            <li>Node.js 18+ (required)</li>
            <li>MySQL 5.7+ (will be installed if missing)</li>
            <li>Linux or macOS</li>
            <li>4GB RAM minimum</li>
          </ul>
        </div>

        <p><small>File size: ${(fs.statSync(PACKAGE_PATH).size / (1024 * 1024)).toFixed(2)} MB</small></p>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
================================================
    WebCat Package Server Running
================================================

Download page: http://localhost:${PORT}
Direct download: http://localhost:${PORT}/download

Package location: ${PACKAGE_PATH}
Package size: ${(fs.statSync(PACKAGE_PATH).size / (1024 * 1024)).toFixed(2)} MB

Press Ctrl+C to stop the server
`);
});