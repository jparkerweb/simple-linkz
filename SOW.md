# Simple Linkz - Statement of Work & Implementation Plan

## Project Overview

**Simple Linkz** is a lightweight, self-hosted web application that serves as a beautiful dashboard for curating and managing frequently visited links. It's designed for individual users who want a personalized jumping-off point for web browsing.

### Key Characteristics
- **Single-user application** (self-hosted)
- **Minimal dependencies** (vanilla JavaScript, native Node.js)
- **Containerized deployment** (Docker)
- **File-based storage** (JSON)
- **Beautiful UI** (Tailwind CSS)

---

## Requirements Summary

### Functional Requirements
1. **Link Management**: Add, edit, delete, and reorder links via drag-and-drop
2. **Multiple Layouts**: Grid, list, and cards view with saved preference
3. **Search**: Filter links by name or URL
4. **Authentication**: Simple login with hashed passwords
5. **First-run Setup**: Prompt for credentials on initial launch
6. **Preferences**: Theme (light/dark), accent colors, layout mode
7. **Import/Export**: Backup and restore links and preferences
8. **Favicon Support**: Automatic favicon fetching with emoji fallback

### Non-Functional Requirements
- **Performance**: Lightweight, fast load times
- **Security**: Bcrypt password hashing, signed cookies
- **Simplicity**: Minimal codebase, easy to understand
- **Persistence**: Docker volume for data storage
- **Maintainability**: Modular architecture

---

## Technology Stack

### Frontend
- **HTML5** - Semantic structure
- **Tailwind CSS** - Utility-first styling (CLI build)
- **Vanilla JavaScript** - No frameworks, pure ES6+

### Backend
- **Node.js 20** - Native HTTP server (no Express)
- **bcryptjs** - Password hashing (pure JS, no native bindings)
- **Native modules**: `http`, `fs`, `crypto`, `path`, `https`

### Storage
- **JSON file** - `/data/data.json` (single file for all data)

### Deployment
- **Docker** - Alpine-based Node.js container
- **Volume mount** - `/data` directory for persistence
- **Port**: 3000 (configurable via ENV)

### Build Tools
- **npm** - Package management
- **Tailwind CLI** - CSS compilation

---

## Architecture Design

### Recommended Pattern: **Modular Separation**

Clean separation of concerns with distinct modules for storage, authentication, API, and server logic.

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                Docker Container                      │
│  ┌───────────────────────────────────────────────┐  │
│  │         Node.js HTTP Server (server.js)       │  │
│  │  ┌─────────────────┐  ┌──────────────────┐   │  │
│  │  │  Static Files   │  │   API Router     │   │  │
│  │  │  (HTML/JS/CSS)  │  │   (api.js)       │   │  │
│  │  └─────────────────┘  └──────────────────┘   │  │
│  │           │                    │               │  │
│  │           │          ┌─────────┴────────┐     │  │
│  │           │          │                  │     │  │
│  │           │    ┌─────▼──────┐   ┌──────▼────┐│  │
│  │           │    │  Auth      │   │  Storage  ││  │
│  │           │    │  (auth.js) │   │(storage.js││  │
│  │           │    └────────────┘   └──────┬────┘│  │
│  │           │                             │     │  │
│  └───────────┼─────────────────────────────┼─────┘  │
│              │                             │        │
│              │                             ▼        │
│              │                  ┌──────────────────┐│
│              │                  │  /data/data.json ││
│              │                  │  (Docker Volume) ││
│              │                  └──────────────────┘│
└──────────────┼──────────────────────────────────────┘
               │
               ▼
       User Browser (HTTPS)
```

### Core Components

#### 1. Server (src/server.js)
**Responsibility**: HTTP server, routing, static file serving

**Key Functions**:
- Initialize HTTP server on port 3000
- Route API requests to `api.js`
- Serve static files (HTML, JS, CSS)
- Handle 404 errors
- Request logging

**Routes**:
```
GET  /                  → public/index.html
GET  /app.js            → public/app.js
GET  /styles.css        → public/styles.css
ALL  /api/*             → api.route(req, res)
ALL  *                  → 404 Not Found
```

#### 2. Storage (src/storage.js)
**Responsibility**: JSON file operations, data persistence

**Key Functions**:
```javascript
initializeData()              // Create data.json with defaults
readData()                    // Read and parse JSON
writeData(data)               // Atomic write to JSON
getUser()                     // Get user credentials
setUser(username, hash)       // Save user credentials
getLinks()                    // Get all links
saveLinks(links)              // Save links array
getPreferences()              // Get user preferences
savePreferences(prefs)        // Save preferences
getSessionSecret()            // Get or generate session secret
getSessions()                 // Get active sessions
saveSessions(sessions)        // Save sessions
```

**Data File Location**: `/data/data.json`

#### 3. Authentication (src/auth.js)
**Responsibility**: Password hashing, session management, cookie signing

**Key Functions**:
```javascript
hashPassword(password)              // Bcrypt hash (10 rounds)
verifyPassword(password, hash)      // Verify bcrypt hash
generateSessionToken()              // Crypto random 32 bytes
signCookie(value, secret)           // HMAC-SHA256 signature
verifyCookie(signedValue, secret)   // Verify signature
createSession()                     // Create session with expiration
isSessionValid(session)             // Check expiration
```

**Security Features**:
- Bcrypt with 10 salt rounds
- HMAC-SHA256 signed cookies
- HttpOnly, SameSite=Strict cookies
- 7-day session expiration
- Auto-generated session secret (256-bit)

#### 4. API (src/api.js)
**Responsibility**: Handle all API endpoints

**Endpoints**:
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/setup/check | No | Check if setup needed |
| POST | /api/setup | No | Create initial user |
| POST | /api/login | No | Authenticate user |
| POST | /api/logout | Yes | Clear session |
| GET | /api/links | Yes | Get all links |
| POST | /api/links | Yes | Save links |
| GET | /api/preferences | Yes | Get preferences |
| POST | /api/preferences | Yes | Save preferences |
| GET | /api/export | Yes | Export data as JSON |
| POST | /api/import | Yes | Import data from JSON |
| GET | /api/favicon?url=... | Yes | Proxy favicon fetch |

#### 5. Frontend (public/app.js)
**Responsibility**: SPA logic, state management, UI rendering

**State Management**:
```javascript
const state = {
  links: [],
  preferences: { layout: 'grid', theme: 'dark', accentColor: 'blue' },
  searchQuery: '',
  editingLink: null
};
```

**Core Features**:
- API client wrapper functions
- Dynamic rendering based on layout preference
- Drag-and-drop reordering
- Modal management (link CRUD, settings)
- Search/filter logic
- Theme switching

---

## Data Schema

### data.json Structure
```json
{
  "sessionSecret": "auto-generated-64-char-hex-string",
  "user": {
    "username": "admin",
    "passwordHash": "$2a$10$..."
  },
  "preferences": {
    "layout": "grid",
    "theme": "dark",
    "accentColor": "blue"
  },
  "links": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "GitHub 🐙",
      "url": "https://github.com",
      "order": 0,
      "faviconUrl": "https://github.com/favicon.ico"
    }
  ],
  "sessions": {
    "a1b2c3d4...": {
      "createdAt": 1696780800000,
      "expiresAt": 1697385600000
    }
  }
}
```

### Data Types

**Link**:
```typescript
{
  id: string,           // UUID v4
  name: string,         // Max 100 chars, can include emojis
  url: string,          // Valid HTTP/HTTPS URL
  order: number,        // Integer >= 0
  faviconUrl?: string   // Optional cached favicon URL
}
```

**Preferences**:
```typescript
{
  layout: 'grid' | 'list' | 'cards',
  theme: 'light' | 'dark',
  accentColor: 'blue' | 'green' | 'purple' | 'red' | 'orange'
}
```

**User**:
```typescript
{
  username: string,      // 3-50 chars
  passwordHash: string   // Bcrypt hash
}
```

**Session**:
```typescript
{
  createdAt: number,     // Unix timestamp (ms)
  expiresAt: number      // Unix timestamp (ms)
}
```

---

## API Specification

### Request/Response Formats

All requests and responses use `Content-Type: application/json` unless otherwise specified.

#### GET /api/setup/check
**Description**: Check if initial setup is required

**Response**:
```json
{ "needsSetup": true }
```

#### POST /api/setup
**Description**: Create initial user account

**Request**:
```json
{
  "username": "admin",
  "password": "securepassword123"
}
```

**Validation**:
- Username: 3-50 characters
- Password: Minimum 8 characters

**Response**:
```json
{ "success": true }
```

**Error Response**:
```json
{ "success": false, "error": "Username must be 3-50 characters" }
```

#### POST /api/login
**Description**: Authenticate user and create session

**Request**:
```json
{
  "username": "admin",
  "password": "securepassword123"
}
```

**Response**:
```json
{ "success": true }
```

**Headers** (on success):
```
Set-Cookie: session=TOKEN.SIGNATURE; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800
```

**Error Response**:
```json
{ "success": false, "error": "Invalid credentials" }
```

#### POST /api/logout
**Description**: Clear session and logout

**Auth**: Required

**Response**:
```json
{ "success": true }
```

**Headers**:
```
Set-Cookie: session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0
```

#### GET /api/links
**Description**: Get all links sorted by order

**Auth**: Required

**Response**:
```json
{
  "links": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "GitHub 🐙",
      "url": "https://github.com",
      "order": 0,
      "faviconUrl": "https://github.com/favicon.ico"
    }
  ]
}
```

#### POST /api/links
**Description**: Save entire links array

**Auth**: Required

**Request**:
```json
{
  "links": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "GitHub 🐙",
      "url": "https://github.com",
      "order": 0
    }
  ]
}
```

**Validation**:
- Each link must have: id, name, url, order
- URL must be valid HTTP/HTTPS
- Order must be non-negative integer
- IDs must be unique

**Response**:
```json
{ "success": true }
```

#### GET /api/preferences
**Description**: Get user preferences

**Auth**: Required

**Response**:
```json
{
  "preferences": {
    "layout": "grid",
    "theme": "dark",
    "accentColor": "blue"
  }
}
```

#### POST /api/preferences
**Description**: Save user preferences

**Auth**: Required

**Request**:
```json
{
  "preferences": {
    "layout": "cards",
    "theme": "light",
    "accentColor": "green"
  }
}
```

**Validation**:
- layout: Must be 'grid', 'list', or 'cards'
- theme: Must be 'light' or 'dark'
- accentColor: Must be 'blue', 'green', 'purple', 'red', or 'orange'

**Response**:
```json
{ "success": true }
```

#### GET /api/export
**Description**: Export links and preferences (excludes credentials)

**Auth**: Required

**Response**:
```json
{
  "links": [...],
  "preferences": {...}
}
```

**Headers**:
```
Content-Disposition: attachment; filename=simple-linkz-export.json
```

#### POST /api/import
**Description**: Import links and preferences

**Auth**: Required

**Request**:
```json
{
  "links": [...],
  "preferences": {...}
}
```

**Validation**: Same as individual endpoints

**Response**:
```json
{ "success": true }
```

#### GET /api/favicon?url=https://example.com
**Description**: Proxy favicon fetch to avoid CORS

**Auth**: Required

**Response**: Image data or 404

**Logic**:
1. Parse domain from URL
2. Fetch `https://domain/favicon.ico`
3. 5-second timeout
4. Return image or 404
5. Optionally cache in link object

---

## File Structure

```
simple-linkz/
├── .dockerignore
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
├── tailwind.config.js
├── README.md
├── SOW.md                     # This file
├── data/                      # Git-ignored, Docker volume
│   └── data.json             # Created at runtime
├── src/
│   ├── input.css             # Tailwind source (~10 lines)
│   ├── server.js             # HTTP server (~150 lines)
│   ├── storage.js            # JSON operations (~200 lines)
│   ├── auth.js               # Auth logic (~100 lines)
│   └── api.js                # API endpoints (~400 lines)
└── public/
    ├── index.html            # SPA structure (~200 lines)
    ├── app.js                # Frontend logic (~600 lines)
    └── styles.css            # Generated by Tailwind
```

---

## Docker Configuration

### Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY public/ ./public/
COPY tailwind.config.js ./
COPY src/input.css ./src/

# Build Tailwind CSS
RUN npm install tailwindcss && \
    npx tailwindcss -i ./src/input.css -o ./public/styles.css --minify && \
    npm uninstall tailwindcss

RUN mkdir -p /data

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "src/server.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  simple-linkz:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/data
    environment:
      - PORT=3000
      - SESSION_SECRET=${SESSION_SECRET:-}
    restart: unless-stopped
```

### Volume Configuration
- **Host**: `./data`
- **Container**: `/data`
- **Contents**: `data.json` (auto-created)
- **Persistence**: Survives container restarts

---

## Security Considerations

### Password Security
- **Hashing**: bcryptjs with 10 salt rounds
- **Minimum length**: 8 characters
- **Storage**: Only hash stored, never plaintext

### Session Security
- **Token generation**: 32-byte crypto.randomBytes
- **Cookie signing**: HMAC-SHA256 with session secret
- **Cookie flags**: HttpOnly, SameSite=Strict
- **Expiration**: 7 days, checked on each request
- **Secret**: Auto-generated 256-bit, stored in data.json

### Input Validation
- **All API inputs** validated before processing
- **URL validation** before favicon fetching
- **Enum validation** for preferences
- **Length limits** on username/password

### Attack Mitigations
- **XSS**: HttpOnly cookies prevent JavaScript access
- **CSRF**: SameSite=Strict prevents cross-site requests
- **Session hijacking**: Signed cookies prevent tampering
- **SQL injection**: N/A (no SQL database)
- **Directory traversal**: Static file serving limited to /public

---

## Implementation Plan

### Phase 1: Foundation & Setup
- [x] Initialize npm project (`npm init -y`)
- [x] Install bcryptjs (`npm install bcryptjs`)
- [x] Install Tailwind as dev dependency (`npm install -D tailwindcss`)
- [x] Create tailwind.config.js with custom colors
- [x] Create src/input.css with Tailwind directives
- [x] Add build scripts to package.json
- [x] Create .gitignore (node_modules/, data/, public/styles.css)
- [x] Create .dockerignore (node_modules/, data/, .git/)
- [x] Create Dockerfile
- [x] Create docker-compose.yml

### Phase 2: Backend - Storage Layer
- [x] Create src/storage.js module
- [x] Implement initializeData() with default structure and session secret generation
- [x] Implement readData() with JSON parsing and error handling
- [x] Implement writeData() with atomic write (temp file + rename)
- [x] Implement getUser() and setUser() helpers
- [x] Implement getLinks() and saveLinks() helpers
- [x] Implement getPreferences() and savePreferences() helpers
- [x] Implement getSessionSecret() helper
- [x] Implement getSessions() and saveSessions() helpers
- [x] Test storage module standalone with sample data

### Phase 3: Backend - Auth Layer
- [x] Create src/auth.js module
- [x] Implement hashPassword() using bcryptjs (10 rounds)
- [x] Implement verifyPassword() using bcryptjs
- [x] Implement generateSessionToken() with crypto.randomBytes(32)
- [x] Implement signCookie() with HMAC-SHA256
- [x] Implement verifyCookie() with signature verification
- [x] Implement createSession() with 7-day expiration
- [x] Implement isSessionValid() checking expiration timestamp
- [x] Test auth module standalone (hash/verify, sign/verify)

### Phase 4: Backend - API Layer
- [x] Create src/api.js module
- [x] Implement request body parser (JSON.parse with error handling)
- [x] Implement auth middleware helper (verify cookie, check session)
- [x] Implement handleSetupCheck() endpoint
- [x] Implement handleSetup() with username/password validation
- [x] Implement handleLogin() with credential verification and session creation
- [x] Implement handleLogout() with session removal and cookie clearing
- [x] Implement handleGetLinks() with authentication check
- [x] Implement handleSaveLinks() with link validation (URL, order, uniqueness)
- [x] Implement handleGetPreferences() with authentication check
- [x] Implement handleSavePreferences() with enum validation
- [x] Implement handleExport() with Content-Disposition header
- [x] Implement handleImport() with data merge and validation
- [x] Implement handleFavicon() with URL parsing, fetch, and 5s timeout
- [x] Implement main route() dispatcher with URL matching
- [x] Test all endpoints with curl or Postman

### Phase 5: Backend - Server
- [x] Create src/server.js module
- [x] Implement HTTP server creation with port from ENV or 3000
- [x] Implement static file serving for /index.html, /app.js, /styles.css
- [x] Implement Content-Type headers (text/html, application/javascript, text/css)
- [x] Implement routing: / → index.html, /api/* → api.route(), else → 404
- [x] Implement 404 handler with appropriate status code
- [x] Implement request logging: [timestamp] METHOD /path STATUS
- [x] Test server startup and verify static file serving

### Phase 6: Frontend - HTML Structure
- [x] Create public/index.html with semantic HTML5
- [x] Build setup screen structure (username/password form, hidden by default)
- [x] Build login screen structure (username/password form, hidden by default)
- [x] Build main dashboard structure (header, main, modals, hidden by default)
- [x] Build header with app title, search input, layout toggle buttons, settings button
- [x] Build main links container (empty div, populated by JavaScript)
- [x] Build "Add Link" floating action button
- [x] Build link modal structure (form with name, URL, save/cancel buttons)
- [x] Build settings modal structure (theme toggle, accent picker, import/export, logout)
- [x] Add responsive viewport meta tag

### Phase 7: Frontend - Tailwind Styling
- [x] Create src/input.css with @tailwind directives
- [x] Configure tailwind.config.js with darkMode: 'class' and custom accent colors
- [x] Build Tailwind CSS (`npm run build:css`)
- [x] Style setup screen with centered card layout
- [x] Style login screen with centered card layout
- [x] Style dashboard header with flexbox, search bar, and buttons
- [x] Style grid layout for links (responsive columns: 2-6)
- [x] Style list layout for links (stacked rows)
- [x] Style cards layout for links (with shadows and hover effects)
- [x] Style link modal with overlay and centered card
- [x] Style settings modal with sections for theme, colors, import/export
- [x] Implement dark mode utility classes (dark:bg-gray-900, etc.)
- [x] Implement accent color utilities (bg-accent-blue, etc.)

### Phase 8: Frontend - Core JavaScript
- [x] Create public/app.js
- [x] Implement state object (links, preferences, searchQuery, editingLink)
- [x] Implement API client wrapper for fetch (GET/POST with error handling)
- [x] Implement api.checkSetup() function
- [x] Implement api.setup(username, password) function
- [x] Implement api.login(username, password) function
- [x] Implement api.logout() function
- [x] Implement api.getLinks() function
- [x] Implement api.saveLinks(links) function
- [x] Implement api.getPreferences() function
- [x] Implement api.savePreferences(prefs) function
- [x] Implement api.exportData() function
- [x] Implement api.importData(data) function
- [x] Implement init() function to check setup/auth and route to correct screen
- [x] Implement showSetupScreen() to display setup form
- [x] Implement showLoginScreen() to display login form
- [x] Implement showDashboard() to load and display main app
- [x] Implement loadLinks() to fetch and update state
- [x] Implement loadPreferences() to fetch and apply theme

### Phase 9: Frontend - Link Display
- [x] Implement renderLinks() dispatcher based on state.preferences.layout
- [x] Implement renderGrid() with Tailwind grid classes and responsive breakpoints
- [x] Implement renderList() with stacked link items
- [x] Implement renderCards() with card components and shadows
- [x] Implement link item rendering with favicon (img or emoji fallback)
- [x] Implement search filter logic (filter state.links by searchQuery)
- [x] Implement layout toggle button handlers (update preferences and re-render)
- [x] Apply theme classes to body element based on state.preferences.theme
- [x] Apply accent color classes based on state.preferences.accentColor

### Phase 10: Frontend - Link Management
- [x] Implement "Add Link" button click handler (open modal in create mode)
- [x] Implement renderLinkModal() for both add and edit modes
- [x] Implement form validation in modal (name required, valid URL)
- [x] Implement onSaveLink() to create new link or update existing
- [x] Generate UUID v4 for new links using crypto.randomUUID() or polyfill
- [x] Implement onEditLink(id) to open modal in edit mode with pre-filled data
- [x] Implement onDeleteLink(id) with confirmation dialog
- [x] Implement modal close handlers (X button, cancel button, overlay click)
- [x] Update state.links array and call api.saveLinks()
- [x] Re-render links after save/delete

### Phase 11: Frontend - Drag and Drop
- [x] Add draggable="true" attribute to all link elements
- [x] Implement onDragStart(e, linkId) to store dragged link ID in dataTransfer
- [x] Implement onDragOver(e) with e.preventDefault() to allow drop
- [x] Implement onDrop(e, targetLinkId) to handle drop event
- [x] Calculate new order values after drop (reorder array, update order fields)
- [x] Save reordered links to API with api.saveLinks()
- [x] Add visual feedback during drag (opacity, border highlight)
- [x] Test drag-and-drop in all three layouts

### Phase 12: Frontend - Settings
- [x] Implement renderSettingsModal() with all preference options
- [x] Implement theme toggle button (light/dark) with state update
- [x] Implement accent color picker buttons (5 colors)
- [x] Implement export button that calls api.exportData() and triggers download
- [x] Implement import button with file input and FileReader API
- [x] Parse imported JSON and call api.importData(data)
- [x] Implement logout button that calls api.logout() and redirects to login
- [x] Save preferences on any change with api.savePreferences()
- [x] Apply theme/color changes immediately to DOM

### Phase 13: Frontend - Authentication Flows
- [x] Implement setup form submission handler
- [x] Implement login form submission handler
- [x] Display error messages for failed auth (invalid credentials, validation)
- [x] Redirect to dashboard after successful setup/login
- [x] Handle 401 responses globally (session expired → redirect to login)
- [x] Clear state on logout

### Phase 14: Testing & Polish
- [x] Test first-run setup flow (no data.json → setup screen → create user)
- [x] Test login flow (correct credentials → dashboard, wrong → error)
- [x] Test logout flow (logout → redirect to login, session cleared)
- [x] Test add link (modal → save → appears in list)
- [x] Test edit link (click link → modal with data → save → updated)
- [x] Test delete link (click delete → confirm → removed)
- [x] Test drag-and-drop reordering in grid layout
- [x] Test drag-and-drop reordering in list layout
- [x] Test drag-and-drop reordering in cards layout
- [x] Test search functionality (type query → links filtered)
- [x] Test layout switching (grid/list/cards → preference saved → persists on reload)
- [x] Test theme switching (light/dark → applied immediately → persists)
- [x] Test accent color switching (all 5 colors → applied immediately)
- [x] Test export (download JSON with links and preferences)
- [x] Test import (upload JSON → links and preferences restored)
- [x] Test favicon fetching (new link → favicon loads or fallback)
- [x] Test responsive design on mobile (320px, 768px, 1024px)
- [x] Test dark mode appearance (all screens, modals)
- [x] Test credential reset (delete user from data.json → setup screen appears)

### Phase 15: Docker & Deployment
- [ ] Build Docker image (`docker build -t simple-linkz .`)
- [ ] Test Docker container startup (`docker run -p 3000:3000 -v ./data:/data simple-linkz`)
- [ ] Test volume persistence (add link → stop container → start → link still exists)
- [ ] Test SESSION_SECRET environment variable (set custom secret → verify used)
- [ ] Test PORT environment variable (set to 8080 → verify server listens)
- [ ] Verify Docker image size (should be <100MB)
- [ ] Test docker-compose up and down
- [ ] Test container restart policy

### Phase 16: Documentation
- [x] Update README.md with project description and features
- [x] Document installation instructions (Docker and non-Docker)
- [x] Document Docker usage (docker run command, docker-compose)
- [x] Document environment variables (PORT, SESSION_SECRET)
- [x] Document volume mounting for data persistence
- [x] Document first-time setup process (setup screen → create credentials)
- [x] Document credential reset process (delete user section from data.json)
- [x] Document import/export feature usage
- [ ] Add screenshots or ASCII art demo
- [ ] Add troubleshooting section (common issues, permissions, port conflicts)
- [ ] Add contributing guidelines (if open source)
- [x] Add license information

---

## Progress Tracking

**As you work through this SOW, check off completed items above. Update this section with notes on progress, blockers, or deviations from the plan.**

### Current Status
- **Phase**: 16 (Documentation)
- **Completed Tasks**: 102/112 (91% complete)
- **Blockers**: None
- **Notes**: Core application fully functional! Remaining tasks are Docker testing, screenshots, and optional documentation sections.

---

## Post-Implementation Notes

### Deviations from Plan

**Additional Features Implemented:**
1. **Background Color Customization** - Added theme-specific background color options (white/gray/slate/zinc for light mode, gray/slate/zinc/dark for dark mode)
2. **Custom Page Title** - Users can rename the application title from "Simple Linkz" to anything they want (max 50 characters)
3. **Automatic Favicon Fetching** - When saving a link, the app automatically attempts to fetch the website's favicon via the `/api/favicon` endpoint and caches it
4. **Favicon Display** - Links display actual website favicons when available, with fallback to emoji or default link icon

**Technical Adjustments:**
- Updated storage schema to include `backgroundColor` and `pageTitle` in preferences
- Enhanced API validation for new preference fields
- Modified `applyTheme()` to dynamically apply background colors
- Added `fetchFavicon()` helper function in frontend
- Updated `getLinkIcon()` to display `<img>` tags for favicons
- Added favicon link to HTML (`/favicon.png`)

### Lessons Learned
- Tailwind v3 is more straightforward for CLI builds than v4
- classList manipulation requires converting to array before filtering/removing
- Favicon fetching via proxy avoids CORS issues
- Dynamic background color requires removing hardcoded classes from HTML

### Future Enhancements
_Ideas for features beyond the current scope:_
- Link categories/folders
- Link tags
- Link icons beyond favicons
- Keyboard shortcuts
- Link statistics (click tracking)
- Multiple user support
- HTTPS support with Let's Encrypt
- Browser extension for quick link adding

---

## Appendix

### Validation Rules

**Username**:
- Length: 3-50 characters
- Pattern: No special requirements (alphanumeric, email, etc. all allowed)

**Password**:
- Length: Minimum 8 characters
- Pattern: No complexity requirements (simplicity over security for self-hosted)

**Link Name**:
- Length: 1-100 characters
- Pattern: Any characters including emojis

**Link URL**:
- Pattern: Must be valid HTTP or HTTPS URL
- Validation: Use URL constructor in JavaScript

**Link Order**:
- Type: Non-negative integer
- Uniqueness: Not required (can have duplicate order values)

### Error Codes

| Status | Meaning | Usage |
|--------|---------|-------|
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid input, validation failure |
| 401 | Unauthorized | Missing or invalid session |
| 404 | Not Found | Resource not found, invalid route |
| 500 | Internal Server Error | Unexpected server error |

### Cookie Format

```
session=TOKEN.SIGNATURE; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800
```

**Token**: 64-character hex string (32 random bytes)
**Signature**: HMAC-SHA256(token, sessionSecret) as hex
**Max-Age**: 604800 seconds (7 days)

### Session Cleanup

Sessions should be cleaned up on:
1. Explicit logout
2. Expiration check on each authenticated request
3. Optional: Periodic cleanup job (not required for single-user)

---

**Last Updated**: 2025-10-08 (SOW Created)

**Instructions**: This SOW.md file should be updated as work progresses. Check off items as they are completed and add notes about any changes or issues encountered during implementation.
