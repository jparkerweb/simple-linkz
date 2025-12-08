const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Current schema version - increment when data structure changes
const CURRENT_SCHEMA_VERSION = 1;

// Storage cache - in-memory cache with debounced writes
let dataCache = null;
let writeTimeout = null;
let pendingWrite = false;
const WRITE_DELAY = 500; // 500ms debounce

// Default data structure
const DEFAULT_DATA = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  sessionSecret: null,
  user: null,
  preferences: {
    layout: 'grid',
    pageTitle: 'Simple Linkz',
    // Theme settings
    themePreset: 'midnight',        // Theme preset name
    accentColor: '#3b82f6',         // Accent/button color (hex)
    backgroundColor: 'noir',        // Page background (preset name)
    // Custom styling
    customCss: {
      borderRadius: '0.625rem',
      fontFamily: 'system-ui',
      linkGap: '1rem'
    }
  },
  links: [],
  // Link structure includes: { id, name, url, order, faviconUrl, fallbackEmoji, tags,
  //   iconType: 'favicon' | 'material' | 'fontawesome' | 'custom',
  //   iconValue: null | iconId | filename }
  tags: [],         // Tag structure: { id: "uuid", name: "Work", color: "#3B82F6" }
  customIcons: [],  // Custom icon structure: { id: "uuid", filename: "icon.png", uploadedAt: timestamp }
  sessions: {},
  rateLimiting: {
    attempts: {},   // { "ip": [timestamp1, timestamp2, ...] }
    blocked: {}     // { "ip": { until: timestamp, blockCount: number } }
  },
  csrfTokens: {}    // { "sessionToken": "csrfToken" }
};

/**
 * Initialize data.json with defaults if it doesn't exist
 */
async function initializeData() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Check if data file exists
    try {
      await fs.access(DATA_FILE);
    } catch (error) {
      // File doesn't exist, create it
      const data = { ...DEFAULT_DATA };
      data.sessionSecret = crypto.randomBytes(32).toString('hex');
      await writeToDisk(data);
    }

    // Load data into cache
    const content = await fs.readFile(DATA_FILE, 'utf8');
    dataCache = JSON.parse(content);

    let needsWrite = false;

    // Add schemaVersion if missing (upgrade from pre-v2 installations)
    if (dataCache.schemaVersion === undefined) {
      dataCache.schemaVersion = 1;
      needsWrite = true;
    }

    // Add rateLimiting if missing (upgrade for security hardening)
    if (!dataCache.rateLimiting) {
      dataCache.rateLimiting = {
        attempts: {},
        blocked: {}
      };
      needsWrite = true;
    }

    // Add csrfTokens if missing (upgrade for security hardening)
    if (!dataCache.csrfTokens) {
      dataCache.csrfTokens = {};
      needsWrite = true;
    }

    // Add tags array if missing (upgrade for tag system)
    if (!dataCache.tags) {
      dataCache.tags = [];
      needsWrite = true;
    }

    // Ensure all links have a tags array (upgrade for tag system)
    if (dataCache.links && Array.isArray(dataCache.links)) {
      dataCache.links = dataCache.links.map(link => {
        if (!link.tags) {
          needsWrite = true;
          return { ...link, tags: [] };
        }
        return link;
      });
    }

    // Add customCss if missing (upgrade for theme engine)
    if (dataCache.preferences && !dataCache.preferences.customCss) {
      dataCache.preferences.customCss = {
        borderRadius: '0.625rem',
        fontFamily: 'system-ui',
        linkGap: '1rem'
      };
      needsWrite = true;
    }

    // Migrate to new theme preset system
    if (dataCache.preferences) {
      // Add themePreset if missing
      if (!dataCache.preferences.themePreset) {
        dataCache.preferences.themePreset = 'midnight';
        needsWrite = true;
      }
      // Add accentColor if missing (or migrate from buttonColor)
      if (!dataCache.preferences.accentColor) {
        dataCache.preferences.accentColor = dataCache.preferences.buttonColor || '#3b82f6';
        needsWrite = true;
      }
      // Remove deprecated color fields from old system
      if (dataCache.preferences.buttonColor !== undefined) {
        delete dataCache.preferences.buttonColor;
        needsWrite = true;
      }
      if (dataCache.preferences.buttonTextColor !== undefined) {
        delete dataCache.preferences.buttonTextColor;
        needsWrite = true;
      }
      if (dataCache.preferences.cardColor !== undefined) {
        delete dataCache.preferences.cardColor;
        needsWrite = true;
      }
      if (dataCache.preferences.cardTextColor !== undefined) {
        delete dataCache.preferences.cardTextColor;
        needsWrite = true;
      }
      // Remove other deprecated fields
      if (dataCache.preferences.theme !== undefined) {
        delete dataCache.preferences.theme;
        needsWrite = true;
      }
      if (dataCache.preferences.themeBundle !== undefined) {
        delete dataCache.preferences.themeBundle;
        needsWrite = true;
      }
      // Remove cardShadow from customCss (now handled by theme presets)
      if (dataCache.preferences.customCss && dataCache.preferences.customCss.cardShadow !== undefined) {
        delete dataCache.preferences.customCss.cardShadow;
        needsWrite = true;
      }
    }

    // Add customIcons array if missing (upgrade for icon system)
    if (!dataCache.customIcons) {
      dataCache.customIcons = [];
      needsWrite = true;
    }

    // Ensure all links have iconType and iconValue (upgrade for icon system)
    if (dataCache.links && Array.isArray(dataCache.links)) {
      dataCache.links = dataCache.links.map(link => {
        if (link.iconType === undefined) {
          needsWrite = true;
          return { ...link, iconType: 'favicon', iconValue: null };
        }
        return link;
      });
    }

    // Write if any migrations were applied
    if (needsWrite) {
      await writeToDisk(dataCache);
    }
  } catch (error) {
    console.error('Error initializing data:', error);
    throw error;
  }
}

/**
 * Read data from cache (returns deep copy to prevent mutation)
 */
async function readData() {
  // If cache is populated, return deep copy
  if (dataCache !== null) {
    return JSON.parse(JSON.stringify(dataCache));
  }

  // Fallback to file read if cache not populated (shouldn't happen after init)
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(content);
    dataCache = data;
    return JSON.parse(JSON.stringify(dataCache));
  } catch (error) {
    console.error('Error reading data file:', error);
    throw error;
  }
}

/**
 * Write data to disk atomically (internal function)
 */
async function writeToDisk(data) {
  try {
    const tempFile = DATA_FILE + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempFile, DATA_FILE);
    pendingWrite = false;
  } catch (error) {
    console.error('Error writing data file:', error);
    throw error;
  }
}

/**
 * Write data with debouncing - updates cache immediately, writes to disk after delay
 */
async function writeData(data) {
  // Update in-memory cache immediately with deep copy
  dataCache = JSON.parse(JSON.stringify(data));

  // Clear existing timeout if any
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }

  // Set pending flag
  pendingWrite = true;

  // Schedule disk write after delay
  writeTimeout = setTimeout(async () => {
    try {
      await writeToDisk(dataCache);
    } catch (error) {
      console.error('Error in debounced write:', error);
    }
  }, WRITE_DELAY);
}

/**
 * Get user credentials
 */
async function getUser() {
  const data = await readData();
  return data.user || null;
}

/**
 * Set user credentials
 */
async function setUser(username, passwordHash) {
  const data = await readData();
  if (username === null && passwordHash === null) {
    data.user = null;
  } else {
    data.user = { username, passwordHash };
  }
  await writeData(data);
}

/**
 * Get all tags
 */
async function getTags() {
  const data = await readData();
  return data.tags || [];
}

/**
 * Save tags array
 */
async function saveTags(tags) {
  const data = await readData();
  data.tags = tags;
  await writeData(data);
}

/**
 * Get all links
 */
async function getLinks() {
  const data = await readData();
  return data.links || [];
}

/**
 * Save links array
 */
async function saveLinks(links) {
  const data = await readData();
  data.links = links;
  await writeData(data);
}

/**
 * Get user preferences
 */
async function getPreferences() {
  const data = await readData();
  return data.preferences || DEFAULT_DATA.preferences;
}

/**
 * Save user preferences
 */
async function savePreferences(preferences) {
  const data = await readData();
  data.preferences = preferences;
  await writeData(data);
}

/**
 * Get session secret
 */
async function getSessionSecret() {
  const data = await readData();
  return data.sessionSecret;
}

/**
 * Get all sessions
 */
async function getSessions() {
  const data = await readData();
  return data.sessions || {};
}

/**
 * Save sessions
 */
async function saveSessions(sessions) {
  const data = await readData();
  data.sessions = sessions;
  await writeData(data);
}

/**
 * Flush any pending writes to disk (for graceful shutdown)
 */
async function flushPendingWrites() {
  if (writeTimeout) {
    clearTimeout(writeTimeout);
    writeTimeout = null;
  }
  if (pendingWrite && dataCache !== null) {
    await writeToDisk(dataCache);
  }
}

/**
 * Get all custom icons
 */
async function getCustomIcons() {
  const data = await readData();
  return data.customIcons || [];
}

/**
 * Save custom icons array
 */
async function saveCustomIcons(customIcons) {
  const data = await readData();
  data.customIcons = customIcons;
  await writeData(data);
}

module.exports = {
  initializeData,
  readData,
  writeData,
  getUser,
  setUser,
  getTags,
  saveTags,
  getLinks,
  saveLinks,
  getPreferences,
  savePreferences,
  getSessionSecret,
  getSessions,
  saveSessions,
  flushPendingWrites,
  getCustomIcons,
  saveCustomIcons
};
