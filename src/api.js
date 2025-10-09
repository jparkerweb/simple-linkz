const url = require('url');
const https = require('https');
const auth = require('./auth');
const storage = require('./storage');

const COOKIE_NAME = 'session';

/**
 * Parse JSON body from request
 */
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

/**
 * Parse cookies from request headers
 */
function parseCookies(req) {
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.trim().split('=');
      if (parts.length === 2) {
        cookies[parts[0]] = parts[1];
      }
    });
  }
  return cookies;
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(req) {
  const cookies = parseCookies(req);
  const signedSession = cookies[COOKIE_NAME];

  if (!signedSession) {
    return false;
  }

  const secret = await storage.getSessionSecret();
  const token = auth.verifyCookie(signedSession, secret);

  if (!token) {
    return false;
  }

  const sessions = await storage.getSessions();
  const session = sessions[token];

  return session && auth.isSessionValid(session);
}

/**
 * Send JSON response
 */
function sendJSON(res, statusCode, data) {
  // Protect against double-sending responses
  if (res.headersSent) {
    console.error('[API] Attempted to send response after headers already sent');
    return;
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Handle GET /api/setup/check
 */
async function handleSetupCheck(req, res) {
  try {
    const user = await storage.getUser();
    sendJSON(res, 200, { needsSetup: !user });
  } catch (error) {
    console.error('Setup check error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/setup
 */
async function handleSetup(req, res) {
  try {
    const body = await parseBody(req);
    const { username, password } = body;

    // Validation
    if (!username || username.length < 3 || username.length > 50) {
      return sendJSON(res, 400, { success: false, error: 'Username must be 3-50 characters' });
    }

    if (!password || password.length < 8) {
      return sendJSON(res, 400, { success: false, error: 'Password must be at least 8 characters' });
    }

    // Check if user already exists
    const existingUser = await storage.getUser();
    if (existingUser) {
      return sendJSON(res, 400, { success: false, error: 'User already exists' });
    }

    // Hash password and save user
    const passwordHash = await auth.hashPassword(password);
    await storage.setUser(username, passwordHash);

    sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('Setup error:', error);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/login
 */
async function handleLogin(req, res) {
  try {
    const body = await parseBody(req);
    const { username, password } = body;

    if (!username || !password) {
      return sendJSON(res, 400, { success: false, error: 'Username and password required' });
    }

    // Get user
    const user = await storage.getUser();
    if (!user || user.username !== username) {
      return sendJSON(res, 401, { success: false, error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await auth.verifyPassword(password, user.passwordHash);
    if (!valid) {
      return sendJSON(res, 401, { success: false, error: 'Invalid credentials' });
    }

    // Create session
    const { token, session } = auth.createSession();
    const sessions = await storage.getSessions();
    sessions[token] = session;
    await storage.saveSessions(sessions);

    // Sign cookie
    const secret = await storage.getSessionSecret();
    const signedToken = auth.signCookie(token, secret);

    // Set cookie
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=${signedToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
      });
      res.end(JSON.stringify({ success: true }));
    }
  } catch (error) {
    console.error('Login error:', error);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/logout
 */
async function handleLogout(req, res) {
  try {
    const cookies = parseCookies(req);
    const signedSession = cookies[COOKIE_NAME];

    if (signedSession) {
      const secret = await storage.getSessionSecret();
      const token = auth.verifyCookie(signedSession, secret);

      if (token) {
        const sessions = await storage.getSessions();
        delete sessions[token];
        await storage.saveSessions(sessions);
      }
    }

    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
      });
      res.end(JSON.stringify({ success: true }));
    }
  } catch (error) {
    console.error('Logout error:', error);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/reset-credentials
 */
async function handleResetCredentials(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    // Clear user credentials and all sessions
    await storage.setUser(null, null);
    await storage.saveSessions({});

    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
      });
      res.end(JSON.stringify({ success: true }));
    }
  } catch (error) {
    console.error('Reset credentials error:', error);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
}

/**
 * Handle GET /api/links
 */
async function handleGetLinks(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const links = await storage.getLinks();
    sendJSON(res, 200, { links });
  } catch (error) {
    console.error('Get links error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/links
 */
async function handleSaveLinks(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const body = await parseBody(req);
    const { links } = body;

    if (!Array.isArray(links)) {
      return sendJSON(res, 400, { success: false, error: 'Links must be an array' });
    }

    // Validate each link
    const ids = new Set();
    for (const link of links) {
      if (!link.id || !link.name || !link.url || typeof link.order !== 'number') {
        return sendJSON(res, 400, { success: false, error: 'Invalid link format' });
      }

      if (ids.has(link.id)) {
        return sendJSON(res, 400, { success: false, error: 'Duplicate link ID' });
      }
      ids.add(link.id);

      if (link.order < 0) {
        return sendJSON(res, 400, { success: false, error: 'Order must be non-negative' });
      }

      // Validate URL
      try {
        const parsedUrl = new URL(link.url);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return sendJSON(res, 400, { success: false, error: 'URL must be HTTP or HTTPS' });
        }
      } catch {
        return sendJSON(res, 400, { success: false, error: 'Invalid URL' });
      }
    }

    await storage.saveLinks(links);
    sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('Save links error:', error);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
}

/**
 * Handle GET /api/preferences
 */
async function handleGetPreferences(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const preferences = await storage.getPreferences();
    sendJSON(res, 200, { preferences });
  } catch (error) {
    console.error('Get preferences error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/preferences
 */
async function handleSavePreferences(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const body = await parseBody(req);
    const { preferences } = body;

    // Validate preferences
    const validLayouts = ['grid', 'list', 'cards'];
    const validThemes = ['light', 'dark'];
    const validColors = ['blue', 'green', 'purple', 'red', 'orange', 'pink', 'cyan', 'yellow'];
    const validBackgrounds = ['white', 'gray', 'slate', 'zinc'];

    if (!validLayouts.includes(preferences.layout)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid layout' });
    }

    if (!validThemes.includes(preferences.theme)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid theme' });
    }

    if (!validColors.includes(preferences.accentColor)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid accent color' });
    }

    if (!validBackgrounds.includes(preferences.backgroundColor)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid background color' });
    }

    if (!preferences.pageTitle || preferences.pageTitle.length > 50) {
      return sendJSON(res, 400, { success: false, error: 'Page title must be 1-50 characters' });
    }

    await storage.savePreferences(preferences);
    sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('Save preferences error:', error);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
}

/**
 * Handle GET /api/export
 */
async function handleExport(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const links = await storage.getLinks();
    const preferences = await storage.getPreferences();

    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=simple-linkz-export.json'
      });
      res.end(JSON.stringify({ links, preferences }, null, 2));
    }
  } catch (error) {
    console.error('Export error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/import
 */
async function handleImport(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const body = await parseBody(req);
    const { links, preferences } = body;

    if (links) {
      if (!Array.isArray(links)) {
        return sendJSON(res, 400, { success: false, error: 'Links must be an array' });
      }
      await storage.saveLinks(links);
    }

    if (preferences) {
      const validLayouts = ['grid', 'list', 'cards'];
      const validThemes = ['light', 'dark'];
      const validColors = ['blue', 'green', 'purple', 'red', 'orange', 'pink', 'cyan', 'yellow'];
      const validBackgrounds = ['white', 'gray', 'slate', 'zinc'];

      if (!validLayouts.includes(preferences.layout) ||
          !validThemes.includes(preferences.theme) ||
          !validColors.includes(preferences.accentColor) ||
          (preferences.backgroundColor && !validBackgrounds.includes(preferences.backgroundColor)) ||
          (preferences.pageTitle && (preferences.pageTitle.length < 1 || preferences.pageTitle.length > 50))) {
        return sendJSON(res, 400, { success: false, error: 'Invalid preferences' });
      }
      await storage.savePreferences(preferences);
    }

    sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('Import error:', error);
    sendJSON(res, 500, { success: false, error: 'Internal server error' });
  }
}

/**
 * Handle GET /api/page-title?url=...
 */
async function handlePageTitle(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  let responseSent = false;

  try {
    const parsedUrl = url.parse(req.url, true);
    const targetUrl = parsedUrl.query.url;

    if (!targetUrl) {
      return sendJSON(res, 400, { error: 'URL required' });
    }

    // Parse domain from URL for fallback
    const urlObj = new URL(targetUrl);
    const domain = urlObj.hostname.replace(/^www\./, '');

    // Try to fetch the page and extract title
    const protocol = urlObj.protocol === 'https:' ? https : require('http');

    const request = protocol.get(targetUrl, { timeout: 10000 }, (pageRes) => {
      if (responseSent) return;

      if (pageRes.statusCode === 200) {
        let html = '';
        pageRes.on('data', chunk => {
          if (responseSent) return;
          html += chunk.toString();
          // Stop after we have enough to find the title (first 10KB)
          if (html.length > 10000) {
            pageRes.destroy();
          }
        });

        pageRes.on('end', () => {
          if (responseSent) return;
          responseSent = true;
          // Try to extract title from HTML
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            const title = titleMatch[1].trim();
            return sendJSON(res, 200, { title });
          }
          // Fallback to domain name
          return sendJSON(res, 200, { title: domain });
        });
      } else {
        // Fallback to domain name on error
        if (responseSent) return;
        responseSent = true;
        return sendJSON(res, 200, { title: domain });
      }
    });

    request.on('error', () => {
      if (responseSent) return;
      responseSent = true;
      // Fallback to domain name on error
      return sendJSON(res, 200, { title: domain });
    });

    request.on('timeout', () => {
      if (responseSent) return;
      responseSent = true;
      request.destroy();
      // Fallback to domain name on timeout
      return sendJSON(res, 200, { title: domain });
    });
  } catch (error) {
    console.error('[PAGE TITLE API] Error:', error);
    if (responseSent) return;
    responseSent = true;
    try {
      const parsedUrl = url.parse(req.url, true);
      const urlObj = new URL(parsedUrl.query.url);
      const domain = urlObj.hostname.replace(/^www\./, '');
      return sendJSON(res, 200, { title: domain });
    } catch {
      return sendJSON(res, 400, { error: 'Invalid URL' });
    }
  }
}

/**
 * Handle GET /api/favicon?url=...
 */
async function handleFavicon(req, res) {
  let responseSent = false;

  if (!await isAuthenticated(req)) {
    console.log('[FAVICON API] Unauthorized request');
    if (!res.headersSent) {
      res.writeHead(401);
      res.end();
    }
    return;
  }

  try {
    const parsedUrl = url.parse(req.url, true);
    const targetUrl = parsedUrl.query.url;

    console.log('[FAVICON API] Request for URL:', targetUrl);

    if (!targetUrl) {
      console.log('[FAVICON API] No URL provided');
      if (!res.headersSent) {
        res.writeHead(400);
        res.end();
      }
      return;
    }

    // Parse domain from URL
    const urlObj = new URL(targetUrl);
    console.log('[FAVICON API] Parsed domain:', urlObj.hostname);

    // Try multiple favicon sources in order
    const faviconUrls = [
      // Try direct favicon.ico first
      `${urlObj.protocol}//${urlObj.host}/favicon.ico`,
      // Fallback to Google's favicon service (more reliable)
      `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=32`
    ];

    let succeeded = false;

    for (const faviconUrl of faviconUrls) {
      if (responseSent) break;

      console.log('[FAVICON API] Trying:', faviconUrl);
      try {
        await new Promise((resolve, reject) => {
          let requestHandled = false;
          const protocol = faviconUrl.startsWith('https') ? https : require('http');

          const httpRequest = protocol.get(faviconUrl, { timeout: 5000 }, (faviconRes) => {
            if (requestHandled || responseSent) return;
            console.log('[FAVICON API] Response status:', faviconRes.statusCode);

            // Handle redirects (301, 302, 307, 308)
            if (faviconRes.statusCode >= 300 && faviconRes.statusCode < 400 && faviconRes.headers.location) {
              console.log('[FAVICON API] Following redirect to:', faviconRes.headers.location);
              const redirectProtocol = faviconRes.headers.location.startsWith('https') ? https : require('http');

              const redirectRequest = redirectProtocol.get(faviconRes.headers.location, { timeout: 5000 }, (redirectRes) => {
                if (requestHandled || responseSent) return;
                console.log('[FAVICON API] Redirect response status:', redirectRes.statusCode);
                if (redirectRes.statusCode === 200) {
                  console.log('[FAVICON API] Success after redirect! Piping response');
                  requestHandled = true;
                  responseSent = true;
                  if (!res.headersSent) {
                    res.writeHead(200, {
                      'Content-Type': faviconUrl.includes('google.com') ? 'image/png' : 'image/x-icon',
                      'Cache-Control': 'public, max-age=86400'
                    });
                    redirectRes.pipe(res);
                  }
                  succeeded = true;
                  resolve();
                } else {
                  console.log('[FAVICON API] Redirect failed with status:', redirectRes.statusCode);
                  requestHandled = true;
                  reject(new Error('Redirect failed'));
                }
              }).on('error', (err) => {
                if (requestHandled || responseSent) return;
                requestHandled = true;
                reject(err);
              }).on('timeout', () => {
                if (requestHandled || responseSent) return;
                console.log('[FAVICON API] Redirect timeout');
                requestHandled = true;
                redirectRequest.destroy();
                reject(new Error('Redirect timeout'));
              });
              return;
            }

            if (faviconRes.statusCode === 200) {
              console.log('[FAVICON API] Success! Piping response');
              requestHandled = true;
              responseSent = true;
              if (!res.headersSent) {
                res.writeHead(200, {
                  'Content-Type': faviconUrl.includes('google.com') ? 'image/png' : 'image/x-icon',
                  'Cache-Control': 'public, max-age=86400'
                });
                faviconRes.pipe(res);
              }
              succeeded = true;
              resolve();
            } else {
              console.log('[FAVICON API] Failed with status:', faviconRes.statusCode);
              requestHandled = true;
              reject(new Error('Favicon not found'));
            }
          }).on('error', (err) => {
            if (requestHandled || responseSent) return;
            console.log('[FAVICON API] Error:', err.message);
            requestHandled = true;
            reject(err);
          }).on('timeout', () => {
            if (requestHandled || responseSent) return;
            console.log('[FAVICON API] Timeout');
            requestHandled = true;
            httpRequest.destroy();
            reject(new Error('Timeout'));
          });
        });

        if (succeeded) {
          console.log('[FAVICON API] Successfully fetched from:', faviconUrl);
          break;
        }
      } catch (error) {
        if (responseSent) break;
        console.log('[FAVICON API] Failed, trying next source');
        // Try next URL
        continue;
      }
    }

    if (!succeeded && !responseSent) {
      console.log('[FAVICON API] All sources failed, returning 404');
      responseSent = true;
      if (!res.headersSent) {
        res.writeHead(404);
        res.end();
      }
    }
  } catch (error) {
    console.log('[FAVICON API] Unexpected error:', error);
    if (!responseSent && !res.headersSent) {
      responseSent = true;
      res.writeHead(404);
      res.end();
    }
  }
}

/**
 * Main router
 */
async function route(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Setup endpoints
  if (pathname === '/api/setup/check' && req.method === 'GET') {
    return handleSetupCheck(req, res);
  }
  if (pathname === '/api/setup' && req.method === 'POST') {
    return handleSetup(req, res);
  }

  // Auth endpoints
  if (pathname === '/api/login' && req.method === 'POST') {
    return handleLogin(req, res);
  }
  if (pathname === '/api/logout' && req.method === 'POST') {
    return handleLogout(req, res);
  }
  if (pathname === '/api/reset-credentials' && req.method === 'POST') {
    return handleResetCredentials(req, res);
  }

  // Link endpoints
  if (pathname === '/api/links' && req.method === 'GET') {
    return handleGetLinks(req, res);
  }
  if (pathname === '/api/links' && req.method === 'POST') {
    return handleSaveLinks(req, res);
  }

  // Preference endpoints
  if (pathname === '/api/preferences' && req.method === 'GET') {
    return handleGetPreferences(req, res);
  }
  if (pathname === '/api/preferences' && req.method === 'POST') {
    return handleSavePreferences(req, res);
  }

  // Import/Export endpoints
  if (pathname === '/api/export' && req.method === 'GET') {
    return handleExport(req, res);
  }
  if (pathname === '/api/import' && req.method === 'POST') {
    return handleImport(req, res);
  }

  // Page title endpoint
  if (pathname === '/api/page-title' && req.method === 'GET') {
    return handlePageTitle(req, res);
  }

  // Favicon endpoint
  if (pathname === '/api/favicon' && req.method === 'GET') {
    return handleFavicon(req, res);
  }

  // 404
  if (!res.headersSent) {
    res.writeHead(404);
    res.end();
  }
}

module.exports = { route };
