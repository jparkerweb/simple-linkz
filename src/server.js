const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const storage = require('./storage');
const api = require('./api');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
// BASE_PATH allows serving from a subpath (e.g., /simple-linkz)
// Remove trailing slash if present
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/$/, '');

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
 * Serve static files (with BASE_PATH injection for HTML files)
 */
async function serveStaticFile(filePath, res) {
  try {
    let content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';

    // Inject BASE_PATH into HTML files and rewrite asset URLs
    if (ext === '.html') {
      let html = content.toString();

      if (BASE_PATH) {
        const basePath = BASE_PATH.replace(/'/g, "\\'"); // Escape single quotes
        const scriptTag = `<script>window.BASE_PATH = '${basePath}';</script>`;
        html = html.replace('</head>', `${scriptTag}</head>`);

        // Rewrite asset URLs to include BASE_PATH
        html = html.replace(/href="([^"]*\.css)"/g, `href="${BASE_PATH}/$1"`);
        html = html.replace(/src="([^"]*\.js)"/g, `src="${BASE_PATH}/$1"`);
        html = html.replace(/href="([^"]*\.png)"/g, `href="${BASE_PATH}/$1"`);
        html = html.replace(/href="([^"]*\.ico)"/g, `href="${BASE_PATH}/$1"`);
      }

      content = html;
    }

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
    let requestPath = req.url;

    // Strip BASE_PATH from the beginning of the request URL
    if (BASE_PATH && requestPath.startsWith(BASE_PATH)) {
      requestPath = requestPath.substring(BASE_PATH.length) || '/';
    }

    // API routes
    if (requestPath.startsWith('/api/')) {
      // Temporarily modify req.url for the API handler
      const originalUrl = req.url;
      req.url = requestPath;
      await api.route(req, res);
      req.url = originalUrl;
      statusCode = res.statusCode;
      logRequest(req, statusCode);
      return;
    }

    // Static file routes
    let filePath;
    if (requestPath === '/') {
      filePath = path.join(PUBLIC_DIR, 'index.html');
    } else {
      filePath = path.join(PUBLIC_DIR, requestPath);
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

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Simple Linkz server running on port ${PORT}`);
      if (BASE_PATH) {
        console.log(`Base path: ${BASE_PATH}`);
        console.log(`Visit http://localhost:${PORT}${BASE_PATH}`);
      } else {
        console.log(`Visit http://localhost:${PORT}`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();
