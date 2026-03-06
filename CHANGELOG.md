# Changelog

All notable changes to Simple Linkz will be documented in this file.

## [1.2.0] - 2026-03-06

### Added

#### Typography Upgrade
- Self-hosted Plus Jakarta Sans (headings) and DM Sans (body) fonts
- New `--sl-font-display` CSS variable for display/heading typography
- Tighter letter-spacing on headings, refined label tracking

#### Toast Notification System
- Lightweight toast notifications for user feedback on all async operations
- Three types: success (green), error (red), info (blue)
- Slide-in/out animations, auto-dismiss after 3 seconds, click to dismiss
- Max 3 visible toasts, stacked bottom-right
- Integrated into: link save/create/delete, settings save, import/export, drag reorder, favicon fetch

#### Modal Animations
- Smooth open/close transitions on all 7 modals (link, settings, tag, edit tag, confirm, icon picker)
- Backdrop fade (200ms) with panel scale + translateY entrance (250ms cubic-bezier)
- Reverse animation on close with guard against double-fire

#### Layout Switch Transitions
- Fade-out/fade-in transition when switching between grid, list, and cards layouts
- 150ms fade out, swap layout, fade in with stagger

#### Drag-and-Drop Visual Feedback
- Dragged element scales to 1.05x with accent-colored shadow
- Position-aware drop indicators (top/bottom border highlight on hovered element)
- Brief scale pulse animation on successful drop
- "Order saved" toast on reorder completion

#### Empty State Enhancement
- SVG link illustration replacing plain text
- Two-line text hierarchy with larger "No links yet" heading
- Clickable "Add your first link" CTA button styled with accent color
- Fade-in animation on render

#### Loading State Indicators
- CSS spinner on save buttons during API calls
- Button disabled during save to prevent double-submission
- "Fetching favicons..." / "Favicons updated" toast feedback

### Fixed

- Import failing when JSON contains legacy named accent colors (e.g., `"pink"` instead of `"#ec4899"`)
- Added `normalizeAccentColor()` to convert legacy named colors to hex on both save and import
- `validThemePresets` list in save/import endpoints was missing 12 of 20 theme presets (added cherry, mocha, teal, blush, sapphire, mint, rose, storm, sunset, olive, paper, graphite)
- Replaced `alert()` calls in import error handling with toast notifications

---

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

[1.2.0]: https://github.com/jparkerweb/simple-linkz/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/jparkerweb/simple-linkz/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/jparkerweb/simple-linkz/releases/tag/v1.0.0
