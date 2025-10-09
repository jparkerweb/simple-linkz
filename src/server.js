const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const storage = require('./storage');
const api = require('./api');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Content-Type mapping
const CONTENT_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

/**
 * Serve static files
 */
async function serveStaticFile(filePath, res) {
  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end('Not Found');
  }
}

/**
 * Log requests
 */
function logRequest(req, statusCode) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} ${statusCode}`);
}

/**
 * Request handler
 */
async function handleRequest(req, res) {
  let statusCode = 200;

  try {
    // API routes
    if (req.url.startsWith('/api/')) {
      await api.route(req, res);
      statusCode = res.statusCode;
      logRequest(req, statusCode);
      return;
    }

    // Static file routes
    let filePath;
    if (req.url === '/') {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    } else {
      filePath = path.join(PUBLIC_DIR, req.url);
    }

    // Security: Prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      statusCode = 403;
      logRequest(req, statusCode);
      return;
    }

    await serveStaticFile(filePath, res);
    statusCode = res.statusCode;
  } catch (error) {
    console.error('Request error:', error);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal Server Error');
      statusCode = 500;
    }
  }

  logRequest(req, statusCode);
}

/**
 * Initialize and start server
 */
async function start() {
  try {
    // Initialize data directory
    console.log('Initializing data storage...');
    await storage.initializeData();

    // Create HTTP server
    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
      console.log(`Simple Linkz server running on port ${PORT}`);
      console.log(`Visit http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();
