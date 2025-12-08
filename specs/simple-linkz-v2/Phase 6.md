# Phase 6: Icon System (Final Phase)

**Status:** Complete
**Estimated Tasks:** 30 tasks

## Overview

This phase implements a comprehensive icon system with self-hosted icon fonts (Material Icons and Font Awesome Free subsets), custom icon uploads, and a searchable icon picker modal. Links can use either auto-detected favicons, icon pack icons, or user-uploaded custom icons.

## Prerequisites

- [x] Phase 4 must be complete (tag system in place)
- [x] Phase 5 must be complete (theme engine for consistent styling)
- [x] Application runs locally with tags and theming working

## Tasks

### Icon Font Setup

- [x] **Task 6.1:** Download Material Icons font subset
  - Create directory: `public/fonts/material-icons/`
  - Download Material Icons variable font (woff2 format)
  - Source: https://fonts.google.com/icons or https://github.com/google/material-design-icons
  - We only need a subset of ~80 common icons (see planning doc section 10.0)
  - Create subset using a tool like glyphhanger or use full font if subsetting is complex

- [x] **Task 6.2:** Create Material Icons CSS file
  - File: `public/fonts/material-icons/material-icons.css`
  - Define @font-face and utility class:
  ```css
  @font-face {
    font-family: 'Material Icons';
    font-style: normal;
    font-weight: 400;
    src: url('./MaterialIcons.woff2') format('woff2');
  }

  .material-icons {
    font-family: 'Material Icons';
    font-weight: normal;
    font-style: normal;
    font-size: 24px;
    line-height: 1;
    letter-spacing: normal;
    text-transform: none;
    display: inline-block;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
  }
  ```

- [x] **Task 6.3:** Download Font Awesome Free subset
  - Create directory: `public/fonts/fontawesome/`
  - Download Font Awesome Free (woff2 format)
  - We need solid icons + brand icons (~80 icons, see planning doc section 10.0)
  - Source: https://fontawesome.com/download or https://github.com/FortAwesome/Font-Awesome

- [x] **Task 6.4:** Create Font Awesome CSS file
  - File: `public/fonts/fontawesome/fontawesome.css`
  - Define @font-face for solid and brands:
  ```css
  @font-face {
    font-family: 'Font Awesome Solid';
    font-style: normal;
    font-weight: 900;
    src: url('./fa-solid.woff2') format('woff2');
  }

  @font-face {
    font-family: 'Font Awesome Brands';
    font-style: normal;
    font-weight: 400;
    src: url('./fa-brands.woff2') format('woff2');
  }

  .fa-solid { font-family: 'Font Awesome Solid'; font-weight: 900; }
  .fa-brands { font-family: 'Font Awesome Brands'; font-weight: 400; }
  ```

- [x] **Task 6.5:** Add icon font CSS to index.html
  - File: `public/index.html`
  - Add in `<head>`:
  ```html
  <link rel="stylesheet" href="/fonts/material-icons/material-icons.css">
  <link rel="stylesheet" href="/fonts/fontawesome/fontawesome.css">
  ```

- [x] **Task 6.6:** Test icon fonts render correctly
  - Add test HTML to verify fonts load: `<span class="material-icons">home</span>`
  - Add test: `<span class="fa-solid"></span>` (using unicode or class)
  - Verify both render, then remove test HTML

### Icon Registry

- [x] **Task 6.7:** Create icon registry constant in app.js
  - File: `public/app.js`
  - Define available icons from each pack:
  ```javascript
  const ICON_REGISTRY = {
    material: [
      { id: 'home', name: 'Home', keywords: ['house', 'main'] },
      { id: 'settings', name: 'Settings', keywords: ['gear', 'config'] },
      { id: 'search', name: 'Search', keywords: ['find', 'magnify'] },
      // ... all 80 icons from planning doc
    ],
    fontawesome: {
      solid: [
        { id: 'house', name: 'House', keywords: ['home'] },
        // ... solid icons
      ],
      brands: [
        { id: 'github', name: 'GitHub', keywords: ['git', 'code'] },
        { id: 'docker', name: 'Docker', keywords: ['container', 'whale'] },
        // ... brand icons
      ]
    }
  };
  ```

- [x] **Task 6.8:** Create icon search function
  - File: `public/app.js`
  - Function to search icons by name and keywords:
  ```javascript
  function searchIcons(query, pack = 'all') {
    const q = query.toLowerCase();
    let icons = [];

    // Collect icons based on pack filter
    if (pack === 'all' || pack === 'material') {
      icons = icons.concat(
        ICON_REGISTRY.material.filter(i =>
          i.name.toLowerCase().includes(q) ||
          i.keywords.some(k => k.includes(q))
        ).map(i => ({ ...i, pack: 'material' }))
      );
    }

    if (pack === 'all' || pack === 'fontawesome') {
      // Add solid and brands icons similarly
    }

    return icons;
  }
  ```

### Schema Updates

- [x] **Task 6.9:** Add customIcons array to schema
  - File: `src/storage.js`
  - Add to data structure:
  ```javascript
  customIcons: []
  // Structure: { id: "uuid", filename: "myicon.png", uploadedAt: timestamp }
  ```

- [x] **Task 6.10:** Add icon fields to link schema
  - File: `src/storage.js`
  - Add to link objects:
  ```javascript
  {
    // existing fields...
    iconType: 'favicon',  // 'favicon' | 'material' | 'fontawesome' | 'custom'
    iconValue: null       // null for favicon, icon ID for pack, filename for custom
  }
  ```
  - Default: `iconType: 'favicon', iconValue: null`

- [x] **Task 6.11:** Migrate existing links
  - File: `src/storage.js`
  - On data load, for links missing iconType/iconValue:
  - Set `iconType: 'favicon', iconValue: null`

### Custom Icon API

- [x] **Task 6.12:** Create `/data/icons/` directory on startup
  - File: `src/storage.js` or `src/server.js`
  - Ensure icons directory exists: `fs.mkdirSync(path.join(DATA_DIR, 'icons'), { recursive: true })`

- [x] **Task 6.13:** Add route for static icon files
  - File: `src/server.js`
  - Serve files from `/icons/:filename`:
  ```javascript
  if (urlPath.startsWith('/icons/')) {
    const filename = urlPath.slice('/icons/'.length);
    const iconPath = path.join(DATA_DIR, 'icons', filename);
    // Serve file with appropriate content-type
  }
  ```

- [x] **Task 6.14:** Implement GET `/api/icons` endpoint
  - File: `src/api.js`
  - Return list of custom icons: `{ icons: data.customIcons }`
  - Each icon includes: id, filename, uploadedAt

- [x] **Task 6.15:** Implement POST `/api/icons` endpoint
  - File: `src/api.js`
  - Accept multipart form data with image file
  - Validate:
    - File size <= 100KB
    - File type is PNG, SVG, ICO, or WEBP
    - Total custom icons < 50
  - Generate UUID for icon
  - Save file to `/data/icons/{uuid}.{ext}`
  - Add to customIcons array
  - Return: `{ icon: { id, filename, uploadedAt } }`

- [x] **Task 6.16:** Implement DELETE `/api/icons/:id` endpoint
  - File: `src/api.js`
  - Find icon by ID
  - Delete file from `/data/icons/`
  - Remove from customIcons array
  - Update any links using this icon to default (favicon)
  - Return: `{ success: true }`

- [x] **Task 6.17:** Handle multipart form parsing for icon upload
  - File: `src/api.js`
  - Without Express, need to parse multipart manually
  - Use native Node.js or consider simple boundary parsing
  - Extract file data and filename from request

### Icon Picker Modal

- [x] **Task 6.18:** Create icon picker modal HTML
  - File: `public/index.html`
  - Add modal with structure:
  ```html
  <div id="iconPickerModal" class="modal hidden">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Choose Icon</h2>
        <button class="close-btn" aria-label="Close modal">&times;</button>
      </div>

      <!-- Tab navigation -->
      <div class="icon-tabs">
        <button data-tab="material" class="active">Material</button>
        <button data-tab="fontawesome">Font Awesome</button>
        <button data-tab="custom">Custom</button>
        <button data-tab="favicon">Auto (Favicon)</button>
      </div>

      <!-- Search box -->
      <input type="search" id="iconSearch" placeholder="Search icons...">

      <!-- Icon grid -->
      <div id="iconGrid" class="icon-grid"></div>

      <!-- Custom upload section (shown on custom tab) -->
      <div id="customUploadSection" class="hidden">
        <input type="file" id="iconUpload" accept=".png,.svg,.ico,.webp">
        <button id="uploadIconBtn">Upload</button>
      </div>
    </div>
  </div>
  ```

- [x] **Task 6.19:** Style icon picker modal
  - File: `src/input.css`
  - Add styles for:
    - Tab buttons
    - Icon grid (responsive grid of clickable icons)
    - Icon items (with hover state)
    - Selected icon highlight
    - Upload section

- [x] **Task 6.20:** Implement icon picker tab switching
  - File: `public/app.js`
  - Handle tab button clicks
  - Show appropriate content for each tab:
    - material: Show Material Icons grid
    - fontawesome: Show Font Awesome grid (solid + brands)
    - custom: Show uploaded icons + upload form
    - favicon: Show explanation and "use auto favicon" button

- [x] **Task 6.21:** Implement icon grid rendering
  - File: `public/app.js`
  - `renderIconGrid(icons, selectedId)`:
  ```javascript
  function renderIconGrid(icons, selectedId) {
    const grid = document.getElementById('iconGrid');
    grid.innerHTML = icons.map(icon => `
      <button class="icon-item ${icon.id === selectedId ? 'selected' : ''}"
              data-icon-id="${icon.id}"
              data-icon-pack="${icon.pack}">
        ${renderIcon(icon)}
        <span class="icon-name">${icon.name}</span>
      </button>
    `).join('');
  }
  ```

- [x] **Task 6.22:** Implement icon search with debounce
  - File: `public/app.js`
  - Add input listener to search box
  - Debounce 100ms
  - Filter icons based on search query
  - Re-render grid with filtered results

- [x] **Task 6.23:** Implement icon selection
  - File: `public/app.js`
  - Add click handler to icon grid
  - When icon clicked:
    - Store selected icon (type + value)
    - Highlight selected icon
    - Enable "confirm" or auto-close modal

- [x] **Task 6.24:** Implement custom icon upload in modal
  - File: `public/app.js`
  - Handle file selection and upload button
  - Call POST `/api/icons` with form data
  - On success, add to custom icons list and show in grid
  - Handle errors (file too large, wrong type, quota exceeded)

### Link Edit Modal Integration

- [x] **Task 6.25:** Add icon selector to link edit modal
  - File: `public/index.html`
  - In link edit modal, add icon section:
  ```html
  <div class="icon-selector">
    <label>Icon</label>
    <button id="selectIconBtn" type="button">
      <span id="currentIconPreview"><!-- current icon rendered here --></span>
      <span>Change Icon</span>
    </button>
  </div>
  ```

- [x] **Task 6.26:** Wire up icon selector button
  - File: `public/app.js`
  - When "Change Icon" clicked, open icon picker modal
  - Pass current icon selection to modal
  - When modal returns selection, update preview and store value

### Link Rendering with Icons

- [x] **Task 6.27:** Update link rendering to use iconType
  - File: `public/app.js`
  - Modify link card rendering:
  ```javascript
  function renderLinkIcon(link) {
    switch (link.iconType) {
      case 'favicon':
        return `<img src="${link.faviconUrl || '/default-favicon.png'}" class="favicon-img">`;
      case 'material':
        return `<span class="material-icons">${link.iconValue}</span>`;
      case 'fontawesome':
        const [type, name] = link.iconValue.split(':'); // "solid:house" or "brands:github"
        return `<span class="fa-${type}">${getFAUnicode(name)}</span>`;
      case 'custom':
        return `<img src="/icons/${link.iconValue}" class="custom-icon">`;
      default:
        return `<span class="material-icons">link</span>`;
    }
  }
  ```

- [x] **Task 6.28:** Create helper for Font Awesome unicode mapping
  - File: `public/app.js`
  - Create mapping from icon name to unicode:
  ```javascript
  const FA_UNICODE_MAP = {
    'house': '\uf015',
    'github': '\uf09b',
    // ... all used icons
  };
  function getFAUnicode(name) {
    return FA_UNICODE_MAP[name] || '\uf128'; // question mark fallback
  }
  ```

- [x] **Task 6.29:** Save icon selection when editing link
  - File: `public/app.js`
  - When saving link, include:
  ```javascript
  {
    // other link fields...
    iconType: selectedIconType,  // 'favicon' | 'material' | 'fontawesome' | 'custom'
    iconValue: selectedIconValue // icon ID or filename
  }
  ```
  - PUT to `/api/links/:id`

- [x] **Task 6.30:** Test complete icon system
  - Test Material Icons selection and display
  - Test Font Awesome icons (solid and brands)
  - Test custom icon upload (valid files)
  - Test custom icon upload rejection (too large, wrong type, quota)
  - Test switching between icon types for a link
  - Test icon deletion and impact on links using it
  - Test icon persistence across page reloads

## Acceptance Criteria

- [x] Material Icons font loads and renders correctly
- [x] Font Awesome (solid + brands) loads and renders correctly
- [x] Icon picker modal has tabs for Material, FA, Custom, and Favicon
- [x] Icon search filters icons by name and keywords
- [x] Icons can be selected from the picker
- [x] Custom icons can be uploaded (PNG, SVG, ICO, WEBP, max 100KB)
- [x] Custom icon limit (50) is enforced
- [x] Custom icons appear in the Custom tab
- [x] Custom icons can be deleted
- [x] Deleting a custom icon reverts links to favicon
- [x] Links can use favicon (auto), Material, Font Awesome, or custom icons
- [x] Link icon selection persists after save
- [x] Link cards render correct icon based on iconType

## Notes

- Font subsetting is optional but recommended for performance - full icon fonts are ~200-500KB.
- Font Awesome Free has licensing requirements - include attribution comment in CSS.
- The unicode approach for Font Awesome is simpler than class-based but requires maintaining the map.
- Consider lazy-loading the icon picker modal content for performance.
- Custom icons are stored in `/data/icons/` which should be included in Docker volume mount.

---

## Phase Completion Summary

**Completed:** 2025-12-07
**Implemented by:** Claude (claude-opus-4-5-20251101)

### What was done:

Implemented a comprehensive icon system allowing users to choose from three icon sources:
1. **Material Icons** - Self-hosted Google Material Icons font with ~80 common icons
2. **Font Awesome** - Self-hosted Font Awesome Free (Solid + Brands) with ~60 icons each
3. **Custom Icons** - User-uploaded icons (PNG, SVG, ICO, WEBP, max 100KB, limit 50)

Features implemented:
- Icon picker modal with tabs for Favicon, Material, Font Awesome, and Custom icons
- Icon search functionality with debounce (searches by name and keywords)
- Font Awesome sub-tabs for Solid and Brands icon sets
- Custom icon upload with multipart form parsing (no external dependencies)
- Icon rendering in Grid, List, and Cards layouts
- Backward-compatible migration for existing links (default to favicon)
- API endpoints for custom icon management (GET, POST, DELETE)

### Files created/modified:

- `public/fonts/material-icons/material-icons.css` - Material Icons @font-face CSS
- `public/fonts/material-icons/MaterialIcons.woff2` - Material Icons font file
- `public/fonts/fontawesome/fontawesome.css` - Font Awesome @font-face CSS
- `public/fonts/fontawesome/fa-solid-900.woff2` - Font Awesome Solid font file
- `public/fonts/fontawesome/fa-brands-400.woff2` - Font Awesome Brands font file
- `public/index.html` - Added icon font CSS links, icon picker modal, icon selector in link modal
- `public/app.js` - Added ICON_REGISTRY, icon picker state/functions, icon rendering, API methods
- `src/storage.js` - Added customIcons array, iconType/iconValue fields, migration logic
- `src/api.js` - Added GET/POST/DELETE /api/icons endpoints, multipart form parser
- `src/server.js` - Added icons directory creation, /icons/:filename route serving

### Issues encountered:

1. **z-index issue**: Tailwind's arbitrary value `z-[60]` wasn't compiled into CSS, causing icon picker modal to appear behind link modal. Fixed by using inline style `style="z-index: 60;"`.

2. **Server running old code**: Multiple server instances were running causing 404s on new API endpoints. Fixed by killing processes and restarting server.

3. **Font Awesome unicode approach**: Instead of class-based rendering, used unicode values stored in ICON_REGISTRY for simpler implementation without requiring class name mapping.
