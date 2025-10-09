const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const BCRYPT_ROUNDS = 10;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

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

module.exports = {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  signCookie,
  verifyCookie,
  createSession,
  isSessionValid
};
