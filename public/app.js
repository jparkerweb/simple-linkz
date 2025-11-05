// Get base path from injected window variable (set by server if BASE_PATH env var is defined)
const BASE_PATH = window.BASE_PATH || '';

// State
const state = {
  links: [],
  preferences: { layout: 'grid', theme: 'dark', accentColor: 'blue', backgroundColor: 'gray', pageTitle: 'Simple Linkz' },
  searchQuery: '',
  editingLink: null
};

// API Client
const api = {
  async checkSetup() {
    const res = await fetch(`${BASE_PATH}/api/setup/check`);
    return res.json();
  },

  async setup(username, password) {
    const res = await fetch(`${BASE_PATH}/api/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async login(username, password) {
    const res = await fetch(`${BASE_PATH}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async logout() {
    const res = await fetch(`${BASE_PATH}/api/logout`, { method: 'POST' });
    return res.json();
  },

  async getLinks() {
    const res = await fetch(`${BASE_PATH}/api/links`);
    if (res.status === 401) {
      showLoginScreen();
      return { links: [] };
    }
    return res.json();
  },

  async saveLinks(links) {
    const res = await fetch(`${BASE_PATH}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ links })
    });
    if (res.status === 401) {
      showLoginScreen();
    }
    return res.json();
  },

  async getPreferences() {
    const res = await fetch(`${BASE_PATH}/api/preferences`);
    if (res.status === 401) {
      showLoginScreen();
      return { preferences: state.preferences };
    }
    return res.json();
  },

  async savePreferences(preferences) {
    const res = await fetch(`${BASE_PATH}/api/preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences })
    });
    if (res.status === 401) {
      showLoginScreen();
    }
    return res.json();
  },

  async exportData() {
    const res = await fetch(`${BASE_PATH}/api/export`);
    return res.json();
  },

  async importData(data) {
    const res = await fetch(`${BASE_PATH}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getPageTitle(url) {
    const res = await fetch(`${BASE_PATH}/api/page-title?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      return res.json();
    }
    return null;
  }
};

// Remove loading overlay
function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    // Remove from DOM after animation completes
    setTimeout(() => {
      overlay.remove();
    }, 500);
  }
}

// Initialize
async function init() {
  const setupCheck = await api.checkSetup();
  if (setupCheck.needsSetup) {
    showSetupScreen();
    hideLoadingOverlay();
  } else {
    // Try to load preferences to check if authenticated
    const prefsResult = await api.getPreferences();
    if (prefsResult.preferences) {
      showDashboard();
    } else {
      showLoginScreen();
      hideLoadingOverlay();
    }
  }
}

// Setup Screen
function showSetupScreen() {
  document.getElementById('setup-screen').classList.remove('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.add('hidden');

  const form = document.getElementById('setup-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('setup-username').value;
    const password = document.getElementById('setup-password').value;

    const result = await api.setup(username, password);
    if (result.success) {
      // Auto-login after setup
      const loginResult = await api.login(username, password);
      if (loginResult.success) {
        showDashboard();
      }
    } else {
      const errorEl = document.getElementById('setup-error');
      errorEl.textContent = result.error || 'Setup failed';
      errorEl.classList.remove('hidden');
    }
  };
}

// Login Screen
function showLoginScreen() {
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');

  const form = document.getElementById('login-form');
  form.onsubmit = async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const result = await api.login(username, password);
    if (result.success) {
      showDashboard();
    } else {
      const errorEl = document.getElementById('login-error');
      errorEl.textContent = result.error || 'Login failed';
      errorEl.classList.remove('hidden');
    }
  };
}

// Dashboard
async function showDashboard() {
  // Load preferences first and apply theme before showing the app
  await loadPreferences();
  applyTheme();

  // Now show the dashboard with the correct theme already applied
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  await loadLinks();
  setupEventListeners();
  renderLinks();

  // Hide loading overlay after everything is ready
  hideLoadingOverlay();
}

async function loadLinks() {
  const result = await api.getLinks();
  state.links = result.links || [];

  // Fetch favicons in the background without blocking render
  fetchMissingFavicons();
}

// Fetch favicons for links that don't have them yet (truly async background operation)
async function fetchMissingFavicons() {
  const linksNeedingFavicons = state.links.filter(link => !link.faviconUrl);
  
  if (linksNeedingFavicons.length === 0) {
    return;
  }

  let needsSave = false;
  
  // Fetch favicons in parallel with a concurrency limit
  const fetchPromises = linksNeedingFavicons.map(async (link) => {
    const faviconUrl = await fetchFavicon(link.url);
    if (faviconUrl) {
      link.faviconUrl = faviconUrl;
      needsSave = true;
      // Re-render to show the newly loaded favicon
      renderLinks();
    }
  });

  // Wait for all favicon fetches to complete
  await Promise.all(fetchPromises);

  // Save updated links if we fetched any new favicons
  if (needsSave) {
    await api.saveLinks(state.links);
  }
}

async function loadPreferences() {
  const result = await api.getPreferences();
  if (result.preferences) {
    state.preferences = result.preferences;
  }
}

function setupEventListeners() {
  // Search
  document.getElementById('search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    renderLinks();
  });

  // Layout toggle
  document.querySelectorAll('#layout-toggle button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const layout = btn.dataset.layout;
      state.preferences.layout = layout;
      await api.savePreferences(state.preferences);
      renderLinks();
      updateLayoutToggle();
    });
  });

  // Add link button
  document.getElementById('add-link-btn').addEventListener('click', () => {
    state.editingLink = null;
    showLinkModal();
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', showSettingsModal);

  // Link modal
  document.getElementById('link-cancel-btn').addEventListener('click', hideLinkModal);
  document.getElementById('link-form').addEventListener('submit', handleSaveLink);
  document.getElementById('link-url').addEventListener('blur', handleUrlBlur);

  // Settings modal
  document.getElementById('settings-close-btn').addEventListener('click', hideSettingsModal);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('reset-credentials-btn').addEventListener('click', handleResetCredentials);
  document.getElementById('export-btn').addEventListener('click', handleExport);
  document.getElementById('import-file').addEventListener('change', handleImport);

  // Theme buttons
  document.querySelectorAll('[data-theme]').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.preferences.theme = btn.dataset.theme;
      await api.savePreferences(state.preferences);
      applyTheme();
      updateThemeButtons();
    });
  });

  // Accent color buttons
  document.querySelectorAll('[data-color]').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.preferences.accentColor = btn.dataset.color;
      await api.savePreferences(state.preferences);
      updateAccentButtons();
    });
  });

  // Background color buttons
  document.querySelectorAll('[data-bg]').forEach(btn => {
    btn.addEventListener('click', async () => {
      state.preferences.backgroundColor = btn.dataset.bg;
      await api.savePreferences(state.preferences);
      applyTheme();
      updateBackgroundButtons();
    });
  });

  // Page title input
  document.getElementById('page-title').addEventListener('blur', async (e) => {
    const newTitle = e.target.value.trim() || 'Simple Linkz';
    if (newTitle !== state.preferences.pageTitle) {
      state.preferences.pageTitle = newTitle;
      await api.savePreferences(state.preferences);
      updatePageTitle();
    }
  });

  // App title click to reload
  document.getElementById('app-title').addEventListener('click', () => {
    window.location.reload();
  });
}

// Rendering
function renderLinks() {
  const container = document.getElementById('links-container');
  const emptyState = document.getElementById('empty-state');

  let filteredLinks = state.links;
  if (state.searchQuery) {
    filteredLinks = state.links.filter(link =>
      link.name.toLowerCase().includes(state.searchQuery) ||
      link.url.toLowerCase().includes(state.searchQuery)
    );
  }

  if (filteredLinks.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  const sorted = [...filteredLinks].sort((a, b) => a.order - b.order);

  if (state.preferences.layout === 'grid') {
    renderGrid(container, sorted);
  } else if (state.preferences.layout === 'list') {
    renderList(container, sorted);
  } else {
    renderCards(container, sorted);
  }

  updateLayoutToggle();
}

function renderGrid(container, links) {
  container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4';
  container.innerHTML = links.map(link => `
    <div class="link-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow cursor-pointer group relative border-2 border-transparent"
         draggable="true"
         data-link-id="${link.id}"
         onclick="window.open('${escapeHtml(link.url)}', '_blank')">
      <div class="flex flex-col items-center justify-center">
        <div class="text-3xl mb-2 flex items-center justify-center">${getLinkIcon(link)}</div>
        <div class="text-sm font-medium text-gray-900 dark:text-white truncate w-full text-center">${escapeHtml(link.name)}</div>
      </div>
      <div class="hidden group-hover:flex absolute top-2 right-2 gap-1">
        <button onclick="event.stopPropagation(); editLink('${link.id}')"
                class="p-1 bg-blue-600 text-white rounded text-xs">✎</button>
        <button onclick="event.stopPropagation(); deleteLink('${link.id}')"
                class="p-1 bg-red-600 text-white rounded text-xs">✕</button>
      </div>
    </div>
  `).join('');

  setupDragAndDrop();
}

function renderList(container, links) {
  container.className = 'space-y-2';
  container.innerHTML = links.map(link => `
    <div class="link-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow cursor-pointer flex items-center gap-4 group relative border-2 border-transparent"
         draggable="true"
         data-link-id="${link.id}"
         onclick="window.open('${escapeHtml(link.url)}', '_blank')">
      <div class="text-2xl">${getLinkIcon(link)}</div>
      <div class="flex-1">
        <div class="font-medium text-gray-900 dark:text-white">${escapeHtml(link.name)}</div>
        <div class="text-sm text-gray-500 dark:text-gray-400 truncate">${escapeHtml(link.url)}</div>
      </div>
      <div class="hidden group-hover:flex gap-2">
        <button onclick="event.stopPropagation(); editLink('${link.id}')"
                class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edit</button>
        <button onclick="event.stopPropagation(); deleteLink('${link.id}')"
                class="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
      </div>
    </div>
  `).join('');

  setupDragAndDrop();
}

function renderCards(container, links) {
  container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
  container.innerHTML = links.map(link => `
    <div class="link-card bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg cursor-pointer group relative border-2 border-transparent"
         draggable="true"
         data-link-id="${link.id}"
         onclick="window.open('${escapeHtml(link.url)}', '_blank')">
      <div class="flex items-start gap-4 min-w-0">
        <div class="text-4xl flex-shrink-0 flex items-center justify-center">${getLinkIcon(link)}</div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-lg text-gray-900 dark:text-white mb-1 break-words">${escapeHtml(link.name)}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400 truncate">${escapeHtml(link.url)}</div>
        </div>
      </div>
      <div class="hidden group-hover:flex absolute top-4 right-4 gap-2">
        <button onclick="event.stopPropagation(); editLink('${link.id}')"
                class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edit</button>
        <button onclick="event.stopPropagation(); deleteLink('${link.id}')"
                class="px-3 py-1 bg-red-600 text-white rounded text-sm">Delete</button>
      </div>
    </div>
  `).join('');

  setupDragAndDrop();
}

function getLinkIcon(link) {
  // Use custom fallback emoji if provided, otherwise default to link icon
  const fallbackIcon = link.fallbackEmoji || '🔗';

  // If there's a cached favicon URL, try to use it with emoji fallback
  if (link.faviconUrl) {
    // Check if image is too small (1x1 pixel favicons) and fall back to emoji
    return `<img src="${escapeHtml(link.faviconUrl)}" alt="" class="w-8 h-8"
                 onload="if(this.naturalWidth < 8 || this.naturalHeight < 8) { this.style.display='none'; this.nextElementSibling.style.display='block'; }"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span style="display:none;">${fallbackIcon}</span>`;
  }

  // No favicon, use custom emoji or default icon
  return fallbackIcon;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateLayoutToggle() {
  document.querySelectorAll('#layout-toggle button').forEach(btn => {
    if (btn.dataset.layout === state.preferences.layout) {
      btn.classList.add('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white');
      btn.classList.remove('text-gray-600', 'dark:text-gray-300');
    } else {
      btn.classList.remove('bg-white', 'dark:bg-gray-600', 'text-gray-900', 'dark:text-white');
      btn.classList.add('text-gray-600', 'dark:text-gray-300');
    }
  });
}

function updateThemeButtons() {
  document.querySelectorAll('[data-theme]').forEach(btn => {
    if (btn.dataset.theme === state.preferences.theme) {
      btn.classList.add('bg-blue-600', 'text-white');
      btn.classList.remove('bg-white', 'dark:bg-gray-700');
    } else {
      btn.classList.remove('bg-blue-600', 'text-white');
      btn.classList.add('bg-white', 'dark:bg-gray-700');
    }
  });
}

function updateAccentButtons() {
  document.querySelectorAll('[data-color]').forEach(btn => {
    if (btn.dataset.color === state.preferences.accentColor) {
      btn.classList.add('ring-4', 'ring-offset-2', 'ring-gray-400');
    } else {
      btn.classList.remove('ring-4', 'ring-offset-2', 'ring-gray-400');
    }
  });
}

function updateBackgroundButtons() {
  document.querySelectorAll('[data-bg]').forEach(btn => {
    if (btn.dataset.bg === state.preferences.backgroundColor) {
      btn.classList.add('ring-2', 'ring-blue-500');
    } else {
      btn.classList.remove('ring-2', 'ring-blue-500');
    }
  });
}

function updatePageTitle() {
  document.getElementById('app-title').textContent = state.preferences.pageTitle;
  document.title = state.preferences.pageTitle;
}

// Theme
function applyTheme() {
  // Dark mode
  if (state.preferences.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Apply accent color as CSS variable
  const accentColors = {
    blue: { hex: '#3B82F6', rgb: '59, 130, 246' },
    green: { hex: '#10B981', rgb: '16, 185, 129' },
    purple: { hex: '#8B5CF6', rgb: '139, 92, 246' },
    red: { hex: '#EF4444', rgb: '239, 68, 68' },
    orange: { hex: '#F97316', rgb: '249, 115, 22' },
    pink: { hex: '#EC4899', rgb: '236, 72, 153' },
    cyan: { hex: '#06B6D4', rgb: '6, 182, 212' },
    yellow: { hex: '#EAB308', rgb: '234, 179, 8' }
  };
  const accentColor = accentColors[state.preferences.accentColor] || accentColors.blue;
  document.documentElement.style.setProperty('--accent-color', accentColor.hex);
  document.documentElement.style.setProperty('--accent-color-rgb', accentColor.rgb);

  // Background color - remove all bg-* classes first
  const bgClasses = Array.from(document.body.classList).filter(cls => cls.startsWith('bg-'));
  bgClasses.forEach(cls => document.body.classList.remove(cls));

  const bgColor = state.preferences.backgroundColor || 'gray';
  if (state.preferences.theme === 'light') {
    if (bgColor === 'white') {
      document.body.classList.add('bg-white');
    } else if (bgColor === 'gray') {
      document.body.classList.add('bg-gray-200');
    } else if (bgColor === 'slate') {
      document.body.classList.add('bg-blue-50');
    } else if (bgColor === 'zinc') {
      document.body.classList.add('bg-amber-50');
    }
  } else {
    if (bgColor === 'gray') {
      document.body.classList.add('bg-gray-950');
    } else if (bgColor === 'slate') {
      document.body.classList.add('bg-blue-950');
    } else if (bgColor === 'zinc') {
      document.body.classList.add('bg-amber-950');
    } else {
      document.body.classList.add('bg-black');
    }
  }

  updateThemeButtons();
  updateAccentButtons();
  updateBackgroundButtons();
  updatePageTitle();
  updateBackgroundColorVisibility();
}

function updateBackgroundColorVisibility() {
  const lightBgSection = document.getElementById('bg-color-light');
  const darkBgSection = document.getElementById('bg-color-dark');

  if (state.preferences.theme === 'light') {
    lightBgSection.classList.remove('hidden');
    darkBgSection.classList.add('hidden');
  } else {
    lightBgSection.classList.add('hidden');
    darkBgSection.classList.remove('hidden');
  }
}

// Link Modal
function showLinkModal() {
  const modal = document.getElementById('link-modal');
  const title = document.getElementById('link-modal-title');
  const nameInput = document.getElementById('link-name');
  const urlInput = document.getElementById('link-url');
  const emojiInput = document.getElementById('link-emoji');
  const errorEl = document.getElementById('link-error');

  errorEl.classList.add('hidden');

  if (state.editingLink) {
    title.textContent = 'Edit Link';
    nameInput.value = state.editingLink.name;
    urlInput.value = state.editingLink.url;
    emojiInput.value = state.editingLink.fallbackEmoji || '';
  } else {
    title.textContent = 'Add Link';
    nameInput.value = '';
    urlInput.value = '';
    emojiInput.value = '';
  }

  modal.classList.remove('hidden');
  urlInput.focus();
}

async function handleUrlBlur() {
  const nameInput = document.getElementById('link-name');
  const urlInput = document.getElementById('link-url');
  const url = urlInput.value.trim();

  // Only auto-fill if URL is provided and name is empty
  if (url && !nameInput.value.trim()) {
    try {
      new URL(url);
      const titleResult = await api.getPageTitle(url);
      if (titleResult && titleResult.title) {
        nameInput.value = titleResult.title;
      }
    } catch {
      // Invalid URL, do nothing
    }
  }
}

function hideLinkModal() {
  document.getElementById('link-modal').classList.add('hidden');
  state.editingLink = null;
}

async function fetchFavicon(url) {
  try {
    const response = await fetch(`${BASE_PATH}/api/favicon?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const faviconUrl = `${BASE_PATH}/api/favicon?url=${encodeURIComponent(url)}`;

      // Validate favicon dimensions - reject if too small (1x1 pixels)
      const isValidSize = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve(img.naturalWidth >= 8 && img.naturalHeight >= 8);
        };
        img.onerror = () => {
          resolve(false);
        };
        img.src = faviconUrl;
      });

      if (isValidSize) {
        return faviconUrl;
      }
    }
  } catch (error) {
    // Silently fail - will use fallback emoji
  }
  return null;
}

async function handleSaveLink(e) {
  e.preventDefault();

  const name = document.getElementById('link-name').value.trim();
  const url = document.getElementById('link-url').value.trim();
  const fallbackEmoji = document.getElementById('link-emoji').value.trim();
  const errorEl = document.getElementById('link-error');

  if (!name || !url) {
    errorEl.textContent = 'Name and URL are required';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    new URL(url);
  } catch {
    errorEl.textContent = 'Invalid URL';
    errorEl.classList.remove('hidden');
    return;
  }

  let linkToSave;

  if (state.editingLink) {
    // Update existing link
    const index = state.links.findIndex(l => l.id === state.editingLink.id);
    if (index !== -1) {
      linkToSave = { ...state.links[index], name, url, fallbackEmoji };

      // If URL changed, fetch new favicon
      if (state.links[index].url !== url) {
        linkToSave.faviconUrl = await fetchFavicon(url);
      }

      state.links[index] = linkToSave;
    }
  } else {
    // Add new link
    const newLink = {
      id: crypto.randomUUID(),
      name,
      url,
      fallbackEmoji,
      order: state.links.length,
      faviconUrl: await fetchFavicon(url)
    };
    state.links.push(newLink);
  }

  const result = await api.saveLinks(state.links);
  if (result.success) {
    hideLinkModal();
    renderLinks();
  } else {
    errorEl.textContent = result.error || 'Failed to save link';
    errorEl.classList.remove('hidden');
  }
}

// Make these functions global so they can be called from onclick
window.editLink = function(id) {
  const link = state.links.find(l => l.id === id);
  if (link) {
    state.editingLink = link;
    showLinkModal();
  }
};

window.deleteLink = async function(id) {
  if (!confirm('Are you sure you want to delete this link?')) {
    return;
  }

  state.links = state.links.filter(l => l.id !== id);

  // Reorder remaining links
  state.links.forEach((link, index) => {
    link.order = index;
  });

  await api.saveLinks(state.links);
  renderLinks();
};

// Settings Modal
function showSettingsModal() {
  document.getElementById('settings-modal').classList.remove('hidden');
  document.getElementById('page-title').value = state.preferences.pageTitle || 'Simple Linkz';
  updateThemeButtons();
  updateAccentButtons();
  updateBackgroundButtons();
  updateBackgroundColorVisibility();
}

function hideSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
  // Reload the page to ensure all color changes take effect
  window.location.reload();
}

async function handleLogout() {
  hideSettingsModal();
  await api.logout();
  showLoginScreen();
}

async function handleResetCredentials() {
  if (!confirm('Are you sure you want to reset your credentials? This will log you out and require you to create a new username and password.')) {
    return;
  }

  hideSettingsModal();
  const res = await fetch(`${BASE_PATH}/api/reset-credentials`, { method: 'POST' });
  if (res.ok) {
    showSetupScreen();
  }
}

async function handleExport() {
  const data = await api.exportData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'simple-linkz-export.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      const result = await api.importData(data);
      if (result.success) {
        await loadLinks();
        await loadPreferences();
        applyTheme();
        renderLinks();
        hideSettingsModal();
      } else {
        alert('Import failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Invalid import file');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset file input
}

// Drag and Drop
let draggedElement = null;

function setupDragAndDrop() {
  const linkElements = document.querySelectorAll('[data-link-id]');

  linkElements.forEach(el => {
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('drop', handleDrop);
    el.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    const draggedId = draggedElement.dataset.linkId;
    const targetId = this.dataset.linkId;

    const draggedIndex = state.links.findIndex(l => l.id === draggedId);
    const targetIndex = state.links.findIndex(l => l.id === targetId);

    // Reorder array
    const [removed] = state.links.splice(draggedIndex, 1);
    state.links.splice(targetIndex, 0, removed);

    // Update order values
    state.links.forEach((link, index) => {
      link.order = index;
    });

    // Save and re-render
    api.saveLinks(state.links);
    renderLinks();
  }

  return false;
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  draggedElement = null;
}

// Start the app
init();
