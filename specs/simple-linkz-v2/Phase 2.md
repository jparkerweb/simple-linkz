# Phase 2: Performance Layer

**Status:** Complete
**Estimated Tasks:** 22 tasks

## Overview

This phase implements critical performance optimizations: an in-memory favicon cache with 24-hour TTL to reduce external requests by 80%+, a storage cache with debounced writes to reduce disk I/O by 60%+, and frontend rendering optimizations to reduce DOM thrashing by 70%+.

## Prerequisites

- [x] Phase 1 must be complete
- [x] Application runs locally with schema version 1

## Tasks

### Favicon Cache (Backend)

- [x] **Task 2.1:** Create favicon cache data structure in `api.js`
  - File: `src/api.js`
  - At module level, create:
  ```javascript
  const faviconCache = new Map();
  const FAVICON_TTL = 24 * 60 * 60 * 1000; // 24 hours in ms
  const MAX_CACHE_SIZE = 500;
  ```

- [x] **Task 2.2:** Create `getCachedFavicon(url)` helper function
  - File: `src/api.js`
  - Implement function that:
    - Takes a favicon URL as input
    - Returns cached data if exists and not expired
    - Returns `null` if not cached or expired
  ```javascript
  function getCachedFavicon(url) {
    const entry = faviconCache.get(url);
    if (entry && Date.now() - entry.fetchedAt < FAVICON_TTL) {
      return entry.data;
    }
    faviconCache.delete(url); // Clean expired entry
    return null;
  }
  ```

- [x] **Task 2.3:** Create `setCachedFavicon(url, data)` helper function
  - File: `src/api.js`
  - Implement function that:
    - Stores favicon data with timestamp
    - Enforces MAX_CACHE_SIZE using LRU eviction (delete oldest)
  ```javascript
  function setCachedFavicon(url, data) {
    // LRU eviction if at capacity
    if (faviconCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = faviconCache.keys().next().value;
      faviconCache.delete(oldestKey);
    }
    faviconCache.set(url, { data, fetchedAt: Date.now() });
  }
  ```

- [x] **Task 2.4:** Modify `/api/favicon` endpoint to check cache first
  - File: `src/api.js`
  - Find the favicon proxy endpoint handler
  - Before making external fetch, call `getCachedFavicon(url)`
  - If cached, return cached data immediately with appropriate headers
  - Add header `X-Cache: HIT` for debugging

- [x] **Task 2.5:** Modify `/api/favicon` endpoint to populate cache after fetch
  - File: `src/api.js`
  - After successful external favicon fetch
  - Convert response to buffer/base64
  - Call `setCachedFavicon(url, data)` to store
  - Add header `X-Cache: MISS` for debugging

- [x] **Task 2.6:** Add cache statistics endpoint (optional but helpful)
  - File: `src/api.js`
  - Add GET `/api/debug/cache-stats` endpoint (auth required)
  - Return: `{ faviconCacheSize: faviconCache.size, maxSize: MAX_CACHE_SIZE }`
  - This helps verify cache is working

### Storage Cache (Backend)

- [x] **Task 2.7:** Create storage cache variables in `storage.js`
  - File: `src/storage.js`
  - At module level, add:
  ```javascript
  let dataCache = null;
  let writeTimeout = null;
  let pendingWrite = false;
  const WRITE_DELAY = 500; // 500ms debounce
  ```

- [x] **Task 2.8:** Modify `initializeData()` to load data into cache
  - File: `src/storage.js`
  - At end of initialization, store data in `dataCache`
  - Ensure cache is populated before server accepts requests

- [x] **Task 2.9:** Modify `readData()` to return cached data
  - File: `src/storage.js`
  - Replace file read with: `return JSON.parse(JSON.stringify(dataCache))`
  - Return deep copy to prevent mutation issues
  - If `dataCache` is null (shouldn't happen), fallback to file read and populate cache

- [x] **Task 2.10:** Create `writeToDisk()` internal function
  - File: `src/storage.js`
  - Move current atomic write logic into this function
  - This handles the actual temp file + rename pattern
  - Mark `pendingWrite = false` after successful write

- [x] **Task 2.11:** Modify `writeData()` to use debounced writes
  - File: `src/storage.js`
  - Update in-memory cache immediately: `dataCache = JSON.parse(JSON.stringify(data))`
  - Clear existing timeout if any: `if (writeTimeout) clearTimeout(writeTimeout)`
  - Set new timeout: `writeTimeout = setTimeout(() => writeToDisk(dataCache), WRITE_DELAY)`
  - Set `pendingWrite = true`

- [x] **Task 2.12:** Add graceful shutdown handler to flush pending writes
  - File: `src/storage.js`
  - Export a `flushPendingWrites()` function:
  ```javascript
  async function flushPendingWrites() {
    if (writeTimeout) {
      clearTimeout(writeTimeout);
      writeTimeout = null;
    }
    if (pendingWrite) {
      await writeToDisk(dataCache);
    }
  }
  ```

- [x] **Task 2.13:** Wire up graceful shutdown in `server.js`
  - File: `src/server.js`
  - Import `flushPendingWrites` from storage.js
  - Add process handlers:
  ```javascript
  process.on('SIGTERM', async () => {
    await flushPendingWrites();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await flushPendingWrites();
    process.exit(0);
  });
  ```

- [x] **Task 2.14:** Test storage cache behavior
  - Start server, make several quick link updates
  - Verify only one disk write occurs (check file modification time)
  - Stop server with Ctrl+C, verify final state is persisted
  - Restart server, verify all changes are present

### Frontend Rendering Optimizations

- [x] **Task 2.15:** Create debounce utility function in `app.js`
  - File: `public/app.js`
  - Add at module level:
  ```javascript
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  ```

- [x] **Task 2.16:** Create debounced version of `renderLinks()`
  - File: `public/app.js`
  - Find the `renderLinks()` function
  - Create: `const debouncedRenderLinks = debounce(renderLinks, 100)`
  - Do NOT replace all calls yet - identify which calls should be debounced

- [x] **Task 2.17:** Identify render call sites that benefit from debouncing
  - File: `public/app.js`
  - Find all calls to `renderLinks()`
  - Categorize:
    - **Debounce:** Search input typing, rapid state changes
    - **Immediate:** Initial load, after modal close, after link CRUD operations
  - Document findings for next task

- [x] **Task 2.18:** Replace appropriate render calls with debounced version
  - File: `public/app.js`
  - Replace search input handler to use `debouncedRenderLinks()`
  - Keep immediate calls for: initial render, after save/delete operations
  - Test that search still feels responsive but doesn't thrash

- [x] **Task 2.19:** Create batch favicon update function
  - File: `public/app.js`
  - Create function to batch favicon DOM updates:
  ```javascript
  function batchFaviconUpdates(faviconUpdates) {
    // faviconUpdates: Array of {linkId, faviconUrl}
    requestAnimationFrame(() => {
      faviconUpdates.forEach(({ linkId, faviconUrl }) => {
        const img = document.querySelector(`[data-link-id="${linkId}"] .favicon-img`);
        if (img) img.src = faviconUrl;
      });
    });
  }
  ```

- [x] **Task 2.20:** Modify favicon loading to collect updates and batch them
  - File: `public/app.js`
  - Find where favicons are loaded/updated after link rendering
  - Instead of updating DOM immediately for each favicon:
    - Collect all favicon updates into an array
    - Call `batchFaviconUpdates(updates)` once with all updates
  - This reduces layout thrashing

- [x] **Task 2.21:** Add data-link-id attribute to link elements for batch updates
  - File: `public/app.js`
  - In link rendering, ensure each link element has `data-link-id="${link.id}"`
  - This enables efficient DOM selection for batch updates

- [x] **Task 2.22:** Test and verify performance improvements
  - Open browser dev tools Performance tab
  - Record while typing quickly in search box
  - Verify render calls are batched (not one per keystroke)
  - Add 20+ links, verify initial render doesn't cause visible jank
  - Check favicon loading doesn't cause layout shifts

## Acceptance Criteria

- [x] Favicon cache stores responses and returns cached data on repeat requests
- [x] Favicon cache expires entries after 24 hours
- [x] Favicon cache evicts oldest entries when at capacity (500)
- [x] `/api/favicon` returns `X-Cache: HIT` or `MISS` header
- [x] Storage reads return immediately from memory (no file I/O)
- [x] Multiple rapid writes result in single disk write (500ms debounce)
- [x] Server shutdown flushes any pending writes to disk
- [x] No data loss on server restart
- [x] Search typing doesn't trigger render on every keystroke
- [x] Favicon updates don't cause visible layout shifts
- [x] Performance metrics show improvement (dev tools audit)

## Notes

- The favicon cache is in-memory only - it does not persist across server restarts. This is intentional to keep implementation simple.
- The storage cache must handle concurrent reads safely - always return deep copies.
- Be careful with the debounced render - some updates NEED to be immediate (e.g., after user clicks save).
- `requestAnimationFrame` batching is critical for smooth favicon loading.

---

## Phase Completion Summary

**Status:** Complete

**Completed:** 2025-12-06
**Implemented by:** Claude Opus 4.5

### What was done:

Implemented comprehensive performance optimizations across three areas:

1. **Favicon Cache (Backend):** In-memory cache with 24-hour TTL, LRU eviction at 500 entries, and X-Cache headers for debugging. Refactored favicon endpoint to buffer responses for caching instead of streaming.

2. **Storage Cache (Backend):** In-memory data cache with 500ms debounced writes. All reads now return from memory (deep copies to prevent mutation). Added graceful shutdown handlers to flush pending writes on SIGTERM/SIGINT.

3. **Frontend Rendering:** Added debounce utility, debounced search input rendering (100ms), and batch favicon updates using requestAnimationFrame to reduce layout thrashing.

### Files modified:

- `src/api.js` - Added favicon cache (Map), getCachedFavicon/setCachedFavicon helpers, refactored handleFavicon for caching, added handleCacheStats endpoint
- `src/storage.js` - Added dataCache, writeTimeout, pendingWrite variables, modified initializeData/readData/writeData for caching, added writeToDisk and flushPendingWrites functions
- `src/server.js` - Added SIGTERM/SIGINT handlers for graceful shutdown with flushPendingWrites
- `public/app.js` - Added debounce utility, debouncedRenderLinks, batchFaviconUpdates, modified search handler and fetchMissingFavicons for batching

### Issues encountered:

None - all tasks completed as specified.
