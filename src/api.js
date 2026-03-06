const url = require('url');
const https = require('https');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const auth = require('./auth');
const storage = require('./storage');

// Custom icons configuration
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const ICONS_DIR = path.join(DATA_DIR, 'icons');
const MAX_ICON_SIZE = 100 * 1024; // 100KB
const MAX_CUSTOM_ICONS = 50;
const ALLOWED_ICON_TYPES = ['.png', '.svg', '.ico', '.webp'];

const COOKIE_NAME = 'session';

// Favicon cache - in-memory cache for favicon data
const faviconCache = new Map();
const FAVICON_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
const MAX_CACHE_SIZE = 500;

/**
 * Get cached favicon data if exists and not expired
 */
function getCachedFavicon(url) {
  const entry = faviconCache.get(url);
  if (entry && Date.now() - entry.fetchedAt < FAVICON_TTL) {
    return entry.data;
  }
  faviconCache.delete(url); // Clean expired entry
  return null;
}

/**
 * Store favicon data in cache with LRU eviction
 */
function setCachedFavicon(url, data) {
  // LRU eviction if at capacity
  if (faviconCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = faviconCache.keys().next().value;
    faviconCache.delete(oldestKey);
  }
  faviconCache.set(url, { data, fetchedAt: Date.now() });
}

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
 * Get client IP from request (handles proxied requests)
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress;
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
 * Extract session token from request (for CSRF validation)
 */
async function extractSessionToken(req) {
  const cookies = parseCookies(req);
  const signedSession = cookies[COOKIE_NAME];

  if (!signedSession) {
    return null;
  }

  const secret = await storage.getSessionSecret();
  return auth.verifyCookie(signedSession, secret);
}

/**
 * Check if user is authenticated
 */
async function isAuthenticated(req) {
  const token = await extractSessionToken(req);

  if (!token) {
    return false;
  }

  const sessions = await storage.getSessions();
  const session = sessions[token];

  return session && auth.isSessionValid(session);
}

/**
 * Validate CSRF token for mutating requests (async version)
 */
async function validateCsrf(req, sessionToken) {
  const method = req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true; // No CSRF check for safe methods
  }

  const csrfToken = req.headers['x-csrf-token'];
  if (!csrfToken) {
    return false;
  }

  return auth.validateCsrfToken(sessionToken, csrfToken);
}

/**
 * Check authentication and CSRF for protected endpoints
 * Returns { authenticated: boolean, sessionToken?: string, csrfValid?: boolean }
 */
async function checkAuthAndCsrf(req) {
  const sessionToken = await extractSessionToken(req);

  if (!sessionToken) {
    return { authenticated: false };
  }

  const sessions = await storage.getSessions();
  const session = sessions[sessionToken];

  if (!session || !auth.isSessionValid(session)) {
    return { authenticated: false };
  }

  // For mutating requests, validate CSRF
  const csrfValid = await validateCsrf(req, sessionToken);

  return { authenticated: true, sessionToken, csrfValid };
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
    const clientIP = getClientIP(req);

    // Check rate limit BEFORE processing login
    const rateLimitResult = await auth.checkRateLimit(clientIP);
    if (!rateLimitResult.allowed) {
      res.setHeader('Retry-After', Math.ceil(rateLimitResult.retryAfter / 1000));
      return sendJSON(res, 429, {
        error: 'Too many failed attempts',
        code: 'RATE_LIMITED',
        retryAfter: rateLimitResult.retryAfter
      });
    }

    const body = await parseBody(req);
    const { username, password } = body;

    if (!username || !password) {
      return sendJSON(res, 400, { success: false, error: 'Username and password required' });
    }

    // Get user
    const user = await storage.getUser();
    if (!user || user.username !== username) {
      await auth.recordFailedAttempt(clientIP);
      return sendJSON(res, 401, { success: false, error: 'Invalid credentials' });
    }

    // Verify password
    const valid = await auth.verifyPassword(password, user.passwordHash);
    if (!valid) {
      await auth.recordFailedAttempt(clientIP);
      return sendJSON(res, 401, { success: false, error: 'Invalid credentials' });
    }

    // Clear rate limit on success
    await auth.clearRateLimitOnSuccess(clientIP);

    // Create session
    const { token, session } = auth.createSession();
    const sessions = await storage.getSessions();
    sessions[token] = session;
    await storage.saveSessions(sessions);

    // Generate CSRF token for the session
    const csrfToken = await auth.generateCsrfToken(token);

    // Sign cookie
    const secret = await storage.getSessionSecret();
    const signedToken = auth.signCookie(token, secret);

    // Set cookie
    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Set-Cookie': `${COOKIE_NAME}=${signedToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`
      });
      res.end(JSON.stringify({ success: true, csrfToken }));
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
    const authResult = await checkAuthAndCsrf(req);

    // Even if CSRF is invalid, we still clear the session (logout is idempotent)
    // But we validate to prevent CSRF logout attacks
    if (authResult.authenticated && !authResult.csrfValid) {
      return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
    }

    const cookies = parseCookies(req);
    const signedSession = cookies[COOKIE_NAME];

    if (signedSession) {
      const secret = await storage.getSessionSecret();
      const token = auth.verifyCookie(signedSession, secret);

      if (token) {
        // Clear CSRF token first
        await auth.clearCsrfToken(token);

        // Then delete the session
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
 * Handle GET /api/csrf - Get current CSRF token for session
 */
async function handleGetCsrf(req, res) {
  const sessionToken = await extractSessionToken(req);

  if (!sessionToken) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  const sessions = await storage.getSessions();
  const session = sessions[sessionToken];

  if (!session || !auth.isSessionValid(session)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    // Check if there's an existing CSRF token
    const data = await storage.readData();
    let csrfToken = data.csrfTokens[sessionToken];

    // Generate new one if doesn't exist
    if (!csrfToken) {
      csrfToken = await auth.generateCsrfToken(sessionToken);
    }

    sendJSON(res, 200, { csrfToken });
  } catch (error) {
    console.error('Get CSRF token error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/reset-credentials
 */
async function handleResetCredentials(req, res) {
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    // Clear all CSRF tokens first
    const data = await storage.readData();
    data.csrfTokens = {};
    await storage.writeData(data);

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
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const body = await parseBody(req);
    const { links } = body;

    if (!Array.isArray(links)) {
      return sendJSON(res, 400, { success: false, error: 'Links must be an array' });
    }

    // Get existing tags for validation
    const existingTags = await storage.getTags();
    const validTagIds = new Set(existingTags.map(t => t.id));

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

      // Validate tags if provided
      if (link.tags !== undefined) {
        if (!Array.isArray(link.tags)) {
          return sendJSON(res, 400, { success: false, error: 'Link tags must be an array' });
        }
        for (const tagId of link.tags) {
          if (!validTagIds.has(tagId)) {
            return sendJSON(res, 400, { success: false, error: `Invalid tag ID: ${tagId}` });
          }
        }
      } else {
        // Default to empty array if not provided
        link.tags = [];
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
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const body = await parseBody(req);
    const { preferences } = body;

    // Validate preferences
    const validLayouts = ['grid', 'list', 'cards'];
    const validThemePresets = [
      'midnight', 'slate', 'ocean', 'forest', 'ember', 'lavender', 'sand', 'arctic',
      'cherry', 'mocha', 'teal', 'blush', 'sapphire', 'mint', 'rose', 'storm',
      'sunset', 'olive', 'paper', 'graphite'
    ];
    const validBackgrounds = [
      // Light colors
      'white', 'stone', 'slate', 'sky', 'mint', 'cream', 'peach', 'rose',
      // Dark colors
      'charcoal', 'graphite', 'navy', 'ocean', 'forest', 'espresso', 'plum', 'noir',
      // Legacy colors (for backwards compatibility)
      'gray', 'zinc', 'cyan', 'lime', 'olive', 'burgundy'
    ];

    // Normalize legacy named accent colors to hex
    if (preferences.accentColor) {
      preferences.accentColor = normalizeAccentColor(preferences.accentColor);
    }

    if (!validLayouts.includes(preferences.layout)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid layout' });
    }

    if (preferences.themePreset && !validThemePresets.includes(preferences.themePreset)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid theme preset' });
    }

    if (preferences.backgroundColor && !validBackgrounds.includes(preferences.backgroundColor)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid background color' });
    }

    // Validate accent color (hex format)
    if (preferences.accentColor && !isValidHexColor(preferences.accentColor)) {
      return sendJSON(res, 400, { success: false, error: 'Invalid accent color (must be hex format)' });
    }

    if (!preferences.pageTitle || preferences.pageTitle.length > 50) {
      return sendJSON(res, 400, { success: false, error: 'Page title must be 1-50 characters' });
    }

    // Validate custom CSS (optional field - just ensure it's an object if provided)
    if (preferences.customCss !== undefined && typeof preferences.customCss !== 'object') {
      return sendJSON(res, 400, { success: false, error: 'Invalid custom CSS format' });
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
    const tags = await storage.getTags();
    const preferences = await storage.getPreferences();

    if (!res.headersSent) {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename=simple-linkz-export.json'
      });
      res.end(JSON.stringify({ links, tags, preferences }, null, 2));
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
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const body = await parseBody(req);
    const { links, tags, preferences } = body;

    // Handle tag import with merging
    let tagIdMapping = {}; // Maps old tag IDs to new/existing tag IDs
    if (tags && Array.isArray(tags)) {
      const existingTags = await storage.getTags();
      const existingTagsByName = {};
      existingTags.forEach(t => {
        existingTagsByName[t.name.toLowerCase()] = t;
      });

      const mergedTags = [...existingTags];

      for (const importedTag of tags) {
        const normalizedName = importedTag.name.toLowerCase();
        if (existingTagsByName[normalizedName]) {
          // Tag with same name exists, use existing tag ID
          tagIdMapping[importedTag.id] = existingTagsByName[normalizedName].id;
        } else {
          // New tag, generate new ID and add
          const newId = crypto.randomUUID();
          tagIdMapping[importedTag.id] = newId;
          const newTag = {
            id: newId,
            name: importedTag.name,
            color: importedTag.color || '#3B82F6'
          };
          mergedTags.push(newTag);
          existingTagsByName[normalizedName] = newTag;
        }
      }

      await storage.saveTags(mergedTags);
    }

    // Handle links import with tag ID remapping
    if (links) {
      if (!Array.isArray(links)) {
        return sendJSON(res, 400, { success: false, error: 'Links must be an array' });
      }

      // Remap tag IDs in links if we have a mapping
      const remappedLinks = links.map(link => {
        if (link.tags && Array.isArray(link.tags) && Object.keys(tagIdMapping).length > 0) {
          return {
            ...link,
            tags: link.tags.map(oldTagId => tagIdMapping[oldTagId] || oldTagId)
          };
        }
        return link;
      });

      await storage.saveLinks(remappedLinks);
    }

    if (preferences) {
      const validLayouts = ['grid', 'list', 'cards'];
      const validThemePresets = [
        'midnight', 'slate', 'ocean', 'forest', 'ember', 'lavender', 'sand', 'arctic',
        'cherry', 'mocha', 'teal', 'blush', 'sapphire', 'mint', 'rose', 'storm',
        'sunset', 'olive', 'paper', 'graphite'
      ];
      const validBackgrounds = [
        'white', 'stone', 'slate', 'sky', 'mint', 'cream', 'peach', 'rose',
        'charcoal', 'graphite', 'navy', 'ocean', 'forest', 'espresso', 'plum', 'noir',
        'gray', 'zinc', 'cyan', 'lime', 'olive', 'burgundy'
      ];

      // Normalize legacy named accent colors to hex
      if (preferences.accentColor) {
        preferences.accentColor = normalizeAccentColor(preferences.accentColor);
      }

      if (!validLayouts.includes(preferences.layout) ||
          (preferences.themePreset && !validThemePresets.includes(preferences.themePreset)) ||
          (preferences.backgroundColor && !validBackgrounds.includes(preferences.backgroundColor)) ||
          (preferences.pageTitle && (preferences.pageTitle.length < 1 || preferences.pageTitle.length > 50))) {
        return sendJSON(res, 400, { success: false, error: 'Invalid preferences' });
      }

      // Validate accent color if provided
      if (preferences.accentColor && !isValidHexColor(preferences.accentColor)) {
        return sendJSON(res, 400, { success: false, error: 'Invalid accent color format (must be hex)' });
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
 * Fetch favicon from a URL and return buffered data
 */
function fetchFaviconFromUrl(faviconUrl) {
  return new Promise((resolve, reject) => {
    const protocol = faviconUrl.startsWith('https') ? https : require('http');

    const httpRequest = protocol.get(faviconUrl, { timeout: 5000 }, (faviconRes) => {
      // Handle redirects (301, 302, 307, 308)
      if (faviconRes.statusCode >= 300 && faviconRes.statusCode < 400 && faviconRes.headers.location) {
        let redirectUrl;
        if (faviconRes.headers.location.startsWith('http://') || faviconRes.headers.location.startsWith('https://')) {
          redirectUrl = faviconRes.headers.location;
        } else {
          const originalUrl = new URL(faviconUrl);
          redirectUrl = new URL(faviconRes.headers.location, originalUrl.origin).href;
        }

        // Follow redirect
        fetchFaviconFromUrl(redirectUrl).then(resolve).catch(reject);
        return;
      }

      if (faviconRes.statusCode === 200) {
        const chunks = [];
        faviconRes.on('data', chunk => chunks.push(chunk));
        faviconRes.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = faviconUrl.includes('google.com') ? 'image/png' : 'image/x-icon';
          resolve({ buffer, contentType });
        });
        faviconRes.on('error', reject);
      } else {
        reject(new Error('Favicon not found'));
      }
    });

    httpRequest.on('error', reject);
    httpRequest.on('timeout', () => {
      httpRequest.destroy();
      reject(new Error('Timeout'));
    });
  });
}

/**
 * Handle GET /api/favicon?url=...
 */
async function handleFavicon(req, res) {
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

    // Check cache first
    const cachedData = getCachedFavicon(targetUrl);
    if (cachedData) {
      console.log('[FAVICON API] Cache HIT for:', targetUrl);
      if (!res.headersSent) {
        res.writeHead(200, {
          'Content-Type': cachedData.contentType,
          'Cache-Control': 'public, max-age=86400',
          'X-Cache': 'HIT'
        });
        res.end(cachedData.buffer);
      }
      return;
    }

    console.log('[FAVICON API] Cache MISS for:', targetUrl);

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
      console.log('[FAVICON API] Trying:', faviconUrl);
      try {
        const { buffer, contentType } = await fetchFaviconFromUrl(faviconUrl);

        // Cache the result
        setCachedFavicon(targetUrl, { buffer, contentType });
        console.log('[FAVICON API] Cached favicon for:', targetUrl);

        // Send response
        if (!res.headersSent) {
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
            'X-Cache': 'MISS'
          });
          res.end(buffer);
        }
        succeeded = true;
        console.log('[FAVICON API] Successfully fetched from:', faviconUrl);
        break;
      } catch (error) {
        console.log('[FAVICON API] Failed, trying next source');
        continue;
      }
    }

    if (!succeeded) {
      console.log('[FAVICON API] All sources failed, returning 404');
      if (!res.headersSent) {
        res.writeHead(404);
        res.end();
      }
    }
  } catch (error) {
    console.log('[FAVICON API] Unexpected error:', error);
    if (!res.headersSent) {
      res.writeHead(404);
      res.end();
    }
  }
}

/**
 * Handle GET /api/debug/cache-stats
 */
async function handleCacheStats(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  sendJSON(res, 200, {
    faviconCacheSize: faviconCache.size,
    maxSize: MAX_CACHE_SIZE
  });
}

/**
 * Helper function to remove a tag from all links
 */
function removeTagFromAllLinks(data, tagId) {
  data.links = data.links.map(link => ({
    ...link,
    tags: (link.tags || []).filter(t => t !== tagId)
  }));
  return data;
}

/**
 * Validate hex color format (#RGB or #RRGGBB)
 */
function isValidHexColor(color) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

/**
 * Legacy named accent colors from older versions - convert to hex
 */
const LEGACY_ACCENT_COLORS = {
  blue: '#3b82f6', green: '#22c55e', purple: '#a855f7', red: '#ef4444',
  orange: '#f97316', pink: '#ec4899', cyan: '#06b6d4', yellow: '#eab308'
};

function normalizeAccentColor(color) {
  if (!color) return color;
  if (isValidHexColor(color)) return color;
  return LEGACY_ACCENT_COLORS[color.toLowerCase()] || null;
}

/**
 * Handle GET /api/tags
 */
async function handleGetTags(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const tags = await storage.getTags();
    // Sort alphabetically by name
    const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));
    sendJSON(res, 200, { tags: sortedTags });
  } catch (error) {
    console.error('Get tags error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/tags
 */
async function handleCreateTag(req, res) {
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const body = await parseBody(req);
    const { name, color } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return sendJSON(res, 400, { error: 'Tag name is required' });
    }

    const trimmedName = name.trim();

    // Validate color
    if (!color || !isValidHexColor(color)) {
      return sendJSON(res, 400, { error: 'Valid hex color is required (#RGB or #RRGGBB)' });
    }

    // Check uniqueness
    const existingTags = await storage.getTags();
    if (existingTags.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      return sendJSON(res, 400, { error: 'Tag name already exists' });
    }

    // Create new tag
    const newTag = {
      id: crypto.randomUUID(),
      name: trimmedName,
      color: color.toUpperCase()
    };

    existingTags.push(newTag);
    await storage.saveTags(existingTags);

    sendJSON(res, 200, { tag: newTag });
  } catch (error) {
    console.error('Create tag error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle PUT /api/tags/:id
 */
async function handleUpdateTag(req, res, tagId) {
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const body = await parseBody(req);
    const { name, color } = body;

    const tags = await storage.getTags();
    const tagIndex = tags.findIndex(t => t.id === tagId);

    if (tagIndex === -1) {
      return sendJSON(res, 404, { error: 'Tag not found' });
    }

    const tag = tags[tagIndex];

    // Validate and update name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return sendJSON(res, 400, { error: 'Tag name cannot be empty' });
      }
      const trimmedName = name.trim();

      // Check uniqueness (excluding current tag)
      if (tags.some(t => t.id !== tagId && t.name.toLowerCase() === trimmedName.toLowerCase())) {
        return sendJSON(res, 400, { error: 'Tag name already exists' });
      }

      tag.name = trimmedName;
    }

    // Validate and update color if provided
    if (color !== undefined) {
      if (!isValidHexColor(color)) {
        return sendJSON(res, 400, { error: 'Valid hex color is required (#RGB or #RRGGBB)' });
      }
      tag.color = color.toUpperCase();
    }

    tags[tagIndex] = tag;
    await storage.saveTags(tags);

    sendJSON(res, 200, { tag });
  } catch (error) {
    console.error('Update tag error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle DELETE /api/tags/:id
 */
async function handleDeleteTag(req, res, tagId) {
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const tags = await storage.getTags();
    const tagIndex = tags.findIndex(t => t.id === tagId);

    if (tagIndex === -1) {
      return sendJSON(res, 404, { error: 'Tag not found' });
    }

    // Remove the tag
    tags.splice(tagIndex, 1);
    await storage.saveTags(tags);

    // Remove the tag from all links
    const data = await storage.readData();
    removeTagFromAllLinks(data, tagId);
    await storage.writeData(data);

    sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('Delete tag error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/links/bulk-tag
 */
async function handleBulkTag(req, res) {
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const body = await parseBody(req);
    const { linkIds, operation, tagIds } = body;

    // Validate input
    if (!Array.isArray(linkIds) || linkIds.length === 0) {
      return sendJSON(res, 400, { error: 'linkIds must be a non-empty array' });
    }
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return sendJSON(res, 400, { error: 'tagIds must be a non-empty array' });
    }
    if (operation !== 'add' && operation !== 'remove') {
      return sendJSON(res, 400, { error: 'operation must be "add" or "remove"' });
    }

    const data = await storage.readData();
    const links = data.links || [];
    const tags = data.tags || [];

    // Validate all linkIds exist
    const linkIdSet = new Set(links.map(l => l.id));
    for (const linkId of linkIds) {
      if (!linkIdSet.has(linkId)) {
        return sendJSON(res, 400, { error: `Link not found: ${linkId}` });
      }
    }

    // Validate all tagIds exist
    const tagIdSet = new Set(tags.map(t => t.id));
    for (const tagId of tagIds) {
      if (!tagIdSet.has(tagId)) {
        return sendJSON(res, 400, { error: `Tag not found: ${tagId}` });
      }
    }

    // Apply operation
    if (operation === 'add') {
      data.links = links.map(link => {
        if (linkIds.includes(link.id)) {
          const newTags = new Set([...(link.tags || []), ...tagIds]);
          return { ...link, tags: Array.from(newTags) };
        }
        return link;
      });
    } else if (operation === 'remove') {
      data.links = links.map(link => {
        if (linkIds.includes(link.id)) {
          return { ...link, tags: (link.tags || []).filter(t => !tagIds.includes(t)) };
        }
        return link;
      });
    }

    await storage.writeData(data);
    sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('Bulk tag error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Parse multipart form data (simple implementation for icon uploads)
 */
function parseMultipartFormData(req) {
  return new Promise((resolve, reject) => {
    const contentType = req.headers['content-type'] || '';
    const boundaryMatch = contentType.match(/boundary=(.+)/);
    if (!boundaryMatch) {
      return reject(new Error('No boundary found in multipart request'));
    }
    const boundary = boundaryMatch[1];

    const chunks = [];
    let totalSize = 0;

    req.on('data', chunk => {
      totalSize += chunk.length;
      if (totalSize > MAX_ICON_SIZE + 1024) { // Allow 1KB overhead for form data
        req.destroy();
        reject(new Error('File too large'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const data = buffer.toString('binary');

      // Find file content between boundaries
      const parts = data.split('--' + boundary);

      for (const part of parts) {
        if (part.includes('Content-Disposition: form-data') && part.includes('filename=')) {
          // Extract filename
          const filenameMatch = part.match(/filename="([^"]+)"/);
          const filename = filenameMatch ? filenameMatch[1] : null;

          // Extract content type
          const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n]+)/);
          const mimeType = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';

          // Extract file content (after double CRLF)
          const headerEnd = part.indexOf('\r\n\r\n');
          if (headerEnd === -1) continue;

          let fileContent = part.slice(headerEnd + 4);
          // Remove trailing CRLF before next boundary
          if (fileContent.endsWith('\r\n')) {
            fileContent = fileContent.slice(0, -2);
          }

          resolve({
            filename,
            mimeType,
            buffer: Buffer.from(fileContent, 'binary')
          });
          return;
        }
      }

      reject(new Error('No file found in upload'));
    });

    req.on('error', reject);
  });
}

/**
 * Handle GET /api/icons
 */
async function handleGetIcons(req, res) {
  if (!await isAuthenticated(req)) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }

  try {
    const icons = await storage.getCustomIcons();
    sendJSON(res, 200, { icons });
  } catch (error) {
    console.error('Get icons error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle POST /api/icons
 */
async function handleUploadIcon(req, res) {
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    // Check icon count limit
    const existingIcons = await storage.getCustomIcons();
    if (existingIcons.length >= MAX_CUSTOM_ICONS) {
      return sendJSON(res, 400, { error: `Maximum ${MAX_CUSTOM_ICONS} custom icons allowed` });
    }

    // Parse multipart form data
    let fileData;
    try {
      fileData = await parseMultipartFormData(req);
    } catch (parseError) {
      return sendJSON(res, 400, { error: parseError.message });
    }

    const { filename, buffer } = fileData;

    // Validate file size
    if (buffer.length > MAX_ICON_SIZE) {
      return sendJSON(res, 400, { error: 'File size exceeds 100KB limit' });
    }

    // Validate file type
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_ICON_TYPES.includes(ext)) {
      return sendJSON(res, 400, { error: 'File type not allowed. Use PNG, SVG, ICO, or WEBP' });
    }

    // Generate unique ID and filename
    const iconId = crypto.randomUUID();
    const safeFilename = `${iconId}${ext}`;

    // Save file
    await fs.writeFile(path.join(ICONS_DIR, safeFilename), buffer);

    // Add to custom icons list
    const newIcon = {
      id: iconId,
      filename: safeFilename,
      originalName: filename,
      uploadedAt: Date.now()
    };

    existingIcons.push(newIcon);
    await storage.saveCustomIcons(existingIcons);

    sendJSON(res, 200, { icon: newIcon });
  } catch (error) {
    console.error('Upload icon error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
  }
}

/**
 * Handle DELETE /api/icons/:id
 */
async function handleDeleteIcon(req, res, iconId) {
  const authResult = await checkAuthAndCsrf(req);
  if (!authResult.authenticated) {
    return sendJSON(res, 401, { error: 'Unauthorized' });
  }
  if (!authResult.csrfValid) {
    return sendJSON(res, 403, { error: 'Invalid CSRF token', code: 'CSRF_INVALID' });
  }

  try {
    const icons = await storage.getCustomIcons();
    const iconIndex = icons.findIndex(i => i.id === iconId);

    if (iconIndex === -1) {
      return sendJSON(res, 404, { error: 'Icon not found' });
    }

    const icon = icons[iconIndex];

    // Delete the file
    try {
      await fs.unlink(path.join(ICONS_DIR, icon.filename));
    } catch (unlinkError) {
      // File might not exist, continue anyway
      console.log('Could not delete icon file:', unlinkError.message);
    }

    // Remove from list
    icons.splice(iconIndex, 1);
    await storage.saveCustomIcons(icons);

    // Update any links using this icon to revert to favicon
    const data = await storage.readData();
    let linksUpdated = false;
    data.links = data.links.map(link => {
      if (link.iconType === 'custom' && link.iconValue === icon.filename) {
        linksUpdated = true;
        return { ...link, iconType: 'favicon', iconValue: null };
      }
      return link;
    });
    if (linksUpdated) {
      await storage.writeData(data);
    }

    sendJSON(res, 200, { success: true });
  } catch (error) {
    console.error('Delete icon error:', error);
    sendJSON(res, 500, { error: 'Internal server error' });
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
  if (pathname === '/api/csrf' && req.method === 'GET') {
    return handleGetCsrf(req, res);
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
  if (pathname === '/api/links/bulk-tag' && req.method === 'POST') {
    return handleBulkTag(req, res);
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

  // Debug endpoints
  if (pathname === '/api/debug/cache-stats' && req.method === 'GET') {
    return handleCacheStats(req, res);
  }

  // Tag endpoints
  if (pathname === '/api/tags' && req.method === 'GET') {
    return handleGetTags(req, res);
  }
  if (pathname === '/api/tags' && req.method === 'POST') {
    return handleCreateTag(req, res);
  }

  // Tag endpoints with ID parameter
  const tagMatch = pathname.match(/^\/api\/tags\/([a-f0-9-]+)$/i);
  if (tagMatch) {
    const tagId = tagMatch[1];
    if (req.method === 'PUT') {
      return handleUpdateTag(req, res, tagId);
    }
    if (req.method === 'DELETE') {
      return handleDeleteTag(req, res, tagId);
    }
  }

  // Icon endpoints
  if (pathname === '/api/icons' && req.method === 'GET') {
    return handleGetIcons(req, res);
  }
  if (pathname === '/api/icons' && req.method === 'POST') {
    return handleUploadIcon(req, res);
  }

  // Icon endpoints with ID parameter
  const iconMatch = pathname.match(/^\/api\/icons\/([a-f0-9-]+)$/i);
  if (iconMatch) {
    const iconId = iconMatch[1];
    if (req.method === 'DELETE') {
      return handleDeleteIcon(req, res, iconId);
    }
  }

  // 404
  if (!res.headersSent) {
    res.writeHead(404);
    res.end();
  }
}

module.exports = { route };
