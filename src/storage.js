const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');

// Default data structure
const DEFAULT_DATA = {
  sessionSecret: null,
  user: null,
  preferences: {
    layout: 'grid',
    theme: 'dark',
    accentColor: 'blue',
    backgroundColor: 'gray', // Light: white/gray/slate, Dark: gray/slate/zinc
    pageTitle: 'Simple Linkz'
  },
  links: [],
  sessions: {}
};

/**
 * Initialize data.json with defaults if it doesn't exist
 */
async function initializeData() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Check if data file exists
    await fs.access(DATA_FILE);
  } catch (error) {
    // File doesn't exist, create it
    const data = { ...DEFAULT_DATA };
    data.sessionSecret = crypto.randomBytes(32).toString('hex');
    await writeData(data);
  }
}

/**
 * Read and parse data.json
 */
async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading data file:', error);
    throw error;
  }
}

/**
 * Write data to data.json atomically
 */
async function writeData(data) {
  try {
    const tempFile = DATA_FILE + '.tmp';
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempFile, DATA_FILE);
  } catch (error) {
    console.error('Error writing data file:', error);
    throw error;
  }
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

module.exports = {
  initializeData,
  readData,
  writeData,
  getUser,
  setUser,
  getLinks,
  saveLinks,
  getPreferences,
  savePreferences,
  getSessionSecret,
  getSessions,
  saveSessions
};
