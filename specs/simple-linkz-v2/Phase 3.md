# Phase 3: Security Hardening

**Status:** Complete
**Estimated Tasks:** 24 tasks

## Overview

This phase implements two critical security features: IP-based rate limiting to prevent brute-force login attacks (lock after 5 failed attempts with exponential backoff), and CSRF token protection for all mutating API requests.

## Prerequisites

- [x] Phase 2 must be complete (storage cache required for rate limit persistence)
- [x] Application runs locally with working storage cache

## Tasks

### Rate Limiting Schema

- [x] **Task 3.1:** Add rate limiting data structure to schema
  - File: `src/storage.js`
  - In `initializeData()` or default data structure, add:
  ```javascript
  rateLimiting: {
    attempts: {},   // { "ip": [timestamp1, timestamp2, ...] }
    blocked: {}     // { "ip": { until: timestamp, blockCount: number } }
  }
  ```
  - Ensure this is included in new installations

- [x] **Task 3.2:** Add rateLimiting to existing data on load (migration)
  - File: `src/storage.js`
  - In data loading logic, if `rateLimiting` is missing, add empty structure
  - This handles upgrade of existing installations

### Rate Limiting Implementation

- [x] **Task 3.3:** Create rate limit constants in `auth.js`
  - File: `src/auth.js`
  - Add at module level:
  ```javascript
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000;  // 15 minutes
  const MAX_ATTEMPTS = 5;
  const BASE_BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes base
  ```

- [x] **Task 3.4:** Create `cleanOldAttempts(attempts, windowStart)` helper
  - File: `src/auth.js`
  - Filter array to only keep timestamps after windowStart
  - Return cleaned array

- [x] **Task 3.5:** Create `checkRateLimit(ip)` function
  - File: `src/auth.js`
  - Export this function
  - Implementation:
  ```javascript
  function checkRateLimit(ip) {
    const data = readData();
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
      writeData(data);

      return { allowed: false, retryAfter: blockDuration, blockCount };
    }

    return { allowed: true };
  }
  ```

- [x] **Task 3.6:** Create `recordFailedAttempt(ip)` function
  - File: `src/auth.js`
  - Export this function
  - Add current timestamp to attempts array for IP
  - Clean old attempts while adding new one
  ```javascript
  function recordFailedAttempt(ip) {
    const data = readData();
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
    writeData(data);
  }
  ```

- [x] **Task 3.7:** Create `clearRateLimitOnSuccess(ip)` function
  - File: `src/auth.js`
  - Export this function
  - Clear attempts for IP on successful login (but keep blockCount for backoff)
  ```javascript
  function clearRateLimitOnSuccess(ip) {
    const data = readData();
    if (data.rateLimiting.attempts[ip]) {
      data.rateLimiting.attempts[ip] = [];
      writeData(data);
    }
  }
  ```

- [x] **Task 3.8:** Create helper to extract client IP from request
  - File: `src/api.js` or `src/auth.js`
  - Handle proxied requests:
  ```javascript
  function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress;
  }
  ```

- [x] **Task 3.9:** Integrate rate limiting into login endpoint
  - File: `src/api.js`
  - In the login handler, BEFORE checking credentials:
    - Call `checkRateLimit(getClientIP(req))`
    - If not allowed, return 429 with error response
  - On failed login, call `recordFailedAttempt(ip)`
  - On successful login, call `clearRateLimitOnSuccess(ip)`

- [x] **Task 3.10:** Format rate limit error response correctly
  - File: `src/api.js`
  - Return proper 429 status with JSON body:
  ```javascript
  {
    error: "Too many failed attempts",
    code: "RATE_LIMITED",
    retryAfter: retryAfterMs
  }
  ```
  - Also set `Retry-After` header (in seconds): `res.setHeader('Retry-After', Math.ceil(retryAfterMs / 1000))`

### CSRF Token Implementation

- [x] **Task 3.11:** Add CSRF tokens structure to schema
  - File: `src/storage.js`
  - In default data structure, add: `csrfTokens: {}`
  - Structure: `{ "sessionToken": "csrfToken" }`
  - Add to existing data on load if missing

- [x] **Task 3.12:** Create `generateCsrfToken(sessionToken)` function
  - File: `src/auth.js`
  - Export this function
  - Generate random token and store mapped to session:
  ```javascript
  function generateCsrfToken(sessionToken) {
    const csrfToken = crypto.randomBytes(32).toString('hex');
    const data = readData();
    data.csrfTokens[sessionToken] = csrfToken;
    writeData(data);
    return csrfToken;
  }
  ```

- [x] **Task 3.13:** Create `validateCsrfToken(sessionToken, csrfToken)` function
  - File: `src/auth.js`
  - Export this function
  - Look up expected token and compare:
  ```javascript
  function validateCsrfToken(sessionToken, csrfToken) {
    const data = readData();
    const expected = data.csrfTokens[sessionToken];
    return expected && expected === csrfToken;
  }
  ```

- [x] **Task 3.14:** Create `clearCsrfToken(sessionToken)` function
  - File: `src/auth.js`
  - Export this function
  - Remove CSRF token on logout:
  ```javascript
  function clearCsrfToken(sessionToken) {
    const data = readData();
    delete data.csrfTokens[sessionToken];
    writeData(data);
  }
  ```

- [x] **Task 3.15:** Add `/api/csrf` endpoint
  - File: `src/api.js`
  - GET `/api/csrf` - requires valid session (auth middleware)
  - Returns current CSRF token for session, generating new one if needed:
  ```javascript
  // In route handler for GET /api/csrf
  const sessionToken = extractSessionToken(req);
  let csrfToken = data.csrfTokens[sessionToken];
  if (!csrfToken) {
    csrfToken = generateCsrfToken(sessionToken);
  }
  return { csrfToken };
  ```

- [x] **Task 3.16:** Create CSRF validation middleware
  - File: `src/api.js`
  - Create function that validates CSRF token for mutating requests:
  ```javascript
  function validateCsrf(req, sessionToken) {
    const method = req.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true; // No CSRF check for safe methods
    }

    const csrfToken = req.headers['x-csrf-token'];
    if (!csrfToken) {
      return false;
    }

    return validateCsrfToken(sessionToken, csrfToken);
  }
  ```

- [x] **Task 3.17:** Integrate CSRF middleware into auth flow
  - File: `src/api.js`
  - In the auth middleware, after validating session:
  - Call `validateCsrf(req, sessionToken)`
  - If invalid, return 403 with error:
  ```javascript
  { error: "Invalid CSRF token", code: "CSRF_INVALID" }
  ```

- [x] **Task 3.18:** Modify logout endpoint to clear CSRF token
  - File: `src/api.js`
  - In logout handler, after invalidating session:
  - Call `clearCsrfToken(sessionToken)`

- [x] **Task 3.19:** Generate CSRF token on successful login
  - File: `src/api.js`
  - In login success handler, after creating session:
  - Call `generateCsrfToken(sessionToken)`
  - Include CSRF token in login response:
  ```javascript
  { success: true, csrfToken: generatedCsrfToken }
  ```

### Frontend CSRF Integration

- [x] **Task 3.20:** Store CSRF token in app state
  - File: `public/app.js`
  - Add `csrfToken` to application state
  - On login success, store token from response
  - On page load (if already logged in), fetch from `/api/csrf`

- [x] **Task 3.21:** Create function to fetch CSRF token after login
  - File: `public/app.js`
  - Create `fetchCsrfToken()` async function:
  ```javascript
  async function fetchCsrfToken() {
    const response = await fetch(`${BASE_PATH}/api/csrf`, {
      credentials: 'include'
    });
    if (response.ok) {
      const data = await response.json();
      state.csrfToken = data.csrfToken;
    }
  }
  ```
  - Call this on app init if user appears logged in

- [x] **Task 3.22:** Modify API client to include CSRF header
  - File: `public/app.js`
  - Find or create the API wrapper functions
  - For POST, PUT, DELETE requests, add header:
  ```javascript
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': state.csrfToken
  }
  ```

- [x] **Task 3.23:** Handle CSRF token expiration/invalidity
  - File: `public/app.js`
  - In API error handling, check for CSRF_INVALID error code
  - If received, fetch new CSRF token and retry request once:
  ```javascript
  if (response.status === 403) {
    const error = await response.json();
    if (error.code === 'CSRF_INVALID') {
      await fetchCsrfToken();
      // Retry the original request
      return retryRequest(...);
    }
  }
  ```

- [x] **Task 3.24:** Test complete security flow
  - Test rate limiting:
    - Attempt 5 failed logins, verify 6th is blocked
    - Wait 15 minutes (or modify constant for testing), verify unblock
    - After unblock, 5 more failures should block for 30 minutes (exponential)
  - Test CSRF:
    - Make POST/PUT/DELETE without X-CSRF-Token header, verify 403
    - Make requests with valid token, verify success
    - Clear cookies, verify CSRF token becomes invalid
    - Login again, verify new token works

## Acceptance Criteria

- [x] Rate limiting blocks IP after 5 failed login attempts in 15 minutes
- [x] Rate limited response includes `retryAfter` time in milliseconds
- [x] Rate limited response sets `Retry-After` HTTP header
- [x] Exponential backoff doubles block time on repeated blocks (15min, 30min, 60min, etc.)
- [x] Successful login clears attempt counter
- [x] CSRF token is generated on login and returned in response
- [x] GET `/api/csrf` returns current CSRF token
- [x] POST/PUT/DELETE requests without `X-CSRF-Token` header return 403
- [x] POST/PUT/DELETE requests with valid token succeed
- [x] Frontend automatically includes CSRF token in mutating requests
- [x] Frontend automatically refetches CSRF token on 403/CSRF_INVALID
- [x] Logout clears CSRF token

## Notes

- Rate limiting uses IP address which can be problematic behind NAT. This is acceptable for single-user deployment.
- The `x-forwarded-for` header handling is important for reverse proxy deployments.
- CSRF tokens are tied to sessions - when session expires, CSRF token is implicitly invalid.
- The exponential backoff has no maximum - in practice, blocks will be very long after repeated abuse.
- Consider logging blocked IPs for monitoring (but don't log in data.json to avoid bloat).

---

## Phase Completion Summary

**Completed:** 2025-12-07
**Implemented by:** Claude Opus 4.5

### What was done:

Implemented comprehensive security hardening with two major features:
1. **IP-based Rate Limiting**: Blocks IPs after 5 failed login attempts within 15 minutes, with exponential backoff for repeated offenses (15min, 30min, 60min, etc.). Supports reverse proxy headers (`x-forwarded-for`).
2. **CSRF Token Protection**: All mutating API requests (POST, PUT, DELETE) now require a valid `X-CSRF-Token` header. Tokens are generated on login, validated on each request, and cleared on logout.

### Files created/modified:

- `src/storage.js` - Added `rateLimiting` and `csrfTokens` to default schema and migration logic for existing installations
- `src/auth.js` - Added rate limiting functions (`checkRateLimit`, `recordFailedAttempt`, `clearRateLimitOnSuccess`) and CSRF functions (`generateCsrfToken`, `validateCsrfToken`, `clearCsrfToken`)
- `src/api.js` - Added `getClientIP` helper, `/api/csrf` endpoint, CSRF validation middleware, integrated rate limiting and CSRF into login/logout and all protected POST endpoints
- `public/app.js` - Added `csrfToken` to state, `fetchCsrfToken()` function, modified all POST API calls to include `X-CSRF-Token` header, added CSRF retry logic on 403, displays user-friendly rate limit messages

### Issues encountered:

None - implementation followed the spec exactly.
