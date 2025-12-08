const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const storage = require('./storage');

const BCRYPT_ROUNDS = 10;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Rate limiting constants
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;  // 15 minutes
const MAX_ATTEMPTS = 5;
const BASE_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes base

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a random session token
 */
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Sign a cookie value with HMAC-SHA256
 */
function signCookie(value, secret) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('hex');
  return `${value}.${signature}`;
}

/**
 * Verify and extract value from a signed cookie
 */
function verifyCookie(signedValue, secret) {
  if (!signedValue || typeof signedValue !== 'string') {
    return null;
  }

  const parts = signedValue.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [value, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('hex');

  if (signature !== expectedSignature) {
    return null;
  }

  return value;
}

/**
 * Create a new session
 */
function createSession() {
  const token = generateSessionToken();
  const now = Date.now();
  return {
    token,
    session: {
      createdAt: now,
      expiresAt: now + SESSION_DURATION
    }
  };
}

/**
 * Check if a session is valid (not expired)
 */
function isSessionValid(session) {
  if (!session || !session.expiresAt) {
    return false;
  }
  return Date.now() < session.expiresAt;
}

/**
 * Clean old attempts from the array, keeping only those within the window
 */
function cleanOldAttempts(attempts, windowStart) {
  return attempts.filter(timestamp => timestamp > windowStart);
}

/**
 * Check if an IP is rate limited
 */
async function checkRateLimit(ip) {
  const data = await storage.readData();
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  // Check if currently blocked
  const blockInfo = data.rateLimiting.blocked[ip];
  if (blockInfo && blockInfo.until > now) {
    return {
      allowed: false,
      retryAfter: blockInfo.until - now,
      blockCount: blockInfo.blockCount
    };
  }

  // Count recent attempts
  const attempts = data.rateLimiting.attempts[ip] || [];
  const recentAttempts = cleanOldAttempts(attempts, windowStart);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    // Calculate exponential backoff
    const blockCount = (blockInfo?.blockCount || 0) + 1;
    const blockDuration = BASE_BLOCK_DURATION * Math.pow(2, blockCount - 1);

    // Block the IP
    data.rateLimiting.blocked[ip] = {
      until: now + blockDuration,
      blockCount
    };
    data.rateLimiting.attempts[ip] = []; // Clear attempts
    await storage.writeData(data);

    return { allowed: false, retryAfter: blockDuration, blockCount };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt for an IP
 */
async function recordFailedAttempt(ip) {
  const data = await storage.readData();
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!data.rateLimiting.attempts[ip]) {
    data.rateLimiting.attempts[ip] = [];
  }

  data.rateLimiting.attempts[ip] = cleanOldAttempts(
    data.rateLimiting.attempts[ip],
    windowStart
  );
  data.rateLimiting.attempts[ip].push(now);
  await storage.writeData(data);
}

/**
 * Clear rate limit attempts on successful login (but keep blockCount for backoff)
 */
async function clearRateLimitOnSuccess(ip) {
  const data = await storage.readData();
  if (data.rateLimiting.attempts[ip]) {
    data.rateLimiting.attempts[ip] = [];
    await storage.writeData(data);
  }
}

/**
 * Generate a CSRF token for a session
 */
async function generateCsrfToken(sessionToken) {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const data = await storage.readData();
  data.csrfTokens[sessionToken] = csrfToken;
  await storage.writeData(data);
  return csrfToken;
}

/**
 * Validate a CSRF token against the session
 */
async function validateCsrfToken(sessionToken, csrfToken) {
  const data = await storage.readData();
  const expected = data.csrfTokens[sessionToken];
  return expected && expected === csrfToken;
}

/**
 * Clear CSRF token on logout
 */
async function clearCsrfToken(sessionToken) {
  const data = await storage.readData();
  delete data.csrfTokens[sessionToken];
  await storage.writeData(data);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  signCookie,
  verifyCookie,
  createSession,
  isSessionValid,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimitOnSuccess,
  generateCsrfToken,
  validateCsrfToken,
  clearCsrfToken
};
