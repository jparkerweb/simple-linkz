# Phase 4: Tag System

**Status:** Complete
**Estimated Tasks:** 28 tasks

## Overview

This phase implements a flat tagging system that allows links to have multiple tags for organization. Users can create, rename, delete tags with custom colors, filter links by tag, and perform bulk tag operations on multiple links. The export/import system is extended to include tags.

## Prerequisites

- [x] Phase 3 must be complete (CSRF required for all mutating tag endpoints)
- [x] Application runs locally with CSRF protection working

## Tasks

### Schema Updates

- [x] **Task 4.1:** Add tags array to data schema
  - File: `src/storage.js`
  - In default data structure and initializeData(), add:
  ```javascript
  tags: []
  // Tag structure: { id: "uuid", name: "Work", color: "#3B82F6" }
  ```

- [x] **Task 4.2:** Add tags field to link objects in schema
  - File: `src/storage.js`
  - Each link should have: `tags: []` (array of tag IDs)
  - Existing links get empty tags array on load if missing

- [x] **Task 4.3:** Create migration for existing data
  - File: `src/storage.js`
  - In data loading, if `tags` array is missing at root level, add empty array
  - For each link, if `tags` field is missing, add empty array
  - This handles upgrade of existing installations

### Tag API Endpoints

- [x] **Task 4.4:** Add route handling for `/api/tags` endpoints
  - File: `src/api.js`
  - Add route matching for:
    - GET `/api/tags`
    - POST `/api/tags`
    - PUT `/api/tags/:id`
    - DELETE `/api/tags/:id`
  - All require auth, mutations require CSRF

- [x] **Task 4.5:** Implement GET `/api/tags`
  - File: `src/api.js`
  - Return all tags from data: `{ tags: data.tags }`
  - Sort alphabetically by name before returning

- [x] **Task 4.6:** Implement POST `/api/tags`
  - File: `src/api.js`
  - Parse request body: `{ name: string, color: string }`
  - Validate: name required, non-empty, unique among existing tags
  - Validate: color must be valid hex color (#RRGGBB or #RGB)
  - Generate UUID for new tag
  - Add to data.tags array
  - Return created tag: `{ tag: { id, name, color } }`

- [x] **Task 4.7:** Implement PUT `/api/tags/:id`
  - File: `src/api.js`
  - Extract tag ID from URL path
  - Parse request body: `{ name?: string, color?: string }`
  - Find tag by ID, return 404 if not found
  - Validate name uniqueness if changing name
  - Update tag properties
  - Return updated tag: `{ tag: { id, name, color } }`

- [x] **Task 4.8:** Implement DELETE `/api/tags/:id`
  - File: `src/api.js`
  - Extract tag ID from URL path
  - Find tag by ID, return 404 if not found
  - Remove tag from data.tags array
  - **Important:** Also remove tag ID from all links that have it
  - Return: `{ success: true }`

- [x] **Task 4.9:** Create helper to remove tag from all links
  - File: `src/api.js` or `src/storage.js`
  - Function `removeTagFromAllLinks(tagId)`:
  ```javascript
  function removeTagFromAllLinks(data, tagId) {
    data.links = data.links.map(link => ({
      ...link,
      tags: link.tags.filter(t => t !== tagId)
    }));
    return data;
  }
  ```

### Bulk Tag Operations

- [x] **Task 4.10:** Add route for POST `/api/links/bulk-tag`
  - File: `src/api.js`
  - Add route matching for bulk tag endpoint
  - Requires auth and CSRF

- [x] **Task 4.11:** Implement bulk tag endpoint
  - File: `src/api.js`
  - Parse request body:
  ```javascript
  {
    linkIds: string[],      // Array of link IDs to modify
    operation: "add" | "remove",
    tagIds: string[]        // Tags to add or remove
  }
  ```
  - Validate all linkIds exist
  - Validate all tagIds exist
  - Apply operation to each link

- [x] **Task 4.12:** Implement add operation for bulk tagging
  - For "add" operation: add tagIds to each link's tags array (avoid duplicates)
  ```javascript
  if (operation === 'add') {
    data.links = data.links.map(link => {
      if (linkIds.includes(link.id)) {
        const newTags = new Set([...link.tags, ...tagIds]);
        return { ...link, tags: Array.from(newTags) };
      }
      return link;
    });
  }
  ```

- [x] **Task 4.13:** Implement remove operation for bulk tagging
  - For "remove" operation: remove tagIds from each link's tags array
  ```javascript
  if (operation === 'remove') {
    data.links = data.links.map(link => {
      if (linkIds.includes(link.id)) {
        return { ...link, tags: link.tags.filter(t => !tagIds.includes(t)) };
      }
      return link;
    });
  }
  ```

### Modify Link Endpoints for Tags

- [x] **Task 4.14:** Update link creation to accept tags
  - File: `src/api.js`
  - In POST `/api/links` handler
  - Accept optional `tags` array in request body
  - Validate all tag IDs exist
  - Store tags array with new link (default to empty array)

- [x] **Task 4.15:** Update link update to accept tags
  - File: `src/api.js`
  - In PUT `/api/links/:id` handler
  - Accept optional `tags` array in request body
  - Validate all tag IDs exist
  - Replace link's tags array if provided

- [x] **Task 4.16:** Update link response to include tags
  - File: `src/api.js`
  - Ensure GET `/api/links` returns tags array for each link
  - Already should be included if stored in data, but verify

### Frontend Tag Management

- [x] **Task 4.17:** Add tags to frontend state
  - File: `public/app.js`
  - Add `tags: []` to application state
  - Fetch tags on app initialization (after login)
  - Store in state for use in UI

- [x] **Task 4.18:** Create tag management modal HTML
  - File: `public/index.html`
  - Add modal with:
    - List of existing tags (name, color swatch, edit/delete buttons)
    - Form to add new tag (name input, color picker)
    - Close button

- [x] **Task 4.19:** Create tag CRUD functions in frontend
  - File: `public/app.js`
  - `createTag(name, color)` - POST to `/api/tags`
  - `updateTag(id, name, color)` - PUT to `/api/tags/:id`
  - `deleteTag(id)` - DELETE to `/api/tags/:id`
  - All should include CSRF token and refresh state after

- [x] **Task 4.20:** Implement tag management modal logic
  - File: `public/app.js`
  - Open modal function shows current tags
  - Wire up create tag form submission
  - Wire up edit button to show inline edit or edit mode
  - Wire up delete button with confirmation
  - Refresh tag list after any operation

- [x] **Task 4.21:** Add tag multi-select to link edit modal
  - File: `public/index.html`
  - In link edit modal, add section for tags
  - Show checkboxes or multi-select dropdown for available tags
  - Pre-select tags the link already has

- [x] **Task 4.22:** Wire up tag selection in link edit modal
  - File: `public/app.js`
  - When opening edit modal, set selected tags from link.tags
  - When saving link, include selected tags in request body
  - Create UI for adding tags (checkbox list or tag pills)

### Tag Filtering

- [x] **Task 4.23:** Add tag filter dropdown to header
  - File: `public/index.html`
  - Add dropdown/select element in header area
  - Options: "All Links" (no filter) + one option per tag
  - Include tag color indicator in each option

- [x] **Task 4.24:** Implement tag filter state
  - File: `public/app.js`
  - Add `activeTagFilter: null` to state (null = show all)
  - Create `setTagFilter(tagId)` function
  - Update dropdown change handler to call setTagFilter

- [x] **Task 4.25:** Modify renderLinks to respect tag filter
  - File: `public/app.js`
  - In renderLinks(), filter links before rendering:
  ```javascript
  let linksToRender = state.links;
  if (state.activeTagFilter) {
    linksToRender = linksToRender.filter(link =>
      link.tags.includes(state.activeTagFilter)
    );
  }
  ```
  - Continue with existing search filter after tag filter

### Export/Import with Tags

- [x] **Task 4.26:** Update export to include tags
  - File: `src/api.js` or `public/app.js` (wherever export is handled)
  - Include `tags` array in export JSON
  - Links already include their tags array

- [x] **Task 4.27:** Update import to restore tags
  - File: `src/api.js` or `public/app.js` (wherever import is handled)
  - Import tags array from JSON
  - Handle merging: if importing tag with same name, use existing tag ID
  - Update link tag references to use correct tag IDs after merge

- [x] **Task 4.28:** Test tag import/export round-trip
  - Create several tags with colors
  - Assign tags to links
  - Export data
  - Reset app (delete data.json)
  - Import exported data
  - Verify tags and link-tag associations are restored

## Acceptance Criteria

- [x] Tags can be created with name and color
- [x] Tags can be renamed and color changed
- [x] Tags can be deleted (and removed from all links)
- [x] Links can have zero or multiple tags assigned
- [x] Tag assignments persist across page reloads
- [x] Links can be filtered by tag in the UI
- [x] Bulk tag operations work on multiple selected links
- [x] Tag filter dropdown shows all available tags
- [x] Export JSON includes complete tag data
- [x] Import restores tags and link-tag associations
- [x] All tag mutations require valid CSRF token
- [x] Invalid tag IDs are rejected with appropriate errors

## Notes

- Tag IDs are UUIDs generated on the server, not user-editable.
- Tag colors should be valid hex colors - provide a preset palette in UI for convenience.
- When deleting a tag, links don't need confirmation - tag is silently removed from them.
- The bulk selection mode for links is a new UI pattern - consider using checkboxes on link cards.
- Tag filtering combines with search - both filters apply simultaneously.

---

## Phase Completion Summary

**Completed:** 2025-12-07
**Implemented by:** Claude Opus 4.5

### What was done:

Implemented a complete flat tagging system for link organization including:
- Backend schema updates with migration support for existing installations
- Full CRUD API for tags with proper validation and CSRF protection
- Bulk tag operations endpoint for adding/removing tags from multiple links
- Frontend tag management modal with create, edit, and delete functionality
- Tag selection in link edit modal using pill-style checkboxes
- Tag filter dropdown in header that works with search
- Export/Import updated to include tags with intelligent merging on import

### Files created/modified:

- `src/storage.js` - Added tags array to schema, getTags/saveTags functions, migration logic
- `src/api.js` - Added tag CRUD endpoints, bulk-tag endpoint, updated export/import handlers
- `public/app.js` - Added tags to state, tag API functions, tag modal, tag filter, tag selection UI
- `public/index.html` - Added tag management modal, tag filter dropdown, tag selection in link modal

### Issues encountered:

None - all tasks completed as specified.
