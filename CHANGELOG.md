# Changelog

All notable changes to Simple Linkz will be documented in this file.

## [1.1.0] - 2025-12-07

### Added

#### Tag System

- Flat tagging system for organizing links with custom colored tags
- Tag filter dropdown in header to filter links by tag
- Tag management modal (create, edit, delete tags)
- Bulk tag operations (add/remove tags from multiple links)
- Tags included in import/export with intelligent merging

#### Icon System

- Icon picker modal with tabs for different icon sources
- Material Icons support (self-hosted, ~80 common icons)
- Font Awesome support (Solid + Brands, self-hosted)
- Custom icon uploads (PNG, SVG, ICO, WEBP, max 100KB, limit 50)
- Links can use favicon (auto), Material, Font Awesome, or custom icons

#### Theme Enhancements

- 20 background colors (10 light tones, 10 dark tones)
- 8 accent colors (blue, green, purple, red, orange, pink, cyan, yellow)
- Custom CSS properties (border radius, card shadow, font family, link gap, widget padding)
- Live preview in settings modal

#### Security Hardening

- IP-based rate limiting (5 failed attempts per 15 minutes)
- Exponential backoff for repeated offenses (15min → 30min → 60min → ...)
- CSRF token protection for all mutating API requests
- `X-Forwarded-For` header support for reverse proxy deployments

#### Performance Optimizations

- In-memory favicon cache with 24-hour TTL (reduces external requests by 80%+)
- Storage cache with debounced writes (reduces disk I/O by 60%+)
- Graceful shutdown handlers to flush pending writes
- Frontend rendering optimizations (debounced search, batch favicon updates)

#### PWA Support

- Web app manifest (`manifest.json`)
- PWA icons (192x192 and 512x512)
- PWA meta tags for mobile browsers
- "Add to Home Screen" capability

#### Accessibility & UX

- `aria-label` attributes on all icon-only buttons
- Keyboard shortcut: `/` to focus search input
- Edit/delete buttons always visible on mobile (no hover required)
- Schema versioning for future data migrations

### Changed

- Expanded accent color options from 5 to 8
- Background colors now theme-aware (different palettes for light/dark)
- Settings modal reorganized with new sections for tags, icons, and custom CSS
- API responses now include CSRF token on login
- Export format now includes tags and link-tag associations

### API

#### New Endpoints

- `GET /api/csrf` - Get CSRF token for session
- `GET /api/tags` - List all tags
- `POST /api/tags` - Create new tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag (removes from all links)
- `POST /api/links/bulk-tag` - Bulk add/remove tags from links
- `GET /api/icons` - List custom icons
- `POST /api/icons` - Upload custom icon
- `DELETE /api/icons/:id` - Delete custom icon
- `GET /api/debug/cache-stats` - View favicon cache statistics

#### Modified Endpoints

- All `POST`, `PUT`, `DELETE` endpoints now require `X-CSRF-Token` header
- `POST /api/links` - Now accepts optional `tags` and `iconType`/`iconValue` fields
- `PUT /api/links/:id` - Now accepts optional `tags` and `iconType`/`iconValue` fields
- `GET /api/links` - Response now includes `tags`, `iconType`, `iconValue` for each link
- `POST /api/login` - Response now includes `csrfToken`
- `GET /api/export` - Export now includes `tags` array
- `POST /api/import` - Import now handles `tags` with intelligent merging

### Data Schema

New fields added to `data.json`:

- `schemaVersion` - Schema version for migrations (currently `1`)
- `tags` - Array of tag objects `{ id, name, color }`
- `customIcons` - Array of uploaded icons `{ id, filename, uploadedAt }`
- `csrfTokens` - Map of session tokens to CSRF tokens
- `rateLimiting` - Rate limit tracking `{ attempts, blocked }`
- `preferences.customCss` - Custom CSS property overrides

New fields on link objects:

- `tags` - Array of tag IDs
- `iconType` - Icon source (`favicon`, `material`, `fontawesome`, `custom`)
- `iconValue` - Icon identifier (icon name or custom filename)

---

## [1.0.0] - 2025-11-01

### Added

#### Core Features

- Beautiful dashboard with three layout options (grid, list, cards)
- Secure authentication with bcrypt password hashing
- HMAC-SHA256 signed session cookies with 7-day expiration
- HttpOnly, SameSite=Strict cookie security

#### Link Management

- Add, edit, and delete links with name and URL
- Emoji support in link names
- Automatic favicon fetching for links
- Drag-and-drop link reordering with visual feedback
- Real-time search filtering

#### Customization

- Dark/light theme toggle
- 5 accent colors (blue, green, purple, red, orange)
- Theme-specific background colors
- Custom page title editing

#### Data Management

- JSON file-based storage (`data/data.json`)
- Atomic writes using temp file + rename pattern
- Import/export functionality for backup and restore
- Merge or replace options on import

#### Deployment

- Docker support with official image
- Docker Compose configuration
- Environment variable configuration (PORT, SESSION_SECRET, DATA_DIR)
- Reverse proxy support with BASE_PATH for subpath serving

#### Technical

- Vanilla JavaScript frontend (no framework dependencies)
- Native Node.js HTTP server (no Express)
- Tailwind CSS for styling
- Single-user design optimized for self-hosting
- Minimal dependencies (bcryptjs only)

### Security

- Password hashing with bcrypt (10 salt rounds)
- Auto-generated session secrets
- Session validation on each request
- Input validation on all API endpoints

---

[1.1.0]: https://github.com/jparkerweb/simple-linkz/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jparkerweb/simple-linkz/releases/tag/v1.0.0
