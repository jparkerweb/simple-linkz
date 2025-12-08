# Simple Linkz v2.0 - Major Feature Release

**Created:** 2025-12-06
**Status:** Complete
**Confidence:** 90% (Requirements: 25/25, Feasibility: 23/25, Integration: 22/25, Risk: 20/25)

---

## 1. Executive Summary

This release enhances Simple Linkz with improved theming, tagging, icon customization, and security hardening. Features include a flat tagging system, custom theme bundles, self-hosted icon fonts, and custom icon uploads.

---

## 2. Requirements

### 2.1 Functional Requirements

#### Performance Optimizations
- [ ] FR-1: In-memory favicon cache with 24-hour TTL
- [ ] FR-2: Read-through cache for data.json
- [ ] FR-3: Debounced/batched writes to disk (500ms)
- [ ] FR-4: Batched DOM updates for favicon changes
- [ ] FR-5: Debounced renderLinks() calls (100ms)

#### Data Management (Tags)
- [ ] FR-6: Flat tag system - links can have multiple tags
- [ ] FR-7: Filter links by tag
- [ ] FR-8: Bulk tag operations (add/remove tags from multiple links)
- [ ] FR-9: Tag-filtered export

#### Security
- [ ] FR-10: IP-based rate limiting: lock after 5 failed attempts in 15 min
- [ ] FR-11: Exponential backoff on subsequent attempts
- [ ] FR-12: Time-based unlock only (no manual unlock)
- [ ] FR-13: CSRF tokens: per-session generation, required on all mutating requests

#### Customization & Theming
- [ ] FR-14: User-editable CSS variables (border-radius, shadows, fonts, gap, padding)
- [ ] FR-15: Preset theme bundles (Default, Nord, Monokai, Solarized, High Contrast)
- [ ] FR-16: Icon packs: Material Icons + Font Awesome support (self-hosted)
- [ ] FR-17: Searchable icon gallery modal
- [ ] FR-18: Custom icon uploads → shared library in `/data/icons/`
- [ ] FR-19: Per-link icon choice: favicon (auto) OR icon pack OR custom upload

#### Quick Wins
- [ ] FR-27: Mobile: Always-visible edit/delete buttons
- [ ] FR-28: Accessibility: aria-labels on all icon buttons
- [ ] FR-29: PWA: Minimal manifest for "Add to Home Screen"
- [ ] FR-30: Keyboard: `/` shortcut focuses search

#### Implied Requirements
- [ ] FR-20: Tag management UI (create, rename, delete tags)
- [ ] FR-21: Data migration from current schema to new
- [ ] FR-22: Export includes tags and icons
- [ ] FR-23: Import restores tags and icons

### 2.2 Non-Functional Requirements

- [ ] NFR-1: Reduce external favicon requests by 80-90%
- [ ] NFR-2: Reduce disk I/O by 60-75%
- [ ] NFR-3: Reduce DOM re-renders by 70%
- [ ] NFR-4: Backward compatible data migration
- [ ] NFR-5: Maintain single-user security model

### 2.3 Out of Scope

- Multi-user support
- Offline PWA functionality (service worker caching)
- Click tracking / analytics
- Link health checking (dead link detection)
- Browser extension integration

---

## 3. Tech Stack

| Category | Technology | Version | Justification |
|----------|------------|---------|---------------|
| Runtime | Node.js (native HTTP) | Current | Existing, no Express |
| Frontend | Vanilla JavaScript | ES6+ | Existing pattern |
| Styling | Tailwind CSS | Current | Existing pattern |
| Storage | JSON file + memory cache | - | Extend existing |
| Auth | bcrypt + HMAC-SHA256 | Current | Add CSRF layer |
| Icons | Material Icons | Self-hosted | Subset for common icons |
| Icons | Font Awesome Free | Self-hosted | Subset for common icons |

---

## 4. Architecture

### 4.1 Architecture Pattern

**Layered Monolith (Extended)** - Follows existing patterns with new caching layer.

### 4.2 System Context Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         app.js (~2000 lines)                      │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │  │
│  │  │    State    │ │  API Client │ │   Renderer  │ │   Modals    │ │  │
│  │  │  Manager    │ │   Wrapper   │ │   Engine    │ │   Manager   │ │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                 │  │
│  │  │    Tag      │ │   Theme     │ │    Icon     │                 │  │
│  │  │   System    │ │   Engine    │ │   Picker    │                 │  │
│  │  └─────────────┘ └─────────────┘ └─────────────┘                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
                                     │
                                HTTP/REST
                                     │
┌────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                    │
│  ┌─────────────┐                                                       │
│  │  server.js  │ ← Static files, icon files, manifest                  │
│  └──────┬──────┘                                                       │
│         │                                                              │
│  ┌──────▼──────────────────────────────────────────────────────────┐  │
│  │                        api.js                                    │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐                   │  │
│  │  │Rate Limiter│→│   CSRF     │→│   Auth     │→ Route Handler    │  │
│  │  │ Middleware │ │ Middleware │ │ Middleware │                   │  │
│  │  └────────────┘ └────────────┘ └────────────┘                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│         │                                                              │
│  ┌──────▼──────┐                                                       │
│  │  storage.js │ ← Memory cache + JSON persistence                     │
│  └──────┬──────┘                                                       │
│         │                                                              │
│    /data/data.json + /data/icons/*.png                                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Component Overview

| Component | Responsibility | Dependencies |
|-----------|----------------|--------------|
| State Manager | Centralized state, change notifications | None |
| API Client | HTTP calls with CSRF tokens | State Manager |
| Tag System | Tag CRUD, link-tag associations | State, API |
| Theme Engine | CSS variable updates, theme switching | State |
| Icon Picker | Modal for icon selection | State, Modals |
| Renderer | DOM updates, debounced rendering | State |
| Modals Manager | Modal show/hide, form handling | Renderer |
| Rate Limiter | IP tracking, lockout logic | Storage |
| CSRF Handler | Token generation/validation | Auth |
| Favicon Cache | In-memory cache with TTL | None |
| Storage Cache | Read-through cache, batched writes | None |

### 4.4 Data Model

```json
{
  "schemaVersion": 2,
  "sessionSecret": "...",
  "user": { "username": "...", "passwordHash": "..." },
  "sessions": { "token": { "createdAt": 0, "expiresAt": 0 } },
  "csrfTokens": { "sessionToken": "csrfToken" },

  "preferences": {
    "theme": "dark",
    "accentColor": "blue",
    "backgroundColor": "gray",
    "pageTitle": "Simple Linkz",
    "layout": "grid",
    "themeBundle": "default",
    "customCss": {
      "borderRadius": "0.5rem",
      "cardShadow": "0 4px 6px -1px rgba(0,0,0,0.1)",
      "fontFamily": "system-ui",
      "linkGap": "1rem"
    }
  },

  "tags": [
    { "id": "tag-uuid", "name": "Work", "color": "#3B82F6" }
  ],

  "links": [
    {
      "id": "link-uuid",
      "name": "GitHub",
      "url": "https://github.com",
      "order": 0,
      "faviconUrl": "https://...",
      "fallbackEmoji": "🔗",
      "iconType": "favicon",
      "iconValue": null,
      "tags": ["tag-uuid"]
    }
  ],

  "customIcons": [
    { "id": "icon-uuid", "filename": "myicon.png", "uploadedAt": 0 }
  ],

  "rateLimiting": {
    "attempts": { "ip": [{ "timestamp": 0 }] },
    "blocked": { "ip": { "until": 0, "blockCount": 1 } }
  }
}
```

### 4.5 API Design

| Method | Endpoint | Purpose | Auth | CSRF |
|--------|----------|---------|------|------|
| GET | `/api/csrf` | Get CSRF token | Yes | No |
| **Tags** |
| GET | `/api/tags` | List all tags | Yes | No |
| POST | `/api/tags` | Create tag | Yes | Yes |
| PUT | `/api/tags/:id` | Update tag | Yes | Yes |
| DELETE | `/api/tags/:id` | Delete tag | Yes | Yes |
| POST | `/api/links/bulk-tag` | Bulk tag operation | Yes | Yes |
| **Icons** |
| GET | `/api/icons` | List custom icons | Yes | No |
| POST | `/api/icons` | Upload custom icon | Yes | Yes |
| DELETE | `/api/icons/:id` | Delete custom icon | Yes | Yes |
| GET | `/icons/:filename` | Serve icon file | No | No |

---

## 5. Implementation Phases

### Parallelization Strategy

Independent phases should be worked on in parallel where possible to reduce total implementation time:

```
                    ┌─────────────────────┐
                    │  Phase 1: Quick     │
                    │  Wins & Foundation  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
    │ Phase 2:        │ │ Phase 5:    │ │ (can start      │
    │ Performance     │ │ Theme       │ │  reading/prep)  │
    └────────┬────────┘ │ Engine      │ └─────────────────┘
             │          └──────┬──────┘
             ▼                 │
    ┌─────────────────┐        │
    │ Phase 3:        │        │
    │ Security        │        │
    └────────┬────────┘        │
             │                 │
             ▼                 │
    ┌─────────────────┐        │
    │ Phase 4:        │◄───────┘
    │ Tags            │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │ Phase 6:        │
    │ Icons           │
    └─────────────────┘
```

**Parallel Tracks:**
- **Track A:** Phase 1 → Phase 2 → Phase 3 → Phase 4 (core functionality)
- **Track B:** Phase 1 → Phase 5 (theming, can run alongside Track A)
- **Merge Point:** Phase 6 requires both Phase 4 (tags) and Phase 5 (themes)

### Phase 1: Quick Wins & Foundation
**Goal:** Low-effort improvements and preparation for larger changes
**Dependencies:** None

- [ ] Task 1.1: Mobile - Remove hover-only on edit/delete buttons, always show on mobile
- [ ] Task 1.2: Accessibility - Add `aria-label` to all icon-only buttons
- [ ] Task 1.3: Keyboard - Add `/` shortcut to focus search input
- [ ] Task 1.4: PWA - Create `manifest.json` with app metadata
- [ ] Task 1.5: PWA - Add manifest link and meta tags to `index.html`
- [ ] Task 1.6: Schema - Add `schemaVersion: 1` to existing data for migration prep

### Phase 2: Performance Layer
**Goal:** Reduce external requests, disk I/O, and DOM thrashing
**Dependencies:** Phase 1

- [ ] Task 2.1: Favicon cache - Create in-memory Map with 24hr TTL in api.js
- [ ] Task 2.2: Favicon cache - Modify `/api/favicon` to check cache before fetching
- [ ] Task 2.3: Storage cache - Load data.json into memory on server startup
- [ ] Task 2.4: Storage cache - Modify `readData()` to return memory copy
- [ ] Task 2.5: Storage cache - Implement debounced `writeData()` with 500ms batching
- [ ] Task 2.6: Storage cache - Add graceful shutdown to flush pending writes
- [ ] Task 2.7: Frontend - Debounce `renderLinks()` calls (100ms)
- [ ] Task 2.8: Frontend - Batch favicon DOM updates

### Phase 3: Security Hardening
**Goal:** Rate limiting and CSRF protection
**Dependencies:** Phase 2 (storage cache)

- [ ] Task 3.1: Rate limiting - Add `rateLimiting` structure to schema
- [ ] Task 3.2: Rate limiting - Track failed login attempts by IP
- [ ] Task 3.3: Rate limiting - Block IP after 5 failures in 15 minutes
- [ ] Task 3.4: Rate limiting - Implement exponential backoff (15min × 2^n)
- [ ] Task 3.5: Rate limiting - Return retry-after time in error response
- [ ] Task 3.6: CSRF - Generate token on successful login
- [ ] Task 3.7: CSRF - Store tokens in `csrfTokens` map keyed by session
- [ ] Task 3.8: CSRF - Create `/api/csrf` endpoint
- [ ] Task 3.9: CSRF - Add middleware to validate `X-CSRF-Token` header
- [ ] Task 3.10: Frontend - Fetch CSRF token after login
- [ ] Task 3.11: Frontend - Include CSRF header in all POST/PUT/DELETE requests

### Phase 4: Tag System
**Goal:** Flat tagging system with filtering and bulk operations
**Dependencies:** Phase 3 (CSRF required for mutations)

- [ ] Task 4.1: Schema - Add `tags` array to data structure
- [ ] Task 4.2: Schema - Add `tags` array field to link objects
- [ ] Task 4.3: API - Implement GET/POST/PUT/DELETE for `/api/tags`
- [ ] Task 4.4: API - Implement POST `/api/links/bulk-tag`
- [ ] Task 4.5: API - Modify link endpoints to accept/return tags
- [ ] Task 4.6: Frontend - Create tag management modal (CRUD + color picker)
- [ ] Task 4.7: Frontend - Add tag multi-select to link edit modal
- [ ] Task 4.8: Frontend - Add tag filter dropdown to header
- [ ] Task 4.9: Frontend - Implement bulk selection mode with tag operations
- [ ] Task 4.10: Export/Import - Include tags in export JSON
- [ ] Task 4.11: Export/Import - Restore tags on import

### Phase 5: Theme Engine
**Goal:** Custom CSS variables and preset theme bundles
**Dependencies:** Phase 1

- [ ] Task 5.1: CSS - Define custom properties in `:root` (src/input.css)
- [ ] Task 5.2: Schema - Add `customCss` object to preferences
- [ ] Task 5.3: Schema - Add `themeBundle` to preferences
- [ ] Task 5.4: Frontend - Define 5 theme bundle objects (Default, Nord, Monokai, Solarized, High Contrast)
- [ ] Task 5.5: Frontend - Create theme engine to apply CSS variables
- [ ] Task 5.6: Frontend - Add theme bundle dropdown to settings modal
- [ ] Task 5.7: Frontend - Add custom CSS inputs (radius, shadow, font, gap, padding)
- [ ] Task 5.8: Frontend - Implement live preview when adjusting settings

### Phase 6: Icon System
**Goal:** Icon packs and custom icon uploads
**Dependencies:** Phase 4 (tags), Phase 5 (theme engine)

- [ ] Task 6.1: Setup - Download and self-host Material Icons subset
- [ ] Task 6.2: Setup - Download and self-host Font Awesome Free subset
- [ ] Task 6.3: HTML - Load icon font CSS in index.html
- [ ] Task 6.4: Schema - Add `customIcons` array to data
- [ ] Task 6.5: Schema - Add `iconType` and `iconValue` to link objects
- [ ] Task 6.6: API - Implement GET/POST/DELETE for `/api/icons`
- [ ] Task 6.7: Server - Serve static files from `/data/icons/`
- [ ] Task 6.8: Frontend - Create icon gallery modal with tabs (Material, FA, Custom)
- [ ] Task 6.9: Frontend - Add icon search/filter in gallery
- [ ] Task 6.10: Frontend - Add icon type selector to link edit modal
- [ ] Task 6.11: Frontend - Render links based on iconType (favicon/pack/custom)

---

## 6. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Large icon font files slow initial load | Medium | Low | Use subset (common icons only), lazy-load if needed |
| Data migration corrupts existing data | Low | High | Backup before migration, validate schema, atomic writes |
| CSRF token sync issues (stale tokens) | Medium | Medium | Clear token on 403, re-fetch automatically |
| Rate limiting blocks legitimate users | Low | Medium | Log blocked IPs, clear error messages with unlock time |
| Custom icon uploads exceed storage | Low | Low | Limit file size (100KB), limit total icons (50) |
| Import overwrites without confirmation | Medium | High | Show diff preview before import, require explicit confirm |
| Browser memory with large favicon cache | Low | Low | Limit cache size (500 entries), LRU eviction |
| Self-hosted fonts missing icons | Medium | Low | Include common subset, fallback to text labels |

---

## 7. Success Criteria

- [ ] Favicon cache reduces external requests by 80%+
- [ ] Storage I/O reduced by 60%+
- [ ] DOM re-renders reduced by 70%+
- [ ] Rate limiting blocks after 5 failed attempts
- [ ] CSRF protection prevents cross-site mutations
- [ ] Tags can be created, assigned, and filtered
- [ ] All 5 theme bundles apply correctly
- [ ] Custom CSS variables update live
- [ ] Icon picker modal works for Material, Font Awesome, and custom icons
- [ ] Custom icons can be uploaded and assigned to links
- [ ] Export includes all new data (tags, icons)
- [ ] Import restores full state including tags and icon metadata
- [ ] Data migration preserves existing links
- [ ] Mobile edit buttons always visible
- [ ] Keyboard shortcut `/` focuses search
- [ ] PWA "Add to Home Screen" works

---

## 8. Assumptions

1. Single-user model is maintained (no multi-tenancy)
2. All data remains in single JSON file (no database)
3. Docker deployment continues to work with volume mounts
4. BASE_PATH functionality is preserved
5. Existing export files can be imported (backward compatibility)
6. Browser support: modern browsers only (ES6+)
7. Icon font subsets will include most commonly needed icons

---

## 9. File Structure Changes

```
simple-linkz/
├── public/
│   ├── fonts/
│   │   ├── material-icons/          # NEW
│   │   │   ├── MaterialIcons.woff2
│   │   │   └── material-icons.css
│   │   └── fontawesome/             # NEW
│   │       ├── fa-solid-900.woff2
│   │       ├── fa-brands-400.woff2
│   │       └── fontawesome.css
│   ├── manifest.json                # NEW
│   ├── app.js                       # MODIFIED (major)
│   ├── index.html                   # MODIFIED
│   └── styles.css                   # MODIFIED
├── src/
│   ├── api.js                       # MODIFIED
│   ├── auth.js                      # MODIFIED
│   ├── server.js                    # MODIFIED
│   ├── storage.js                   # MODIFIED
│   └── input.css                    # MODIFIED
├── data/
│   ├── data.json                    # MODIFIED (schema v2)
│   └── icons/                       # NEW
└── package.json                     # MODIFIED
```

---

## 10. Technical Specifications

### 10.0 Icon Font Subsets

**Material Icons (80 icons):**
```
Navigation: home, menu, arrow_back, arrow_forward, chevron_left, chevron_right,
            expand_more, expand_less, close, refresh, more_vert, more_horiz
Actions: search, settings, edit, delete, add, remove, check, clear, save,
         download, upload, share, print, launch, open_in_new
Content: link, folder, file_copy, attachment, cloud, image, videocam,
         music_note, article, description, note, bookmark, star, favorite
Communication: email, chat, forum, notifications, phone, message, send,
               alternate_email, contact_mail
Social: person, group, people, public, share, thumb_up, thumb_down
Hardware: computer, laptop, phone_android, tablet, desktop_windows,
          keyboard, mouse, headset, watch, tv
Places: home, work, business, store, school, restaurant, local_cafe
Status: info, warning, error, help, check_circle, cancel, pending,
        visibility, visibility_off, lock, lock_open
Misc: dashboard, analytics, code, terminal, bug_report, build, extension,
      palette, brightness_4, dark_mode, light_mode
```

**Font Awesome Free (80 icons):**
```
Brands: github, gitlab, bitbucket, docker, aws, google, microsoft, apple,
        linux, windows, android, slack, discord, twitter, facebook, linkedin,
        youtube, twitch, reddit, stack-overflow, npm, python, node-js, react,
        angular, vue, js, html5, css3, php, java, rust, golang
Solid: house, gear, magnifying-glass, user, users, envelope, phone, link,
       folder, file, cloud, image, video, music, book, bookmark, star, heart,
       thumbs-up, thumbs-down, check, xmark, plus, minus, pen, trash, download,
       upload, share, print, lock, unlock, key, shield, bug, code, terminal,
       server, database, network-wired, wifi, globe, chart-line, chart-bar
```

**Custom Icons:**
- Max file size: 100KB per icon
- Max total icons: 50
- Supported formats: PNG, SVG, ICO, WEBP
- Stored in: `/data/icons/`

### 10.1 Rate Limiter Algorithm

```javascript
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - (15 * 60 * 1000); // 15 min

  // Check if blocked
  if (blocked[ip] && blocked[ip].until > now) {
    return { allowed: false, retryAfter: blocked[ip].until - now };
  }

  // Count recent attempts
  const recentAttempts = attempts[ip]?.filter(t => t > windowStart) || [];

  if (recentAttempts.length >= 5) {
    const blockCount = (blocked[ip]?.blockCount || 0) + 1;
    const blockDuration = 15 * 60 * 1000 * Math.pow(2, blockCount - 1);
    blocked[ip] = { until: now + blockDuration, blockCount };
    return { allowed: false, retryAfter: blockDuration };
  }

  return { allowed: true };
}
```

### 10.2 Storage Cache

```javascript
let dataCache = null;
let writeTimeout = null;
const WRITE_DELAY = 500;

function readData() {
  return dataCache;
}

function writeData(data) {
  dataCache = data;
  if (writeTimeout) clearTimeout(writeTimeout);
  writeTimeout = setTimeout(() => writeToDisk(dataCache), WRITE_DELAY);
}
```

### 10.3 Favicon Cache

```javascript
const faviconCache = new Map();
const FAVICON_TTL = 24 * 60 * 60 * 1000;
const MAX_CACHE_SIZE = 500;

function getCachedFavicon(url) {
  const entry = faviconCache.get(url);
  if (entry && Date.now() - entry.fetchedAt < FAVICON_TTL) {
    return entry.data;
  }
  return null;
}
```

### 10.4 Theme Bundles (Full Color Definitions)

```javascript
const THEME_BUNDLES = {
  default: {
    name: 'Default',
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f3f4f6',
      '--bg-tertiary': '#e5e7eb',
      '--text-primary': '#111827',
      '--text-secondary': '#6b7280',
      '--text-muted': '#9ca3af',
      '--accent': '#3b82f6',
      '--accent-hover': '#2563eb',
      '--border': '#e5e7eb',
      '--card-bg': '#ffffff',
      '--card-shadow': '0 1px 3px rgba(0,0,0,0.1)'
    },
    dark: {
      '--bg-primary': '#1f2937',
      '--bg-secondary': '#111827',
      '--bg-tertiary': '#374151',
      '--text-primary': '#f9fafb',
      '--text-secondary': '#d1d5db',
      '--text-muted': '#9ca3af',
      '--accent': '#3b82f6',
      '--accent-hover': '#60a5fa',
      '--border': '#374151',
      '--card-bg': '#1f2937',
      '--card-shadow': '0 1px 3px rgba(0,0,0,0.3)'
    }
  },
  nord: {
    name: 'Nord',
    light: {
      '--bg-primary': '#eceff4',
      '--bg-secondary': '#e5e9f0',
      '--bg-tertiary': '#d8dee9',
      '--text-primary': '#2e3440',
      '--text-secondary': '#4c566a',
      '--text-muted': '#7b88a1',
      '--accent': '#5e81ac',
      '--accent-hover': '#81a1c1',
      '--border': '#d8dee9',
      '--card-bg': '#eceff4',
      '--card-shadow': '0 1px 3px rgba(46,52,64,0.1)'
    },
    dark: {
      '--bg-primary': '#2e3440',
      '--bg-secondary': '#3b4252',
      '--bg-tertiary': '#434c5e',
      '--text-primary': '#eceff4',
      '--text-secondary': '#d8dee9',
      '--text-muted': '#7b88a1',
      '--accent': '#88c0d0',
      '--accent-hover': '#8fbcbb',
      '--border': '#4c566a',
      '--card-bg': '#3b4252',
      '--card-shadow': '0 1px 3px rgba(0,0,0,0.3)'
    }
  },
  monokai: {
    name: 'Monokai',
    // Monokai is dark-only theme
    dark: {
      '--bg-primary': '#272822',
      '--bg-secondary': '#1e1f1c',
      '--bg-tertiary': '#3e3d32',
      '--text-primary': '#f8f8f2',
      '--text-secondary': '#cfcfc2',
      '--text-muted': '#75715e',
      '--accent': '#a6e22e',
      '--accent-hover': '#b6f23e',
      '--border': '#49483e',
      '--card-bg': '#3e3d32',
      '--card-shadow': '0 1px 3px rgba(0,0,0,0.4)'
    }
  },
  solarized: {
    name: 'Solarized',
    light: {
      '--bg-primary': '#fdf6e3',
      '--bg-secondary': '#eee8d5',
      '--bg-tertiary': '#ddd6c1',
      '--text-primary': '#657b83',
      '--text-secondary': '#586e75',
      '--text-muted': '#93a1a1',
      '--accent': '#268bd2',
      '--accent-hover': '#2aa198',
      '--border': '#eee8d5',
      '--card-bg': '#fdf6e3',
      '--card-shadow': '0 1px 3px rgba(0,0,0,0.1)'
    },
    dark: {
      '--bg-primary': '#002b36',
      '--bg-secondary': '#073642',
      '--bg-tertiary': '#0a4758',
      '--text-primary': '#839496',
      '--text-secondary': '#93a1a1',
      '--text-muted': '#657b83',
      '--accent': '#2aa198',
      '--accent-hover': '#268bd2',
      '--border': '#073642',
      '--card-bg': '#073642',
      '--card-shadow': '0 1px 3px rgba(0,0,0,0.4)'
    }
  },
  highContrast: {
    name: 'High Contrast',
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f0f0f0',
      '--bg-tertiary': '#e0e0e0',
      '--text-primary': '#000000',
      '--text-secondary': '#1a1a1a',
      '--text-muted': '#404040',
      '--accent': '#0000cc',
      '--accent-hover': '#0000ff',
      '--border': '#000000',
      '--card-bg': '#ffffff',
      '--card-shadow': '0 0 0 2px #000000'
    },
    dark: {
      '--bg-primary': '#000000',
      '--bg-secondary': '#0a0a0a',
      '--bg-tertiary': '#1a1a1a',
      '--text-primary': '#ffffff',
      '--text-secondary': '#e0e0e0',
      '--text-muted': '#a0a0a0',
      '--accent': '#ffff00',
      '--accent-hover': '#ffff66',
      '--border': '#ffffff',
      '--card-bg': '#0a0a0a',
      '--card-shadow': '0 0 0 2px #ffffff'
    }
  }
};
```

### 10.5 Data Migration (v1 → v2)

```javascript
function migrateData(data) {
  if (!data.schemaVersion || data.schemaVersion < 2) {
    data.schemaVersion = 2;
    data.tags = [];
    data.customIcons = [];
    data.csrfTokens = {};
    data.rateLimiting = { attempts: {}, blocked: {} };

    data.preferences.themeBundle = 'default';
    data.preferences.customCss = {
      borderRadius: '0.5rem',
      cardShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      fontFamily: 'system-ui',
      linkGap: '1rem'
    };

    data.links = data.links.map(link => ({
      ...link,
      tags: [],
      iconType: 'favicon',
      iconValue: null
    }));
  }
  return data;
}
```

### 10.6 API Error Responses

```javascript
// Rate Limited
{ "error": "Too many failed attempts", "code": "RATE_LIMITED", "retryAfter": 900000 }

// CSRF Invalid
{ "error": "Invalid CSRF token", "code": "CSRF_INVALID" }

// Validation Error
{ "error": "Tag name is required", "code": "VALIDATION_ERROR", "field": "name" }
```
