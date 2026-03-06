// Get base path from injected window variable (set by server if BASE_PATH env var is defined)
const BASE_PATH = window.BASE_PATH || '';

// ─────────────────────────────────────────────────────────────────────────────
// Toast Notification System
// ─────────────────────────────────────────────────────────────────────────────
const toastQueue = [];
const MAX_TOASTS = 3;

function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.addEventListener('click', () => dismissToast(toast));

  container.appendChild(toast);
  toastQueue.push(toast);

  // Remove oldest if over max
  while (toastQueue.length > MAX_TOASTS) {
    dismissToast(toastQueue[0]);
  }

  // Auto-dismiss
  setTimeout(() => dismissToast(toast), duration);
}

function dismissToast(toast) {
  if (!toast || !toast.parentElement) return;
  const idx = toastQueue.indexOf(toast);
  if (idx > -1) toastQueue.splice(idx, 1);
  toast.classList.add('toast-exit');
  toast.addEventListener('animationend', () => toast.remove(), { once: true });
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal Animation Helpers
// ─────────────────────────────────────────────────────────────────────────────
function openModal(modalEl) {
  modalEl.classList.remove('hidden');
  modalEl.classList.add('modal-entering');
  modalEl.classList.remove('modal-visible', 'modal-exiting');
  // Force reflow to trigger transition
  modalEl.offsetHeight;
  modalEl.classList.remove('modal-entering');
  modalEl.classList.add('modal-visible');
}

function closeModal(modalEl, callback) {
  modalEl.classList.remove('modal-visible');
  modalEl.classList.add('modal-exiting');
  let done = false;
  const onEnd = () => {
    if (done) return;
    done = true;
    modalEl.classList.remove('modal-exiting');
    modalEl.classList.add('hidden');
    if (callback) callback();
  };
  const panel = modalEl.querySelector(':scope > div');
  if (panel) {
    panel.addEventListener('transitionend', function handler(e) {
      if (e.target === panel) {
        panel.removeEventListener('transitionend', handler);
        onEnd();
      }
    });
  }
  setTimeout(onEnd, 300);
}

// ─────────────────────────────────────────────────────────────────────────────
// Button Loading State Helpers
// ─────────────────────────────────────────────────────────────────────────────
function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.classList.add('btn-loading');
    const span = document.createElement('span');
    span.className = 'btn-text';
    span.textContent = btn.textContent;
    btn.textContent = '';
    btn.appendChild(span);
    btn.disabled = true;
  } else {
    btn.classList.remove('btn-loading');
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    delete btn.dataset.originalText;
  }
}

// Background color definitions with hex values
const BACKGROUND_COLORS = {
  // Light colors
  white: '#ffffff',
  stone: '#f5f5f4',
  slate: '#f1f5f9',
  sky: '#e0f2fe',
  mint: '#d1fae5',
  cream: '#fef3c7',
  peach: '#ffedd5',
  rose: '#ffe4e6',
  // Dark colors
  charcoal: '#1f2937',
  graphite: '#27272a',
  navy: '#1e3a5f',
  ocean: '#164e63',
  forest: '#14532d',
  espresso: '#422006',
  plum: '#3b0764',
  noir: '#0a0a0a'
};

// Curated theme presets - each defines surface, text, and border colors
const THEME_PRESETS = {
  midnight: {
    name: 'Midnight',
    surface: '#1a1a1a',
    surfaceHover: '#252525',
    text: '#e5e5e5',
    textMuted: 'rgba(255, 255, 255, 0.5)',
    border: 'rgba(255, 255, 255, 0.08)'
  },
  slate: {
    name: 'Slate',
    surface: '#1e293b',
    surfaceHover: '#334155',
    text: '#f1f5f9',
    textMuted: 'rgba(241, 245, 249, 0.5)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  ocean: {
    name: 'Ocean',
    surface: '#0c4a6e',
    surfaceHover: '#075985',
    text: '#e0f2fe',
    textMuted: 'rgba(224, 242, 254, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  forest: {
    name: 'Forest',
    surface: '#14532d',
    surfaceHover: '#166534',
    text: '#dcfce7',
    textMuted: 'rgba(220, 252, 231, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  ember: {
    name: 'Ember',
    surface: '#451a03',
    surfaceHover: '#7c2d12',
    text: '#ffedd5',
    textMuted: 'rgba(255, 237, 213, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  lavender: {
    name: 'Lavender',
    surface: '#3b0764',
    surfaceHover: '#581c87',
    text: '#f5d0fe',
    textMuted: 'rgba(245, 208, 254, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  sand: {
    name: 'Sand',
    surface: '#fef3c7',
    surfaceHover: '#fde68a',
    text: '#451a03',
    textMuted: 'rgba(69, 26, 3, 0.6)',
    border: 'rgba(0, 0, 0, 0.1)'
  },
  arctic: {
    name: 'Arctic',
    surface: '#f8fafc',
    surfaceHover: '#f1f5f9',
    text: '#0f172a',
    textMuted: 'rgba(15, 23, 42, 0.5)',
    border: 'rgba(0, 0, 0, 0.08)'
  },
  cherry: {
    name: 'Cherry',
    surface: '#4c0519',
    surfaceHover: '#7f1d1d',
    text: '#fecdd3',
    textMuted: 'rgba(254, 205, 211, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  mocha: {
    name: 'Mocha',
    surface: '#3d2817',
    surfaceHover: '#5c3d24',
    text: '#fde8d8',
    textMuted: 'rgba(253, 232, 216, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  teal: {
    name: 'Teal',
    surface: '#134e4a',
    surfaceHover: '#115e59',
    text: '#ccfbf1',
    textMuted: 'rgba(204, 251, 241, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  blush: {
    name: 'Blush',
    surface: '#fdf2f8',
    surfaceHover: '#fce7f3',
    text: '#831843',
    textMuted: 'rgba(131, 24, 67, 0.6)',
    border: 'rgba(0, 0, 0, 0.08)'
  },
  sapphire: {
    name: 'Sapphire',
    surface: '#1e3a5f',
    surfaceHover: '#264b7a',
    text: '#e0efff',
    textMuted: 'rgba(224, 239, 255, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  mint: {
    name: 'Mint',
    surface: '#ecfdf5',
    surfaceHover: '#d1fae5',
    text: '#064e3b',
    textMuted: 'rgba(6, 78, 59, 0.6)',
    border: 'rgba(0, 0, 0, 0.08)'
  },
  rose: {
    name: 'Rose',
    surface: '#500724',
    surfaceHover: '#6b1030',
    text: '#ffe4e6',
    textMuted: 'rgba(255, 228, 230, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  storm: {
    name: 'Storm',
    surface: '#27273a',
    surfaceHover: '#363652',
    text: '#e2e2f0',
    textMuted: 'rgba(226, 226, 240, 0.5)',
    border: 'rgba(255, 255, 255, 0.08)'
  },
  sunset: {
    name: 'Sunset',
    surface: '#5c2d3b',
    surfaceHover: '#7a3d50',
    text: '#ffecd2',
    textMuted: 'rgba(255, 236, 210, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  olive: {
    name: 'Olive',
    surface: '#3d3d2b',
    surfaceHover: '#52523a',
    text: '#f5f5dc',
    textMuted: 'rgba(245, 245, 220, 0.6)',
    border: 'rgba(255, 255, 255, 0.1)'
  },
  paper: {
    name: 'Paper',
    surface: '#fffef5',
    surfaceHover: '#faf8e8',
    text: '#1c1917',
    textMuted: 'rgba(28, 25, 23, 0.5)',
    border: 'rgba(0, 0, 0, 0.08)'
  },
  graphite: {
    name: 'Graphite',
    surface: '#2d2d2d',
    surfaceHover: '#3d3d3d',
    text: '#d4d4d4',
    textMuted: 'rgba(212, 212, 212, 0.5)',
    border: 'rgba(255, 255, 255, 0.08)'
  }
};

// Icon Registry - Available icons from each pack
const ICON_REGISTRY = {
  material: [
    // Navigation & Actions
    { id: 'home', name: 'Home', keywords: ['house', 'main'] },
    { id: 'search', name: 'Search', keywords: ['find', 'magnify'] },
    { id: 'settings', name: 'Settings', keywords: ['gear', 'config', 'cog'] },
    { id: 'menu', name: 'Menu', keywords: ['hamburger', 'nav'] },
    { id: 'close', name: 'Close', keywords: ['x', 'exit'] },
    { id: 'add', name: 'Add', keywords: ['plus', 'new', 'create'] },
    { id: 'remove', name: 'Remove', keywords: ['minus', 'delete'] },
    { id: 'edit', name: 'Edit', keywords: ['pencil', 'modify'] },
    { id: 'delete', name: 'Delete', keywords: ['trash', 'remove'] },
    { id: 'check', name: 'Check', keywords: ['done', 'complete', 'tick'] },
    { id: 'arrow_back', name: 'Arrow Back', keywords: ['left', 'previous'] },
    { id: 'arrow_forward', name: 'Arrow Forward', keywords: ['right', 'next'] },
    { id: 'arrow_upward', name: 'Arrow Up', keywords: ['up', 'top'] },
    { id: 'arrow_downward', name: 'Arrow Down', keywords: ['down', 'bottom'] },
    { id: 'arrow_drop_down', name: 'Dropdown', keywords: ['expand', 'select'] },
    { id: 'arrow_drop_up', name: 'Drop Up', keywords: ['collapse'] },
    { id: 'chevron_left', name: 'Chevron Left', keywords: ['back', 'previous'] },
    { id: 'chevron_right', name: 'Chevron Right', keywords: ['next', 'forward'] },
    { id: 'expand_more', name: 'Expand More', keywords: ['dropdown', 'down'] },
    { id: 'expand_less', name: 'Expand Less', keywords: ['collapse', 'up'] },
    { id: 'first_page', name: 'First Page', keywords: ['start', 'begin'] },
    { id: 'last_page', name: 'Last Page', keywords: ['end', 'finish'] },
    { id: 'refresh', name: 'Refresh', keywords: ['reload', 'sync'] },
    { id: 'sync', name: 'Sync', keywords: ['refresh', 'update'] },
    { id: 'cached', name: 'Cached', keywords: ['refresh', 'reload'] },
    { id: 'more_vert', name: 'More Vertical', keywords: ['dots', 'options'] },
    { id: 'more_horiz', name: 'More Horizontal', keywords: ['dots', 'options'] },
    { id: 'apps', name: 'Apps', keywords: ['grid', 'menu'] },
    { id: 'sort', name: 'Sort', keywords: ['order', 'arrange'] },
    { id: 'filter_list', name: 'Filter', keywords: ['sort', 'funnel'] },
    { id: 'fullscreen', name: 'Fullscreen', keywords: ['expand', 'maximize'] },
    { id: 'fullscreen_exit', name: 'Exit Fullscreen', keywords: ['minimize'] },
    { id: 'open_in_new', name: 'Open in New', keywords: ['external', 'link'] },
    { id: 'open_in_browser', name: 'Open in Browser', keywords: ['external'] },
    { id: 'launch', name: 'Launch', keywords: ['open', 'external'] },
    { id: 'input', name: 'Input', keywords: ['arrow', 'enter'] },
    { id: 'output', name: 'Output', keywords: ['arrow', 'exit'] },
    { id: 'undo', name: 'Undo', keywords: ['back', 'revert'] },
    { id: 'redo', name: 'Redo', keywords: ['forward', 'repeat'] },
    { id: 'replay', name: 'Replay', keywords: ['repeat', 'again'] },
    { id: 'double_arrow', name: 'Double Arrow', keywords: ['fast', 'skip'] },
    // Communication
    { id: 'email', name: 'Email', keywords: ['mail', 'message'] },
    { id: 'mail', name: 'Mail', keywords: ['email', 'message', 'envelope'] },
    { id: 'inbox', name: 'Inbox', keywords: ['mail', 'messages'] },
    { id: 'drafts', name: 'Drafts', keywords: ['mail', 'edit'] },
    { id: 'send', name: 'Send', keywords: ['mail', 'submit'] },
    { id: 'forward_to_inbox', name: 'Forward', keywords: ['mail', 'redirect'] },
    { id: 'mark_email_read', name: 'Read Email', keywords: ['mail', 'open'] },
    { id: 'mark_email_unread', name: 'Unread Email', keywords: ['mail', 'new'] },
    { id: 'chat', name: 'Chat', keywords: ['message', 'talk'] },
    { id: 'chat_bubble', name: 'Chat Bubble', keywords: ['message', 'comment'] },
    { id: 'forum', name: 'Forum', keywords: ['discussion', 'messages'] },
    { id: 'question_answer', name: 'Q&A', keywords: ['chat', 'discussion'] },
    { id: 'comment', name: 'Comment', keywords: ['message', 'feedback'] },
    { id: 'textsms', name: 'SMS', keywords: ['message', 'text'] },
    { id: 'message', name: 'Message', keywords: ['chat', 'text'] },
    { id: 'notifications', name: 'Notifications', keywords: ['bell', 'alert'] },
    { id: 'notifications_active', name: 'Active Notifications', keywords: ['bell', 'ringing'] },
    { id: 'notifications_off', name: 'Notifications Off', keywords: ['bell', 'mute'] },
    { id: 'notification_important', name: 'Important', keywords: ['bell', 'urgent'] },
    { id: 'phone', name: 'Phone', keywords: ['call', 'mobile'] },
    { id: 'phone_in_talk', name: 'On Call', keywords: ['talking', 'active'] },
    { id: 'phone_callback', name: 'Callback', keywords: ['call', 'return'] },
    { id: 'phone_forwarded', name: 'Forwarded', keywords: ['call', 'redirect'] },
    { id: 'phone_missed', name: 'Missed Call', keywords: ['call'] },
    { id: 'call', name: 'Call', keywords: ['phone', 'dial'] },
    { id: 'call_end', name: 'End Call', keywords: ['hangup', 'phone'] },
    { id: 'voicemail', name: 'Voicemail', keywords: ['message', 'audio'] },
    { id: 'contacts', name: 'Contacts', keywords: ['people', 'address'] },
    { id: 'contact_phone', name: 'Contact Phone', keywords: ['people', 'call'] },
    { id: 'contact_mail', name: 'Contact Mail', keywords: ['people', 'email'] },
    { id: 'share', name: 'Share', keywords: ['social', 'send'] },
    { id: 'alternate_email', name: 'At Symbol', keywords: ['email', 'mention'] },
    { id: 'rss_feed', name: 'RSS Feed', keywords: ['subscribe', 'news'] },
    // Content & Files
    { id: 'link', name: 'Link', keywords: ['chain', 'url'] },
    { id: 'link_off', name: 'Unlink', keywords: ['broken', 'disconnect'] },
    { id: 'add_link', name: 'Add Link', keywords: ['chain', 'new'] },
    { id: 'folder', name: 'Folder', keywords: ['directory', 'files'] },
    { id: 'folder_open', name: 'Folder Open', keywords: ['directory'] },
    { id: 'folder_shared', name: 'Shared Folder', keywords: ['directory', 'team'] },
    { id: 'folder_special', name: 'Special Folder', keywords: ['directory', 'star'] },
    { id: 'create_new_folder', name: 'New Folder', keywords: ['directory', 'add'] },
    { id: 'folder_zip', name: 'Zip Folder', keywords: ['archive', 'compress'] },
    { id: 'file_copy', name: 'File Copy', keywords: ['document', 'duplicate'] },
    { id: 'file_present', name: 'File Present', keywords: ['document', 'exists'] },
    { id: 'file_download', name: 'File Download', keywords: ['document', 'save'] },
    { id: 'file_upload', name: 'File Upload', keywords: ['document', 'send'] },
    { id: 'upload_file', name: 'Upload File', keywords: ['document', 'add'] },
    { id: 'cloud', name: 'Cloud', keywords: ['storage', 'online'] },
    { id: 'cloud_done', name: 'Cloud Done', keywords: ['storage', 'synced'] },
    { id: 'cloud_download', name: 'Cloud Download', keywords: ['storage'] },
    { id: 'cloud_upload', name: 'Cloud Upload', keywords: ['storage'] },
    { id: 'cloud_queue', name: 'Cloud Queue', keywords: ['storage', 'pending'] },
    { id: 'cloud_off', name: 'Cloud Off', keywords: ['offline', 'disconnected'] },
    { id: 'cloud_sync', name: 'Cloud Sync', keywords: ['storage', 'refresh'] },
    { id: 'backup', name: 'Backup', keywords: ['cloud', 'save'] },
    { id: 'restore', name: 'Restore', keywords: ['backup', 'recover'] },
    { id: 'description', name: 'Description', keywords: ['document', 'file'] },
    { id: 'article', name: 'Article', keywords: ['news', 'post', 'blog'] },
    { id: 'feed', name: 'Feed', keywords: ['news', 'stream'] },
    { id: 'newspaper', name: 'Newspaper', keywords: ['news', 'article'] },
    { id: 'content_copy', name: 'Copy', keywords: ['duplicate', 'clipboard'] },
    { id: 'content_cut', name: 'Cut', keywords: ['scissors', 'remove'] },
    { id: 'content_paste', name: 'Paste', keywords: ['clipboard', 'insert'] },
    { id: 'assignment', name: 'Assignment', keywords: ['clipboard', 'task'] },
    { id: 'note', name: 'Note', keywords: ['memo', 'sticky'] },
    { id: 'note_add', name: 'Add Note', keywords: ['memo', 'new'] },
    { id: 'sticky_note_2', name: 'Sticky Note', keywords: ['memo', 'post-it'] },
    { id: 'text_snippet', name: 'Text Snippet', keywords: ['code', 'document'] },
    { id: 'source', name: 'Source', keywords: ['code', 'document'] },
    { id: 'inventory', name: 'Inventory', keywords: ['box', 'package'] },
    { id: 'archive', name: 'Archive', keywords: ['box', 'storage'] },
    { id: 'unarchive', name: 'Unarchive', keywords: ['box', 'restore'] },
    // Media - Images & Photos
    { id: 'image', name: 'Image', keywords: ['photo', 'picture'] },
    { id: 'photo', name: 'Photo', keywords: ['image', 'picture'] },
    { id: 'photo_library', name: 'Photo Library', keywords: ['gallery', 'images'] },
    { id: 'photo_album', name: 'Photo Album', keywords: ['gallery', 'collection'] },
    { id: 'collections', name: 'Collections', keywords: ['gallery', 'photos'] },
    { id: 'image_search', name: 'Image Search', keywords: ['photo', 'find'] },
    { id: 'broken_image', name: 'Broken Image', keywords: ['error', 'missing'] },
    { id: 'hide_image', name: 'Hide Image', keywords: ['hidden', 'invisible'] },
    { id: 'add_photo_alternate', name: 'Add Photo', keywords: ['image', 'new'] },
    { id: 'camera', name: 'Camera', keywords: ['photo', 'capture'] },
    { id: 'camera_alt', name: 'Camera Alt', keywords: ['photo', 'capture'] },
    { id: 'photo_camera', name: 'Photo Camera', keywords: ['capture', 'picture'] },
    { id: 'videocam', name: 'Video Camera', keywords: ['movie', 'film'] },
    { id: 'videocam_off', name: 'Video Off', keywords: ['camera', 'disabled'] },
    { id: 'video_call', name: 'Video Call', keywords: ['camera', 'meeting'] },
    { id: 'video_library', name: 'Video Library', keywords: ['movies', 'collection'] },
    { id: 'slideshow', name: 'Slideshow', keywords: ['presentation', 'photos'] },
    { id: 'panorama', name: 'Panorama', keywords: ['wide', 'photo'] },
    { id: 'filter', name: 'Filter', keywords: ['photo', 'effect'] },
    { id: 'auto_fix_high', name: 'Auto Fix', keywords: ['magic', 'enhance'] },
    { id: 'tune', name: 'Tune', keywords: ['adjust', 'settings'] },
    { id: 'crop', name: 'Crop', keywords: ['cut', 'resize'] },
    { id: 'rotate_left', name: 'Rotate Left', keywords: ['turn', 'image'] },
    { id: 'rotate_right', name: 'Rotate Right', keywords: ['turn', 'image'] },
    { id: 'flip', name: 'Flip', keywords: ['mirror', 'image'] },
    { id: 'compare', name: 'Compare', keywords: ['before', 'after'] },
    // Media - Audio & Music
    { id: 'music_note', name: 'Music Note', keywords: ['audio', 'song'] },
    { id: 'music_off', name: 'Music Off', keywords: ['mute', 'silent'] },
    { id: 'queue_music', name: 'Music Queue', keywords: ['playlist', 'songs'] },
    { id: 'library_music', name: 'Music Library', keywords: ['collection', 'songs'] },
    { id: 'album', name: 'Album', keywords: ['music', 'cd'] },
    { id: 'audiotrack', name: 'Audio Track', keywords: ['music', 'song'] },
    { id: 'headphones', name: 'Headphones', keywords: ['audio', 'listen'] },
    { id: 'headset', name: 'Headset', keywords: ['audio', 'microphone'] },
    { id: 'headset_mic', name: 'Headset Mic', keywords: ['audio', 'support'] },
    { id: 'speaker', name: 'Speaker', keywords: ['audio', 'sound'] },
    { id: 'speaker_group', name: 'Speakers', keywords: ['audio', 'surround'] },
    { id: 'volume_up', name: 'Volume Up', keywords: ['sound', 'loud'] },
    { id: 'volume_down', name: 'Volume Down', keywords: ['sound', 'quiet'] },
    { id: 'volume_mute', name: 'Volume Mute', keywords: ['sound', 'silent'] },
    { id: 'volume_off', name: 'Volume Off', keywords: ['mute', 'silent'] },
    { id: 'mic', name: 'Microphone', keywords: ['audio', 'record'] },
    { id: 'mic_off', name: 'Mic Off', keywords: ['mute', 'silent'] },
    { id: 'mic_none', name: 'Mic Empty', keywords: ['audio', 'record'] },
    { id: 'radio', name: 'Radio', keywords: ['broadcast', 'music'] },
    { id: 'equalizer', name: 'Equalizer', keywords: ['audio', 'levels'] },
    { id: 'graphic_eq', name: 'Graphic EQ', keywords: ['audio', 'spectrum'] },
    // Media - Video & Playback
    { id: 'play_arrow', name: 'Play', keywords: ['start', 'video'] },
    { id: 'play_circle', name: 'Play Circle', keywords: ['start', 'video'] },
    { id: 'pause', name: 'Pause', keywords: ['stop'] },
    { id: 'pause_circle', name: 'Pause Circle', keywords: ['stop'] },
    { id: 'stop', name: 'Stop', keywords: ['end', 'halt'] },
    { id: 'stop_circle', name: 'Stop Circle', keywords: ['end'] },
    { id: 'skip_next', name: 'Skip Next', keywords: ['forward'] },
    { id: 'skip_previous', name: 'Skip Previous', keywords: ['back'] },
    { id: 'fast_forward', name: 'Fast Forward', keywords: ['speed', 'skip'] },
    { id: 'fast_rewind', name: 'Rewind', keywords: ['back', 'speed'] },
    { id: 'replay_10', name: 'Replay 10s', keywords: ['back', 'rewind'] },
    { id: 'forward_10', name: 'Forward 10s', keywords: ['skip', 'ahead'] },
    { id: 'replay_30', name: 'Replay 30s', keywords: ['back', 'rewind'] },
    { id: 'forward_30', name: 'Forward 30s', keywords: ['skip', 'ahead'] },
    { id: 'loop', name: 'Loop', keywords: ['repeat', 'cycle'] },
    { id: 'repeat', name: 'Repeat', keywords: ['loop', 'again'] },
    { id: 'repeat_one', name: 'Repeat One', keywords: ['loop', 'single'] },
    { id: 'shuffle', name: 'Shuffle', keywords: ['random', 'mix'] },
    { id: 'movie', name: 'Movie', keywords: ['film', 'video'] },
    { id: 'theaters', name: 'Theaters', keywords: ['movie', 'cinema'] },
    { id: 'live_tv', name: 'Live TV', keywords: ['broadcast', 'stream'] },
    { id: 'ondemand_video', name: 'On Demand', keywords: ['video', 'stream'] },
    { id: 'subscriptions', name: 'Subscriptions', keywords: ['follow', 'channels'] },
    { id: 'playlist_play', name: 'Playlist', keywords: ['queue', 'list'] },
    { id: 'playlist_add', name: 'Add to Playlist', keywords: ['queue', 'new'] },
    { id: 'queue', name: 'Queue', keywords: ['playlist', 'list'] },
    { id: 'podcasts', name: 'Podcasts', keywords: ['audio', 'radio'] },
    { id: 'stream', name: 'Stream', keywords: ['broadcast', 'live'] },
    { id: 'cast', name: 'Cast', keywords: ['chromecast', 'stream'] },
    { id: 'cast_connected', name: 'Cast Connected', keywords: ['chromecast', 'active'] },
    { id: 'airplay', name: 'Airplay', keywords: ['stream', 'apple'] },
    { id: 'connected_tv', name: 'Connected TV', keywords: ['smart', 'stream'] },
    { id: 'subtitles', name: 'Subtitles', keywords: ['captions', 'text'] },
    { id: 'closed_caption', name: 'Closed Caption', keywords: ['subtitles', 'text'] },
    { id: 'hd', name: 'HD', keywords: ['quality', 'high'] },
    { id: '4k', name: '4K', keywords: ['quality', 'ultra'] },
    { id: 'high_quality', name: 'High Quality', keywords: ['hd', 'best'] },
    { id: 'speed', name: 'Speed', keywords: ['playback', 'rate'] },
    { id: 'slow_motion_video', name: 'Slow Motion', keywords: ['speed', 'video'] },
    // Social & People
    { id: 'person', name: 'Person', keywords: ['user', 'profile'] },
    { id: 'person_outline', name: 'Person Outline', keywords: ['user', 'profile'] },
    { id: 'person_add', name: 'Add Person', keywords: ['user', 'new'] },
    { id: 'person_remove', name: 'Remove Person', keywords: ['user', 'delete'] },
    { id: 'person_search', name: 'Search Person', keywords: ['user', 'find'] },
    { id: 'person_off', name: 'Person Off', keywords: ['user', 'disabled'] },
    { id: 'people', name: 'People', keywords: ['users', 'group', 'team'] },
    { id: 'people_outline', name: 'People Outline', keywords: ['users', 'group'] },
    { id: 'people_alt', name: 'People Alt', keywords: ['users', 'group'] },
    { id: 'group', name: 'Group', keywords: ['team', 'people'] },
    { id: 'group_add', name: 'Add Group', keywords: ['team', 'new'] },
    { id: 'groups', name: 'Groups', keywords: ['teams', 'people'] },
    { id: 'face', name: 'Face', keywords: ['person', 'emoji'] },
    { id: 'sentiment_satisfied', name: 'Happy', keywords: ['smile', 'emoji'] },
    { id: 'sentiment_dissatisfied', name: 'Sad', keywords: ['frown', 'emoji'] },
    { id: 'sentiment_neutral', name: 'Neutral', keywords: ['meh', 'emoji'] },
    { id: 'mood', name: 'Mood', keywords: ['happy', 'emoji'] },
    { id: 'mood_bad', name: 'Bad Mood', keywords: ['sad', 'emoji'] },
    { id: 'public', name: 'Public', keywords: ['world', 'globe', 'earth'] },
    { id: 'language', name: 'Language', keywords: ['globe', 'translate'] },
    { id: 'translate', name: 'Translate', keywords: ['language', 'convert'] },
    { id: 'thumb_up', name: 'Thumb Up', keywords: ['like', 'approve'] },
    { id: 'thumb_down', name: 'Thumb Down', keywords: ['dislike', 'reject'] },
    { id: 'thumbs_up_down', name: 'Thumbs Up Down', keywords: ['vote', 'rate'] },
    { id: 'favorite', name: 'Favorite', keywords: ['heart', 'love'] },
    { id: 'favorite_border', name: 'Favorite Outline', keywords: ['heart', 'love'] },
    { id: 'star', name: 'Star', keywords: ['bookmark', 'rate'] },
    { id: 'star_border', name: 'Star Outline', keywords: ['bookmark', 'rate'] },
    { id: 'star_half', name: 'Star Half', keywords: ['rate', 'partial'] },
    { id: 'grade', name: 'Grade', keywords: ['star', 'rate'] },
    { id: 'bookmark', name: 'Bookmark', keywords: ['save', 'flag'] },
    { id: 'bookmark_border', name: 'Bookmark Outline', keywords: ['save', 'flag'] },
    { id: 'bookmark_add', name: 'Add Bookmark', keywords: ['save', 'new'] },
    { id: 'bookmarks', name: 'Bookmarks', keywords: ['saved', 'collection'] },
    { id: 'loyalty', name: 'Loyalty', keywords: ['heart', 'badge'] },
    { id: 'celebration', name: 'Celebration', keywords: ['party', 'confetti'] },
    { id: 'emoji_events', name: 'Trophy', keywords: ['award', 'winner'] },
    { id: 'military_tech', name: 'Medal', keywords: ['award', 'badge'] },
    { id: 'workspace_premium', name: 'Premium', keywords: ['badge', 'star'] },
    // Hardware & Devices
    { id: 'computer', name: 'Computer', keywords: ['desktop', 'pc'] },
    { id: 'desktop_windows', name: 'Desktop Windows', keywords: ['pc', 'monitor'] },
    { id: 'desktop_mac', name: 'Desktop Mac', keywords: ['apple', 'imac'] },
    { id: 'laptop', name: 'Laptop', keywords: ['notebook'] },
    { id: 'laptop_mac', name: 'Laptop Mac', keywords: ['macbook', 'apple'] },
    { id: 'laptop_windows', name: 'Laptop Windows', keywords: ['pc', 'notebook'] },
    { id: 'laptop_chromebook', name: 'Chromebook', keywords: ['google', 'laptop'] },
    { id: 'smartphone', name: 'Smartphone', keywords: ['mobile', 'phone'] },
    { id: 'phone_android', name: 'Android Phone', keywords: ['mobile', 'google'] },
    { id: 'phone_iphone', name: 'iPhone', keywords: ['mobile', 'apple'] },
    { id: 'tablet', name: 'Tablet', keywords: ['ipad', 'device'] },
    { id: 'tablet_mac', name: 'Tablet Mac', keywords: ['ipad', 'apple'] },
    { id: 'tablet_android', name: 'Android Tablet', keywords: ['device', 'google'] },
    { id: 'watch', name: 'Watch', keywords: ['smartwatch', 'wearable'] },
    { id: 'tv', name: 'TV', keywords: ['television', 'monitor', 'screen'] },
    { id: 'monitor', name: 'Monitor', keywords: ['display', 'screen'] },
    { id: 'desktop_access_disabled', name: 'Access Disabled', keywords: ['blocked', 'pc'] },
    { id: 'router', name: 'Router', keywords: ['network', 'wifi'] },
    { id: 'wifi', name: 'WiFi', keywords: ['wireless', 'network'] },
    { id: 'wifi_off', name: 'WiFi Off', keywords: ['disconnected', 'network'] },
    { id: 'signal_wifi_4_bar', name: 'WiFi Strong', keywords: ['full', 'signal'] },
    { id: 'network_wifi', name: 'Network WiFi', keywords: ['wireless', 'internet'] },
    { id: 'bluetooth', name: 'Bluetooth', keywords: ['wireless', 'connect'] },
    { id: 'bluetooth_connected', name: 'Bluetooth Connected', keywords: ['paired'] },
    { id: 'bluetooth_searching', name: 'Bluetooth Search', keywords: ['pairing'] },
    { id: 'usb', name: 'USB', keywords: ['port', 'connect'] },
    { id: 'cable', name: 'Cable', keywords: ['wire', 'connect'] },
    { id: 'device_hub', name: 'Device Hub', keywords: ['usb', 'port'] },
    { id: 'devices', name: 'Devices', keywords: ['multiple', 'sync'] },
    { id: 'devices_other', name: 'Other Devices', keywords: ['gadgets'] },
    { id: 'storage', name: 'Storage', keywords: ['database', 'disk'] },
    { id: 'sd_storage', name: 'SD Card', keywords: ['memory', 'storage'] },
    { id: 'memory', name: 'Memory', keywords: ['ram', 'chip'] },
    { id: 'sim_card', name: 'SIM Card', keywords: ['mobile', 'chip'] },
    { id: 'battery_full', name: 'Battery Full', keywords: ['power', 'charge'] },
    { id: 'battery_charging_full', name: 'Charging', keywords: ['power', 'battery'] },
    { id: 'battery_saver', name: 'Battery Saver', keywords: ['power', 'eco'] },
    { id: 'power', name: 'Power', keywords: ['on', 'off', 'button'] },
    { id: 'power_settings_new', name: 'Power Button', keywords: ['on', 'off'] },
    { id: 'electrical_services', name: 'Electrical', keywords: ['plug', 'power'] },
    { id: 'outlet', name: 'Outlet', keywords: ['plug', 'power'] },
    { id: 'keyboard', name: 'Keyboard', keywords: ['type', 'input'] },
    { id: 'keyboard_alt', name: 'Keyboard Alt', keywords: ['type', 'input'] },
    { id: 'mouse', name: 'Mouse', keywords: ['click', 'input'] },
    { id: 'gamepad', name: 'Gamepad', keywords: ['controller', 'gaming'] },
    { id: 'sports_esports', name: 'eSports', keywords: ['gaming', 'controller'] },
    { id: 'videogame_asset', name: 'Video Game', keywords: ['controller', 'gaming'] },
    { id: 'print', name: 'Print', keywords: ['printer', 'document'] },
    { id: 'scanner', name: 'Scanner', keywords: ['scan', 'document'] },
    { id: 'qr_code', name: 'QR Code', keywords: ['scan', 'barcode'] },
    { id: 'qr_code_scanner', name: 'QR Scanner', keywords: ['scan', 'barcode'] },
    // Development & Code
    { id: 'code', name: 'Code', keywords: ['programming', 'developer'] },
    { id: 'code_off', name: 'Code Off', keywords: ['programming', 'disabled'] },
    { id: 'terminal', name: 'Terminal', keywords: ['console', 'command'] },
    { id: 'bug_report', name: 'Bug Report', keywords: ['debug', 'issue'] },
    { id: 'pest_control', name: 'Pest Control', keywords: ['bug', 'fix'] },
    { id: 'build', name: 'Build', keywords: ['tools', 'wrench'] },
    { id: 'build_circle', name: 'Build Circle', keywords: ['tools', 'compile'] },
    { id: 'construction', name: 'Construction', keywords: ['build', 'wip'] },
    { id: 'handyman', name: 'Handyman', keywords: ['tools', 'fix'] },
    { id: 'engineering', name: 'Engineering', keywords: ['settings', 'gear'] },
    { id: 'api', name: 'API', keywords: ['interface', 'endpoint'] },
    { id: 'webhook', name: 'Webhook', keywords: ['api', 'callback'] },
    { id: 'data_object', name: 'Data Object', keywords: ['json', 'code'] },
    { id: 'data_array', name: 'Data Array', keywords: ['json', 'list'] },
    { id: 'javascript', name: 'JavaScript', keywords: ['js', 'code'] },
    { id: 'css', name: 'CSS', keywords: ['style', 'code'] },
    { id: 'html', name: 'HTML', keywords: ['web', 'code'] },
    { id: 'php', name: 'PHP', keywords: ['backend', 'code'] },
    { id: 'integration_instructions', name: 'Integration', keywords: ['code', 'embed'] },
    { id: 'developer_mode', name: 'Developer Mode', keywords: ['code', 'debug'] },
    { id: 'developer_board', name: 'Developer Board', keywords: ['circuit', 'hardware'] },
    { id: 'dns', name: 'DNS', keywords: ['domain', 'network'] },
    { id: 'hub', name: 'Hub', keywords: ['center', 'network'] },
    { id: 'lan', name: 'LAN', keywords: ['network', 'local'] },
    { id: 'vpn_lock', name: 'VPN Lock', keywords: ['secure', 'network'] },
    { id: 'cloud_circle', name: 'Cloud Circle', keywords: ['online', 'storage'] },
    { id: 'http', name: 'HTTP', keywords: ['web', 'protocol'] },
    { id: 'public_off', name: 'Public Off', keywords: ['private', 'hidden'] },
    { id: 'travel_explore', name: 'Explore Web', keywords: ['globe', 'search'] },
    { id: 'commit', name: 'Commit', keywords: ['git', 'version'] },
    { id: 'merge', name: 'Merge', keywords: ['git', 'combine'] },
    { id: 'fork_right', name: 'Fork', keywords: ['git', 'branch'] },
    { id: 'difference', name: 'Diff', keywords: ['compare', 'change'] },
    { id: 'account_tree', name: 'Account Tree', keywords: ['hierarchy', 'branch'] },
    { id: 'schema', name: 'Schema', keywords: ['database', 'structure'] },
    { id: 'table_chart', name: 'Table Chart', keywords: ['database', 'grid'] },
    { id: 'storage', name: 'Storage', keywords: ['database', 'disk'] },
    { id: 'dynamic_form', name: 'Dynamic Form', keywords: ['input', 'fields'] },
    { id: 'wysiwyg', name: 'WYSIWYG', keywords: ['editor', 'rich'] },
    { id: 'text_fields', name: 'Text Fields', keywords: ['input', 'form'] },
    { id: 'input', name: 'Input', keywords: ['form', 'field'] },
    { id: 'smart_button', name: 'Smart Button', keywords: ['action', 'click'] },
    // Business & Finance
    { id: 'work', name: 'Work', keywords: ['briefcase', 'job'] },
    { id: 'work_outline', name: 'Work Outline', keywords: ['briefcase', 'job'] },
    { id: 'work_off', name: 'Work Off', keywords: ['vacation', 'leave'] },
    { id: 'business', name: 'Business', keywords: ['building', 'office'] },
    { id: 'business_center', name: 'Business Center', keywords: ['briefcase', 'work'] },
    { id: 'domain', name: 'Domain', keywords: ['building', 'company'] },
    { id: 'corporate_fare', name: 'Corporate', keywords: ['building', 'office'] },
    { id: 'storefront', name: 'Storefront', keywords: ['shop', 'store'] },
    { id: 'attach_money', name: 'Money', keywords: ['dollar', 'finance', 'cash'] },
    { id: 'money', name: 'Money Bills', keywords: ['cash', 'finance'] },
    { id: 'money_off', name: 'Money Off', keywords: ['free', 'discount'] },
    { id: 'payments', name: 'Payments', keywords: ['money', 'card'] },
    { id: 'paid', name: 'Paid', keywords: ['money', 'check'] },
    { id: 'request_quote', name: 'Quote', keywords: ['invoice', 'price'] },
    { id: 'price_check', name: 'Price Check', keywords: ['money', 'verify'] },
    { id: 'sell', name: 'Sell', keywords: ['tag', 'price'] },
    { id: 'local_offer', name: 'Offer', keywords: ['tag', 'deal'] },
    { id: 'loyalty', name: 'Loyalty', keywords: ['heart', 'badge'] },
    { id: 'redeem', name: 'Redeem', keywords: ['gift', 'coupon'] },
    { id: 'card_giftcard', name: 'Gift Card', keywords: ['present', 'coupon'] },
    { id: 'account_balance', name: 'Bank', keywords: ['finance', 'money'] },
    { id: 'account_balance_wallet', name: 'Wallet', keywords: ['money', 'balance'] },
    { id: 'savings', name: 'Savings', keywords: ['piggy', 'bank'] },
    { id: 'credit_card', name: 'Credit Card', keywords: ['payment', 'money'] },
    { id: 'credit_card_off', name: 'Card Off', keywords: ['payment', 'declined'] },
    { id: 'credit_score', name: 'Credit Score', keywords: ['finance', 'rating'] },
    { id: 'currency_exchange', name: 'Currency Exchange', keywords: ['money', 'convert'] },
    { id: 'euro', name: 'Euro', keywords: ['currency', 'money'] },
    { id: 'currency_bitcoin', name: 'Bitcoin', keywords: ['crypto', 'money'] },
    { id: 'currency_yen', name: 'Yen', keywords: ['currency', 'japan'] },
    { id: 'currency_pound', name: 'Pound', keywords: ['currency', 'uk'] },
    { id: 'currency_rupee', name: 'Rupee', keywords: ['currency', 'india'] },
    { id: 'shopping_cart', name: 'Shopping Cart', keywords: ['buy', 'store'] },
    { id: 'shopping_bag', name: 'Shopping Bag', keywords: ['buy', 'store'] },
    { id: 'shopping_basket', name: 'Shopping Basket', keywords: ['buy', 'store'] },
    { id: 'add_shopping_cart', name: 'Add to Cart', keywords: ['buy', 'add'] },
    { id: 'remove_shopping_cart', name: 'Remove from Cart', keywords: ['buy', 'delete'] },
    { id: 'store', name: 'Store', keywords: ['shop', 'market'] },
    { id: 'local_mall', name: 'Mall', keywords: ['shop', 'store'] },
    { id: 'local_grocery_store', name: 'Grocery', keywords: ['shop', 'food'] },
    { id: 'receipt', name: 'Receipt', keywords: ['invoice', 'bill'] },
    { id: 'receipt_long', name: 'Long Receipt', keywords: ['invoice', 'bill'] },
    { id: 'point_of_sale', name: 'POS', keywords: ['register', 'sale'] },
    { id: 'inventory_2', name: 'Inventory', keywords: ['stock', 'warehouse'] },
    { id: 'local_shipping', name: 'Shipping', keywords: ['delivery', 'truck'] },
    { id: 'analytics', name: 'Analytics', keywords: ['chart', 'stats', 'graph'] },
    { id: 'insights', name: 'Insights', keywords: ['analytics', 'data'] },
    { id: 'trending_up', name: 'Trending Up', keywords: ['increase', 'growth'] },
    { id: 'trending_down', name: 'Trending Down', keywords: ['decrease', 'loss'] },
    { id: 'trending_flat', name: 'Trending Flat', keywords: ['stable', 'neutral'] },
    { id: 'show_chart', name: 'Line Chart', keywords: ['graph', 'analytics'] },
    { id: 'bar_chart', name: 'Bar Chart', keywords: ['graph', 'analytics'] },
    { id: 'pie_chart', name: 'Pie Chart', keywords: ['graph', 'analytics'] },
    { id: 'donut_large', name: 'Donut Chart', keywords: ['graph', 'analytics'] },
    { id: 'bubble_chart', name: 'Bubble Chart', keywords: ['graph', 'analytics'] },
    { id: 'scatter_plot', name: 'Scatter Plot', keywords: ['graph', 'analytics'] },
    { id: 'stacked_line_chart', name: 'Stacked Chart', keywords: ['graph', 'analytics'] },
    { id: 'area_chart', name: 'Area Chart', keywords: ['graph', 'analytics'] },
    { id: 'leaderboard', name: 'Leaderboard', keywords: ['ranking', 'stats'] },
    { id: 'assessment', name: 'Assessment', keywords: ['report', 'analysis'] },
    { id: 'query_stats', name: 'Query Stats', keywords: ['search', 'analytics'] },
    // Security & Privacy
    { id: 'lock', name: 'Lock', keywords: ['secure', 'password'] },
    { id: 'lock_outline', name: 'Lock Outline', keywords: ['secure', 'password'] },
    { id: 'lock_open', name: 'Lock Open', keywords: ['unlock'] },
    { id: 'lock_clock', name: 'Lock Clock', keywords: ['timed', 'secure'] },
    { id: 'enhanced_encryption', name: 'Encryption', keywords: ['secure', 'protect'] },
    { id: 'no_encryption', name: 'No Encryption', keywords: ['unsecure', 'warning'] },
    { id: 'vpn_key', name: 'VPN Key', keywords: ['password', 'key'] },
    { id: 'key', name: 'Key', keywords: ['password', 'access'] },
    { id: 'key_off', name: 'Key Off', keywords: ['locked', 'no-access'] },
    { id: 'password', name: 'Password', keywords: ['key', 'secure'] },
    { id: 'pin', name: 'PIN', keywords: ['code', 'secure'] },
    { id: 'pattern', name: 'Pattern', keywords: ['unlock', 'secure'] },
    { id: 'fingerprint', name: 'Fingerprint', keywords: ['biometric', 'secure'] },
    { id: 'face_unlock', name: 'Face Unlock', keywords: ['biometric', 'secure'] },
    { id: 'security', name: 'Security', keywords: ['shield', 'protect'] },
    { id: 'shield', name: 'Shield', keywords: ['security', 'protect'] },
    { id: 'admin_panel_settings', name: 'Admin Panel', keywords: ['settings', 'secure'] },
    { id: 'verified', name: 'Verified', keywords: ['check', 'approved'] },
    { id: 'verified_user', name: 'Verified User', keywords: ['shield', 'safe'] },
    { id: 'gpp_good', name: 'Good Protection', keywords: ['shield', 'check'] },
    { id: 'gpp_bad', name: 'Bad Protection', keywords: ['shield', 'warning'] },
    { id: 'gpp_maybe', name: 'Maybe Protected', keywords: ['shield', 'question'] },
    { id: 'policy', name: 'Policy', keywords: ['rules', 'shield'] },
    { id: 'privacy_tip', name: 'Privacy Tip', keywords: ['info', 'secure'] },
    { id: 'visibility', name: 'Visibility', keywords: ['eye', 'show'] },
    { id: 'visibility_off', name: 'Visibility Off', keywords: ['eye', 'hide'] },
    { id: 'remove_red_eye', name: 'Eye', keywords: ['view', 'show'] },
    { id: 'block', name: 'Block', keywords: ['ban', 'deny'] },
    { id: 'do_not_disturb', name: 'Do Not Disturb', keywords: ['block', 'stop'] },
    { id: 'report', name: 'Report', keywords: ['flag', 'alert'] },
    { id: 'report_problem', name: 'Report Problem', keywords: ['warning', 'alert'] },
    { id: 'report_off', name: 'Report Off', keywords: ['no-report'] },
    // Time & Calendar
    { id: 'access_time', name: 'Time', keywords: ['clock', 'hour'] },
    { id: 'schedule', name: 'Schedule', keywords: ['clock', 'time'] },
    { id: 'watch_later', name: 'Watch Later', keywords: ['clock', 'save'] },
    { id: 'history', name: 'History', keywords: ['time', 'past'] },
    { id: 'update', name: 'Update', keywords: ['time', 'refresh'] },
    { id: 'pending', name: 'Pending', keywords: ['wait', 'clock'] },
    { id: 'hourglass_empty', name: 'Hourglass', keywords: ['wait', 'time'] },
    { id: 'hourglass_full', name: 'Hourglass Full', keywords: ['wait', 'time'] },
    { id: 'timer', name: 'Timer', keywords: ['countdown', 'clock'] },
    { id: 'timer_off', name: 'Timer Off', keywords: ['stop', 'clock'] },
    { id: 'alarm', name: 'Alarm', keywords: ['clock', 'alert'] },
    { id: 'alarm_add', name: 'Add Alarm', keywords: ['clock', 'new'] },
    { id: 'alarm_off', name: 'Alarm Off', keywords: ['clock', 'stop'] },
    { id: 'alarm_on', name: 'Alarm On', keywords: ['clock', 'active'] },
    { id: 'snooze', name: 'Snooze', keywords: ['alarm', 'sleep'] },
    { id: 'calendar_today', name: 'Calendar', keywords: ['date', 'schedule'] },
    { id: 'calendar_month', name: 'Calendar Month', keywords: ['date', 'schedule'] },
    { id: 'calendar_view_day', name: 'Day View', keywords: ['date', 'schedule'] },
    { id: 'calendar_view_week', name: 'Week View', keywords: ['date', 'schedule'] },
    { id: 'calendar_view_month', name: 'Month View', keywords: ['date', 'schedule'] },
    { id: 'event', name: 'Event', keywords: ['calendar', 'date'] },
    { id: 'event_available', name: 'Event Available', keywords: ['calendar', 'free'] },
    { id: 'event_busy', name: 'Event Busy', keywords: ['calendar', 'blocked'] },
    { id: 'event_note', name: 'Event Note', keywords: ['calendar', 'memo'] },
    { id: 'event_repeat', name: 'Event Repeat', keywords: ['calendar', 'recurring'] },
    { id: 'date_range', name: 'Date Range', keywords: ['calendar', 'period'] },
    { id: 'today', name: 'Today', keywords: ['calendar', 'date'] },
    { id: 'task', name: 'Task', keywords: ['todo', 'check'] },
    { id: 'task_alt', name: 'Task Done', keywords: ['todo', 'complete'] },
    { id: 'add_task', name: 'Add Task', keywords: ['todo', 'new'] },
    { id: 'checklist', name: 'Checklist', keywords: ['todo', 'list'] },
    { id: 'checklist_rtl', name: 'Checklist RTL', keywords: ['todo', 'list'] },
    { id: 'rule', name: 'Rule', keywords: ['check', 'verify'] },
    { id: 'published_with_changes', name: 'Published Changes', keywords: ['update', 'sync'] },
    // Status & Alerts
    { id: 'check_circle', name: 'Check Circle', keywords: ['done', 'success'] },
    { id: 'check_circle_outline', name: 'Check Outline', keywords: ['done', 'success'] },
    { id: 'done', name: 'Done', keywords: ['check', 'complete'] },
    { id: 'done_all', name: 'Done All', keywords: ['check', 'complete'] },
    { id: 'done_outline', name: 'Done Outline', keywords: ['check', 'complete'] },
    { id: 'cancel', name: 'Cancel', keywords: ['x', 'close'] },
    { id: 'highlight_off', name: 'Highlight Off', keywords: ['x', 'close'] },
    { id: 'help', name: 'Help', keywords: ['question', 'support'] },
    { id: 'help_outline', name: 'Help Outline', keywords: ['question', 'support'] },
    { id: 'help_center', name: 'Help Center', keywords: ['question', 'support'] },
    { id: 'info', name: 'Info', keywords: ['about', 'information'] },
    { id: 'info_outline', name: 'Info Outline', keywords: ['about', 'information'] },
    { id: 'warning', name: 'Warning', keywords: ['alert', 'caution'] },
    { id: 'warning_amber', name: 'Warning Amber', keywords: ['alert', 'caution'] },
    { id: 'error', name: 'Error', keywords: ['problem', 'issue'] },
    { id: 'error_outline', name: 'Error Outline', keywords: ['problem', 'issue'] },
    { id: 'dangerous', name: 'Dangerous', keywords: ['warning', 'hazard'] },
    { id: 'new_releases', name: 'New', keywords: ['alert', 'badge'] },
    { id: 'notification_important', name: 'Important', keywords: ['alert', 'urgent'] },
    { id: 'priority_high', name: 'Priority High', keywords: ['alert', 'important'] },
    { id: 'low_priority', name: 'Low Priority', keywords: ['alert', 'minor'] },
    { id: 'flag', name: 'Flag', keywords: ['mark', 'alert'] },
    { id: 'outlined_flag', name: 'Flag Outline', keywords: ['mark', 'alert'] },
    { id: 'tour', name: 'Tour Flag', keywords: ['mark', 'guide'] },
    { id: 'label', name: 'Label', keywords: ['tag', 'mark'] },
    { id: 'label_important', name: 'Important Label', keywords: ['tag', 'mark'] },
    // Misc & Utilities
    { id: 'dashboard', name: 'Dashboard', keywords: ['panel', 'widgets'] },
    { id: 'dashboard_customize', name: 'Customize Dashboard', keywords: ['panel', 'edit'] },
    { id: 'widgets', name: 'Widgets', keywords: ['apps', 'modules'] },
    { id: 'view_module', name: 'Module View', keywords: ['grid', 'layout'] },
    { id: 'view_list', name: 'List View', keywords: ['rows', 'layout'] },
    { id: 'view_agenda', name: 'Agenda View', keywords: ['list', 'layout'] },
    { id: 'view_carousel', name: 'Carousel View', keywords: ['slider', 'layout'] },
    { id: 'view_column', name: 'Column View', keywords: ['layout', 'grid'] },
    { id: 'view_comfy', name: 'Comfy View', keywords: ['grid', 'large'] },
    { id: 'view_compact', name: 'Compact View', keywords: ['grid', 'small'] },
    { id: 'view_quilt', name: 'Quilt View', keywords: ['grid', 'masonry'] },
    { id: 'view_stream', name: 'Stream View', keywords: ['list', 'feed'] },
    { id: 'grid_view', name: 'Grid View', keywords: ['layout', 'tiles'] },
    { id: 'grid_on', name: 'Grid On', keywords: ['layout', 'lines'] },
    { id: 'grid_off', name: 'Grid Off', keywords: ['layout', 'hide'] },
    { id: 'download', name: 'Download', keywords: ['save', 'get'] },
    { id: 'downloading', name: 'Downloading', keywords: ['save', 'progress'] },
    { id: 'upload', name: 'Upload', keywords: ['send', 'put'] },
    { id: 'file_download_done', name: 'Download Done', keywords: ['save', 'complete'] },
    { id: 'publish', name: 'Publish', keywords: ['upload', 'send'] },
    { id: 'get_app', name: 'Get App', keywords: ['download', 'install'] },
    { id: 'install_desktop', name: 'Install Desktop', keywords: ['download', 'app'] },
    { id: 'install_mobile', name: 'Install Mobile', keywords: ['download', 'app'] },
    { id: 'save', name: 'Save', keywords: ['disk', 'store'] },
    { id: 'save_alt', name: 'Save Alt', keywords: ['disk', 'download'] },
    { id: 'save_as', name: 'Save As', keywords: ['disk', 'export'] },
    { id: 'print', name: 'Print', keywords: ['printer', 'document'] },
    { id: 'local_printshop', name: 'Print Shop', keywords: ['printer', 'service'] },
    { id: 'preview', name: 'Preview', keywords: ['view', 'eye'] },
    { id: 'pageview', name: 'Page View', keywords: ['view', 'search'] },
    { id: 'zoom_in', name: 'Zoom In', keywords: ['magnify', 'plus'] },
    { id: 'zoom_out', name: 'Zoom Out', keywords: ['magnify', 'minus'] },
    { id: 'zoom_out_map', name: 'Zoom Map', keywords: ['expand', 'fullscreen'] },
    { id: 'fit_screen', name: 'Fit Screen', keywords: ['zoom', 'resize'] },
    { id: 'aspect_ratio', name: 'Aspect Ratio', keywords: ['resize', 'dimensions'] },
    { id: 'straighten', name: 'Straighten', keywords: ['rotate', 'align'] },
    { id: 'center_focus_strong', name: 'Focus', keywords: ['center', 'target'] },
    { id: 'center_focus_weak', name: 'Focus Weak', keywords: ['center', 'target'] },
    { id: 'adjust', name: 'Adjust', keywords: ['tune', 'settings'] },
    { id: 'auto_awesome', name: 'Auto Awesome', keywords: ['magic', 'sparkle'] },
    { id: 'auto_fix_normal', name: 'Auto Fix Normal', keywords: ['magic', 'repair'] },
    { id: 'cleaning_services', name: 'Cleaning', keywords: ['broom', 'clean'] },
    { id: 'clear_all', name: 'Clear All', keywords: ['delete', 'remove'] },
    { id: 'delete_forever', name: 'Delete Forever', keywords: ['trash', 'permanent'] },
    { id: 'delete_sweep', name: 'Delete Sweep', keywords: ['trash', 'clean'] },
    { id: 'restore_from_trash', name: 'Restore', keywords: ['undelete', 'recover'] },
    // Games & Entertainment
    { id: 'games', name: 'Games', keywords: ['gaming', 'controller'] },
    { id: 'casino', name: 'Casino', keywords: ['dice', 'gambling'] },
    { id: 'extension', name: 'Extension', keywords: ['puzzle', 'plugin'] },
    { id: 'toys', name: 'Toys', keywords: ['play', 'fun'] },
    { id: 'smart_toy', name: 'Smart Toy', keywords: ['robot', 'ai'] },
    { id: 'sports_soccer', name: 'Soccer', keywords: ['football', 'ball'] },
    { id: 'sports_basketball', name: 'Basketball', keywords: ['ball', 'nba'] },
    { id: 'sports_football', name: 'Football', keywords: ['american', 'nfl'] },
    { id: 'sports_baseball', name: 'Baseball', keywords: ['ball', 'mlb'] },
    { id: 'sports_tennis', name: 'Tennis', keywords: ['ball', 'racket'] },
    { id: 'sports_golf', name: 'Golf', keywords: ['ball', 'club'] },
    { id: 'sports_hockey', name: 'Hockey', keywords: ['puck', 'nhl'] },
    { id: 'sports_cricket', name: 'Cricket', keywords: ['ball', 'bat'] },
    { id: 'sports_volleyball', name: 'Volleyball', keywords: ['ball', 'net'] },
    { id: 'sports_handball', name: 'Handball', keywords: ['ball', 'throw'] },
    { id: 'sports_rugby', name: 'Rugby', keywords: ['ball', 'football'] },
    { id: 'sports_mma', name: 'MMA', keywords: ['fighting', 'ufc'] },
    { id: 'sports_kabaddi', name: 'Kabaddi', keywords: ['wrestling', 'sport'] },
    { id: 'sports_motorsports', name: 'Motorsports', keywords: ['racing', 'car'] },
    { id: 'sports', name: 'Sports', keywords: ['running', 'athletics'] },
    { id: 'fitness_center', name: 'Fitness', keywords: ['gym', 'workout'] },
    { id: 'pool', name: 'Pool', keywords: ['swimming', 'water'] },
    { id: 'surfing', name: 'Surfing', keywords: ['wave', 'beach'] },
    { id: 'kayaking', name: 'Kayaking', keywords: ['water', 'paddle'] },
    { id: 'sailing', name: 'Sailing', keywords: ['boat', 'water'] },
    { id: 'rowing', name: 'Rowing', keywords: ['boat', 'paddle'] },
    { id: 'downhill_skiing', name: 'Skiing', keywords: ['snow', 'winter'] },
    { id: 'snowboarding', name: 'Snowboarding', keywords: ['snow', 'winter'] },
    { id: 'sledding', name: 'Sledding', keywords: ['snow', 'winter'] },
    { id: 'ice_skating', name: 'Ice Skating', keywords: ['winter', 'rink'] },
    { id: 'skateboarding', name: 'Skateboarding', keywords: ['board', 'street'] },
    { id: 'roller_skating', name: 'Roller Skating', keywords: ['wheels', 'skate'] },
    { id: 'hiking', name: 'Hiking', keywords: ['walk', 'mountain'] },
    { id: 'nordic_walking', name: 'Nordic Walking', keywords: ['exercise', 'outdoor'] },
    { id: 'directions_bike', name: 'Biking', keywords: ['cycling', 'bicycle'] },
    { id: 'directions_run', name: 'Running', keywords: ['jog', 'exercise'] },
    { id: 'directions_walk', name: 'Walking', keywords: ['pedestrian', 'stroll'] },
    // Nature & Weather
    { id: 'wb_sunny', name: 'Sunny', keywords: ['sun', 'weather'] },
    { id: 'light_mode', name: 'Light Mode', keywords: ['sun', 'day'] },
    { id: 'dark_mode', name: 'Dark Mode', keywords: ['moon', 'night'] },
    { id: 'brightness_high', name: 'Bright', keywords: ['sun', 'light'] },
    { id: 'brightness_low', name: 'Dim', keywords: ['dark', 'light'] },
    { id: 'brightness_medium', name: 'Medium Bright', keywords: ['light', 'mid'] },
    { id: 'nightlight', name: 'Night Light', keywords: ['moon', 'dark'] },
    { id: 'bedtime', name: 'Bedtime', keywords: ['moon', 'sleep'] },
    { id: 'cloud', name: 'Cloud', keywords: ['weather', 'sky'] },
    { id: 'cloud_queue', name: 'Clouds', keywords: ['weather', 'overcast'] },
    { id: 'thunderstorm', name: 'Thunderstorm', keywords: ['lightning', 'rain'] },
    { id: 'grain', name: 'Rain', keywords: ['weather', 'water'] },
    { id: 'water_drop', name: 'Water Drop', keywords: ['rain', 'liquid'] },
    { id: 'ac_unit', name: 'Snowflake', keywords: ['cold', 'winter'] },
    { id: 'severe_cold', name: 'Severe Cold', keywords: ['freeze', 'winter'] },
    { id: 'thermostat', name: 'Thermostat', keywords: ['temperature', 'heat'] },
    { id: 'device_thermostat', name: 'Device Thermostat', keywords: ['temperature', 'smart'] },
    { id: 'air', name: 'Air', keywords: ['wind', 'breeze'] },
    { id: 'waves', name: 'Waves', keywords: ['water', 'ocean'] },
    { id: 'tsunami', name: 'Tsunami', keywords: ['wave', 'disaster'] },
    { id: 'volcano', name: 'Volcano', keywords: ['mountain', 'eruption'] },
    { id: 'landscape', name: 'Landscape', keywords: ['mountain', 'nature'] },
    { id: 'terrain', name: 'Terrain', keywords: ['mountain', 'land'] },
    { id: 'forest', name: 'Forest', keywords: ['trees', 'nature'] },
    { id: 'park', name: 'Park', keywords: ['trees', 'outdoor'] },
    { id: 'nature', name: 'Nature', keywords: ['leaf', 'plant'] },
    { id: 'nature_people', name: 'Nature People', keywords: ['outdoor', 'hiking'] },
    { id: 'grass', name: 'Grass', keywords: ['lawn', 'nature'] },
    { id: 'yard', name: 'Yard', keywords: ['garden', 'outdoor'] },
    { id: 'eco', name: 'Eco', keywords: ['leaf', 'green'] },
    { id: 'compost', name: 'Compost', keywords: ['recycle', 'organic'] },
    { id: 'recycling', name: 'Recycling', keywords: ['recycle', 'green'] },
    { id: 'delete_sweep', name: 'Sweep', keywords: ['clean', 'remove'] },
    { id: 'pets', name: 'Pets', keywords: ['paw', 'animal'] },
    { id: 'cruelty_free', name: 'Cruelty Free', keywords: ['bunny', 'animal'] },
    // Travel & Places
    { id: 'flight', name: 'Flight', keywords: ['airplane', 'travel'] },
    { id: 'flight_takeoff', name: 'Takeoff', keywords: ['airplane', 'depart'] },
    { id: 'flight_land', name: 'Landing', keywords: ['airplane', 'arrive'] },
    { id: 'local_airport', name: 'Airport', keywords: ['plane', 'travel'] },
    { id: 'connecting_airports', name: 'Connecting', keywords: ['transfer', 'flights'] },
    { id: 'airlines', name: 'Airlines', keywords: ['flight', 'travel'] },
    { id: 'airline_seat_recline_extra', name: 'Seat Recline', keywords: ['flight', 'comfort'] },
    { id: 'luggage', name: 'Luggage', keywords: ['bag', 'travel'] },
    { id: 'directions_car', name: 'Car', keywords: ['drive', 'vehicle'] },
    { id: 'local_taxi', name: 'Taxi', keywords: ['cab', 'ride'] },
    { id: 'directions_bus', name: 'Bus', keywords: ['transit', 'public'] },
    { id: 'directions_railway', name: 'Train', keywords: ['rail', 'transit'] },
    { id: 'subway', name: 'Subway', keywords: ['metro', 'train'] },
    { id: 'tram', name: 'Tram', keywords: ['streetcar', 'transit'] },
    { id: 'directions_boat', name: 'Boat', keywords: ['ship', 'ferry'] },
    { id: 'sailing', name: 'Sailing', keywords: ['boat', 'yacht'] },
    { id: 'anchor', name: 'Anchor', keywords: ['ship', 'port'] },
    { id: 'two_wheeler', name: 'Motorcycle', keywords: ['bike', 'scooter'] },
    { id: 'pedal_bike', name: 'Bicycle', keywords: ['bike', 'cycling'] },
    { id: 'electric_bike', name: 'E-Bike', keywords: ['bicycle', 'electric'] },
    { id: 'electric_scooter', name: 'E-Scooter', keywords: ['scooter', 'electric'] },
    { id: 'electric_car', name: 'Electric Car', keywords: ['ev', 'vehicle'] },
    { id: 'local_gas_station', name: 'Gas Station', keywords: ['fuel', 'petrol'] },
    { id: 'ev_station', name: 'EV Station', keywords: ['charge', 'electric'] },
    { id: 'local_parking', name: 'Parking', keywords: ['car', 'garage'] },
    { id: 'map', name: 'Map', keywords: ['navigation', 'location'] },
    { id: 'explore', name: 'Explore', keywords: ['compass', 'navigation'] },
    { id: 'near_me', name: 'Near Me', keywords: ['location', 'navigation'] },
    { id: 'navigation', name: 'Navigation', keywords: ['arrow', 'direction'] },
    { id: 'my_location', name: 'My Location', keywords: ['gps', 'position'] },
    { id: 'location_on', name: 'Location', keywords: ['pin', 'marker'] },
    { id: 'location_off', name: 'Location Off', keywords: ['gps', 'disabled'] },
    { id: 'add_location', name: 'Add Location', keywords: ['pin', 'new'] },
    { id: 'edit_location', name: 'Edit Location', keywords: ['pin', 'modify'] },
    { id: 'wrong_location', name: 'Wrong Location', keywords: ['pin', 'error'] },
    { id: 'share_location', name: 'Share Location', keywords: ['gps', 'send'] },
    { id: 'pin_drop', name: 'Pin Drop', keywords: ['location', 'marker'] },
    { id: 'place', name: 'Place', keywords: ['location', 'pin'] },
    { id: 'room', name: 'Room', keywords: ['location', 'pin'] },
    { id: 'local_hotel', name: 'Hotel', keywords: ['bed', 'sleep'] },
    { id: 'hotel', name: 'Hotel Building', keywords: ['lodging', 'stay'] },
    { id: 'house', name: 'House', keywords: ['home', 'building'] },
    { id: 'home_work', name: 'Home Work', keywords: ['office', 'remote'] },
    { id: 'apartment', name: 'Apartment', keywords: ['building', 'flat'] },
    { id: 'cottage', name: 'Cottage', keywords: ['house', 'cabin'] },
    { id: 'cabin', name: 'Cabin', keywords: ['house', 'wood'] },
    { id: 'villa', name: 'Villa', keywords: ['house', 'luxury'] },
    { id: 'local_cafe', name: 'Cafe', keywords: ['coffee', 'drink'] },
    { id: 'restaurant', name: 'Restaurant', keywords: ['food', 'dining'] },
    { id: 'local_dining', name: 'Dining', keywords: ['food', 'restaurant'] },
    { id: 'local_bar', name: 'Bar', keywords: ['drink', 'cocktail'] },
    { id: 'local_pizza', name: 'Pizza', keywords: ['food', 'restaurant'] },
    { id: 'bakery_dining', name: 'Bakery', keywords: ['bread', 'food'] },
    { id: 'fastfood', name: 'Fast Food', keywords: ['burger', 'restaurant'] },
    { id: 'local_hospital', name: 'Hospital', keywords: ['medical', 'health'] },
    { id: 'local_pharmacy', name: 'Pharmacy', keywords: ['medicine', 'drug'] },
    { id: 'medical_services', name: 'Medical', keywords: ['health', 'doctor'] },
    { id: 'local_library', name: 'Library', keywords: ['books', 'reading'] },
    { id: 'school', name: 'School', keywords: ['education', 'learning'] },
    { id: 'science', name: 'Science', keywords: ['flask', 'lab'] },
    { id: 'museum', name: 'Museum', keywords: ['art', 'history'] },
    { id: 'church', name: 'Church', keywords: ['religion', 'worship'] },
    { id: 'mosque', name: 'Mosque', keywords: ['religion', 'islam'] },
    { id: 'synagogue', name: 'Synagogue', keywords: ['religion', 'jewish'] },
    { id: 'temple_hindu', name: 'Hindu Temple', keywords: ['religion', 'worship'] },
    { id: 'temple_buddhist', name: 'Buddhist Temple', keywords: ['religion', 'worship'] },
    { id: 'stadium', name: 'Stadium', keywords: ['sports', 'arena'] },
    { id: 'attractions', name: 'Attractions', keywords: ['ferris', 'amusement'] },
    { id: 'beach_access', name: 'Beach', keywords: ['umbrella', 'vacation'] },
    { id: 'pool', name: 'Pool', keywords: ['swimming', 'water'] },
    { id: 'hot_tub', name: 'Hot Tub', keywords: ['spa', 'relax'] },
    { id: 'spa', name: 'Spa', keywords: ['relax', 'wellness'] },
    { id: 'casino', name: 'Casino', keywords: ['gambling', 'games'] },
    { id: 'nightlife', name: 'Nightlife', keywords: ['club', 'party'] },
    // Food & Drink
    { id: 'restaurant_menu', name: 'Menu', keywords: ['food', 'dining'] },
    { id: 'lunch_dining', name: 'Lunch', keywords: ['food', 'meal'] },
    { id: 'dinner_dining', name: 'Dinner', keywords: ['food', 'meal'] },
    { id: 'brunch_dining', name: 'Brunch', keywords: ['food', 'meal'] },
    { id: 'set_meal', name: 'Set Meal', keywords: ['food', 'bento'] },
    { id: 'ramen_dining', name: 'Ramen', keywords: ['noodles', 'food'] },
    { id: 'rice_bowl', name: 'Rice Bowl', keywords: ['food', 'asian'] },
    { id: 'kebab_dining', name: 'Kebab', keywords: ['food', 'meat'] },
    { id: 'icecream', name: 'Ice Cream', keywords: ['dessert', 'sweet'] },
    { id: 'cake', name: 'Cake', keywords: ['dessert', 'birthday'] },
    { id: 'cookie', name: 'Cookie', keywords: ['dessert', 'sweet'] },
    { id: 'egg', name: 'Egg', keywords: ['food', 'breakfast'] },
    { id: 'egg_alt', name: 'Egg Alt', keywords: ['food', 'fried'] },
    { id: 'soup_kitchen', name: 'Soup', keywords: ['food', 'hot'] },
    { id: 'coffee', name: 'Coffee', keywords: ['drink', 'cafe'] },
    { id: 'coffee_maker', name: 'Coffee Maker', keywords: ['brew', 'machine'] },
    { id: 'local_drink', name: 'Drink', keywords: ['beverage', 'water'] },
    { id: 'liquor', name: 'Liquor', keywords: ['alcohol', 'drink'] },
    { id: 'wine_bar', name: 'Wine', keywords: ['alcohol', 'drink'] },
    { id: 'sports_bar', name: 'Beer', keywords: ['alcohol', 'drink'] },
    { id: 'tapas', name: 'Tapas', keywords: ['food', 'appetizer'] },
    { id: 'takeout_dining', name: 'Takeout', keywords: ['food', 'delivery'] },
    { id: 'delivery_dining', name: 'Delivery', keywords: ['food', 'order'] },
    // Education & Science
    { id: 'school', name: 'School', keywords: ['education', 'learning'] },
    { id: 'psychology', name: 'Psychology', keywords: ['brain', 'mind'] },
    { id: 'biotech', name: 'Biotech', keywords: ['dna', 'science'] },
    { id: 'science', name: 'Science', keywords: ['flask', 'chemistry'] },
    { id: 'calculate', name: 'Calculate', keywords: ['math', 'numbers'] },
    { id: 'functions', name: 'Functions', keywords: ['math', 'formula'] },
    { id: 'architecture', name: 'Architecture', keywords: ['design', 'building'] },
    { id: 'design_services', name: 'Design', keywords: ['ruler', 'creative'] },
    { id: 'draw', name: 'Draw', keywords: ['pencil', 'art'] },
    { id: 'brush', name: 'Brush', keywords: ['paint', 'art'] },
    { id: 'palette', name: 'Palette', keywords: ['color', 'art'] },
    { id: 'color_lens', name: 'Color Lens', keywords: ['palette', 'design'] },
    { id: 'format_paint', name: 'Format Paint', keywords: ['brush', 'style'] },
    { id: 'create', name: 'Create', keywords: ['pencil', 'edit'] },
    { id: 'mode_edit', name: 'Edit Mode', keywords: ['pencil', 'modify'] },
    { id: 'gesture', name: 'Gesture', keywords: ['hand', 'draw'] },
    { id: 'auto_stories', name: 'Stories', keywords: ['book', 'read'] },
    { id: 'menu_book', name: 'Menu Book', keywords: ['read', 'study'] },
    { id: 'import_contacts', name: 'Contacts Book', keywords: ['address', 'people'] },
    { id: 'library_books', name: 'Library Books', keywords: ['read', 'collection'] },
    { id: 'collections_bookmark', name: 'Collections', keywords: ['bookmark', 'save'] },
    { id: 'class', name: 'Class', keywords: ['book', 'study'] },
    { id: 'history_edu', name: 'History', keywords: ['scroll', 'document'] },
    { id: 'quiz', name: 'Quiz', keywords: ['question', 'test'] },
    { id: 'fact_check', name: 'Fact Check', keywords: ['verify', 'true'] },
    { id: 'lightbulb', name: 'Lightbulb', keywords: ['idea', 'tip'] },
    { id: 'tips_and_updates', name: 'Tips', keywords: ['lightbulb', 'idea'] },
    { id: 'emoji_objects', name: 'Object Idea', keywords: ['lightbulb', 'innovation'] },
    { id: 'rocket_launch', name: 'Rocket Launch', keywords: ['space', 'startup'] },
    { id: 'rocket', name: 'Rocket', keywords: ['space', 'launch'] },
    { id: 'satellite', name: 'Satellite', keywords: ['space', 'orbit'] },
    { id: 'satellite_alt', name: 'Satellite Alt', keywords: ['space', 'signal'] },
    // Home & Living
    { id: 'home', name: 'Home', keywords: ['house', 'main'] },
    { id: 'house', name: 'House', keywords: ['home', 'building'] },
    { id: 'bungalow', name: 'Bungalow', keywords: ['house', 'home'] },
    { id: 'gite', name: 'Gite', keywords: ['house', 'vacation'] },
    { id: 'houseboat', name: 'Houseboat', keywords: ['boat', 'home'] },
    { id: 'living', name: 'Living Room', keywords: ['home', 'sofa'] },
    { id: 'weekend', name: 'Weekend', keywords: ['sofa', 'relax'] },
    { id: 'chair', name: 'Chair', keywords: ['seat', 'furniture'] },
    { id: 'chair_alt', name: 'Chair Alt', keywords: ['seat', 'furniture'] },
    { id: 'bed', name: 'Bed', keywords: ['sleep', 'bedroom'] },
    { id: 'single_bed', name: 'Single Bed', keywords: ['sleep', 'bedroom'] },
    { id: 'king_bed', name: 'King Bed', keywords: ['sleep', 'bedroom'] },
    { id: 'crib', name: 'Crib', keywords: ['baby', 'bed'] },
    { id: 'bathtub', name: 'Bathtub', keywords: ['bath', 'bathroom'] },
    { id: 'shower', name: 'Shower', keywords: ['bath', 'bathroom'] },
    { id: 'bathroom', name: 'Bathroom', keywords: ['toilet', 'wc'] },
    { id: 'kitchen', name: 'Kitchen', keywords: ['cook', 'food'] },
    { id: 'countertops', name: 'Countertops', keywords: ['kitchen', 'surface'] },
    { id: 'microwave', name: 'Microwave', keywords: ['kitchen', 'cook'] },
    { id: 'blender', name: 'Blender', keywords: ['kitchen', 'mix'] },
    { id: 'soup_kitchen', name: 'Soup Kitchen', keywords: ['cook', 'food'] },
    { id: 'dining', name: 'Dining', keywords: ['table', 'eat'] },
    { id: 'table_restaurant', name: 'Table', keywords: ['dining', 'furniture'] },
    { id: 'table_bar', name: 'Bar Table', keywords: ['dining', 'counter'] },
    { id: 'window', name: 'Window', keywords: ['glass', 'view'] },
    { id: 'door_front', name: 'Front Door', keywords: ['entrance', 'home'] },
    { id: 'door_sliding', name: 'Sliding Door', keywords: ['entrance', 'patio'] },
    { id: 'door_back', name: 'Back Door', keywords: ['exit', 'home'] },
    { id: 'garage', name: 'Garage', keywords: ['car', 'home'] },
    { id: 'fence', name: 'Fence', keywords: ['yard', 'boundary'] },
    { id: 'deck', name: 'Deck', keywords: ['patio', 'outdoor'] },
    { id: 'outdoor_grill', name: 'Grill', keywords: ['bbq', 'outdoor'] },
    { id: 'fireplace', name: 'Fireplace', keywords: ['fire', 'warm'] },
    { id: 'light', name: 'Light', keywords: ['lamp', 'ceiling'] },
    { id: 'lightbulb_circle', name: 'Lightbulb Circle', keywords: ['lamp', 'idea'] },
    { id: 'fluorescent', name: 'Fluorescent', keywords: ['light', 'tube'] },
    { id: 'ceiling', name: 'Ceiling', keywords: ['roof', 'room'] },
    { id: 'sensors', name: 'Sensors', keywords: ['smart', 'detect'] },
    { id: 'sensor_door', name: 'Door Sensor', keywords: ['smart', 'security'] },
    { id: 'sensor_window', name: 'Window Sensor', keywords: ['smart', 'security'] },
    { id: 'thermostat', name: 'Thermostat', keywords: ['temperature', 'heat'] },
    { id: 'heat', name: 'Heat', keywords: ['warm', 'temperature'] },
    { id: 'mode_cool', name: 'Cool', keywords: ['ac', 'cold'] },
    { id: 'mode_fan_off', name: 'Fan Off', keywords: ['cooling', 'disabled'] },
    { id: 'air', name: 'Air', keywords: ['fan', 'ventilation'] },
    { id: 'hvac', name: 'HVAC', keywords: ['heating', 'cooling'] },
    { id: 'water', name: 'Water', keywords: ['faucet', 'plumbing'] },
    { id: 'gas_meter', name: 'Gas Meter', keywords: ['utility', 'energy'] },
    { id: 'electric_meter', name: 'Electric Meter', keywords: ['utility', 'power'] },
    { id: 'solar_power', name: 'Solar Power', keywords: ['energy', 'green'] },
    { id: 'wind_power', name: 'Wind Power', keywords: ['energy', 'turbine'] },
    { id: 'energy_savings_leaf', name: 'Energy Savings', keywords: ['eco', 'green'] },
    // Health & Wellness
    { id: 'health_and_safety', name: 'Health Safety', keywords: ['medical', 'heart'] },
    { id: 'medical_information', name: 'Medical Info', keywords: ['health', 'record'] },
    { id: 'medication', name: 'Medication', keywords: ['pill', 'drug'] },
    { id: 'vaccines', name: 'Vaccines', keywords: ['shot', 'medical'] },
    { id: 'healing', name: 'Healing', keywords: ['bandage', 'medical'] },
    { id: 'emergency', name: 'Emergency', keywords: ['sos', 'help'] },
    { id: 'sick', name: 'Sick', keywords: ['ill', 'health'] },
    { id: 'coronavirus', name: 'Coronavirus', keywords: ['covid', 'virus'] },
    { id: 'masks', name: 'Masks', keywords: ['face', 'covid'] },
    { id: 'sanitizer', name: 'Sanitizer', keywords: ['clean', 'hygiene'] },
    { id: 'soap', name: 'Soap', keywords: ['clean', 'wash'] },
    { id: 'clean_hands', name: 'Clean Hands', keywords: ['wash', 'hygiene'] },
    { id: 'monitor_heart', name: 'Heart Monitor', keywords: ['health', 'pulse'] },
    { id: 'monitor_weight', name: 'Weight', keywords: ['scale', 'health'] },
    { id: 'self_improvement', name: 'Self Improvement', keywords: ['yoga', 'meditation'] },
    { id: 'spa', name: 'Spa', keywords: ['wellness', 'relax'] },
    { id: 'hot_tub', name: 'Hot Tub', keywords: ['spa', 'relax'] },
    { id: 'accessibility_new', name: 'Accessibility', keywords: ['person', 'arms'] },
    { id: 'accessible', name: 'Accessible', keywords: ['wheelchair', 'disability'] },
    { id: 'elderly', name: 'Elderly', keywords: ['senior', 'old'] },
    { id: 'pregnant_woman', name: 'Pregnant', keywords: ['woman', 'baby'] },
    { id: 'baby_changing_station', name: 'Baby Changing', keywords: ['infant', 'parent'] },
    { id: 'family_restroom', name: 'Family', keywords: ['parents', 'children'] },
    { id: 'stroller', name: 'Stroller', keywords: ['baby', 'pram'] },
    { id: 'child_care', name: 'Child Care', keywords: ['baby', 'nursery'] },
    { id: 'child_friendly', name: 'Child Friendly', keywords: ['kids', 'family'] },
    // AI & Automation
    { id: 'smart_toy', name: 'Smart Toy', keywords: ['robot', 'ai'] },
    { id: 'precision_manufacturing', name: 'Manufacturing', keywords: ['robot', 'arm'] },
    { id: 'memory', name: 'Memory', keywords: ['chip', 'ai'] },
    { id: 'psychology', name: 'Psychology', keywords: ['brain', 'ai'] },
    { id: 'model_training', name: 'Training', keywords: ['ai', 'machine'] },
    { id: 'auto_awesome', name: 'Auto Awesome', keywords: ['magic', 'ai'] },
    { id: 'auto_fix_high', name: 'Auto Fix', keywords: ['magic', 'ai'] },
    { id: 'batch_prediction', name: 'Prediction', keywords: ['ai', 'forecast'] },
    { id: 'insights', name: 'Insights', keywords: ['ai', 'analytics'] },
    { id: 'troubleshoot', name: 'Troubleshoot', keywords: ['debug', 'fix'] },
    { id: 'record_voice_over', name: 'Voice Over', keywords: ['speech', 'audio'] },
    { id: 'transcribe', name: 'Transcribe', keywords: ['speech', 'text'] },
    { id: 'g_translate', name: 'Translate', keywords: ['language', 'convert'] },
    { id: 'spellcheck', name: 'Spell Check', keywords: ['grammar', 'text'] },
    { id: 'text_to_speech', name: 'Text to Speech', keywords: ['voice', 'audio'] }
  ],
  fontawesome: {
    solid: [
      // Navigation & Actions
      { id: 'house', name: 'House', keywords: ['home', 'main'], unicode: '\uf015' },
      { id: 'house-chimney', name: 'House Chimney', keywords: ['home', 'building'], unicode: '\ue3af' },
      { id: 'magnifying-glass', name: 'Search', keywords: ['find'], unicode: '\uf002' },
      { id: 'magnifying-glass-plus', name: 'Zoom In', keywords: ['search', 'expand'], unicode: '\uf00e' },
      { id: 'magnifying-glass-minus', name: 'Zoom Out', keywords: ['search', 'shrink'], unicode: '\uf010' },
      { id: 'gear', name: 'Gear', keywords: ['settings', 'cog'], unicode: '\uf013' },
      { id: 'gears', name: 'Gears', keywords: ['settings', 'cogs'], unicode: '\uf085' },
      { id: 'sliders', name: 'Sliders', keywords: ['settings', 'options'], unicode: '\uf1de' },
      { id: 'bars', name: 'Bars', keywords: ['menu', 'hamburger'], unicode: '\uf0c9' },
      { id: 'bars-staggered', name: 'Bars Staggered', keywords: ['menu', 'list'], unicode: '\uf550' },
      { id: 'xmark', name: 'X Mark', keywords: ['close', 'exit'], unicode: '\uf00d' },
      { id: 'plus', name: 'Plus', keywords: ['add', 'new'], unicode: '\uf067' },
      { id: 'minus', name: 'Minus', keywords: ['remove'], unicode: '\uf068' },
      { id: 'pen', name: 'Pen', keywords: ['edit', 'write'], unicode: '\uf304' },
      { id: 'pen-to-square', name: 'Pen Square', keywords: ['edit', 'modify'], unicode: '\uf044' },
      { id: 'pencil', name: 'Pencil', keywords: ['edit', 'write'], unicode: '\uf303' },
      { id: 'trash', name: 'Trash', keywords: ['delete', 'remove'], unicode: '\uf1f8' },
      { id: 'trash-can', name: 'Trash Can', keywords: ['delete', 'garbage'], unicode: '\uf2ed' },
      { id: 'check', name: 'Check', keywords: ['done', 'complete'], unicode: '\uf00c' },
      { id: 'check-double', name: 'Double Check', keywords: ['done', 'verified'], unicode: '\uf560' },
      { id: 'arrow-left', name: 'Arrow Left', keywords: ['back', 'previous'], unicode: '\uf060' },
      { id: 'arrow-right', name: 'Arrow Right', keywords: ['next', 'forward'], unicode: '\uf061' },
      { id: 'arrow-up', name: 'Arrow Up', keywords: ['top'], unicode: '\uf062' },
      { id: 'arrow-down', name: 'Arrow Down', keywords: ['bottom'], unicode: '\uf063' },
      { id: 'arrows-rotate', name: 'Refresh', keywords: ['reload', 'sync'], unicode: '\uf021' },
      { id: 'rotate', name: 'Rotate', keywords: ['refresh', 'turn'], unicode: '\uf2f1' },
      { id: 'rotate-right', name: 'Rotate Right', keywords: ['redo'], unicode: '\uf2f9' },
      { id: 'rotate-left', name: 'Rotate Left', keywords: ['undo'], unicode: '\uf2ea' },
      { id: 'chevron-left', name: 'Chevron Left', keywords: ['back'], unicode: '\uf053' },
      { id: 'chevron-right', name: 'Chevron Right', keywords: ['next'], unicode: '\uf054' },
      { id: 'chevron-up', name: 'Chevron Up', keywords: ['collapse'], unicode: '\uf077' },
      { id: 'chevron-down', name: 'Chevron Down', keywords: ['expand'], unicode: '\uf078' },
      { id: 'angles-left', name: 'Double Left', keywords: ['first'], unicode: '\uf100' },
      { id: 'angles-right', name: 'Double Right', keywords: ['last'], unicode: '\uf101' },
      { id: 'caret-down', name: 'Caret Down', keywords: ['dropdown'], unicode: '\uf0d7' },
      { id: 'caret-up', name: 'Caret Up', keywords: ['collapse'], unicode: '\uf0d8' },
      { id: 'caret-left', name: 'Caret Left', keywords: ['back'], unicode: '\uf0d9' },
      { id: 'caret-right', name: 'Caret Right', keywords: ['next'], unicode: '\uf0da' },
      { id: 'ellipsis', name: 'Ellipsis', keywords: ['more', 'options'], unicode: '\uf141' },
      { id: 'ellipsis-vertical', name: 'Ellipsis Vertical', keywords: ['more', 'menu'], unicode: '\uf142' },
      { id: 'grip', name: 'Grip', keywords: ['drag', 'handle'], unicode: '\uf58d' },
      { id: 'grip-vertical', name: 'Grip Vertical', keywords: ['drag', 'handle'], unicode: '\uf58e' },
      { id: 'up-right-from-square', name: 'External Link', keywords: ['open', 'new'], unicode: '\uf35d' },
      { id: 'up-right-and-down-left-from-center', name: 'Expand', keywords: ['fullscreen'], unicode: '\uf424' },
      { id: 'down-left-and-up-right-to-center', name: 'Compress', keywords: ['minimize'], unicode: '\uf422' },
      { id: 'maximize', name: 'Maximize', keywords: ['fullscreen', 'expand'], unicode: '\uf31e' },
      { id: 'minimize', name: 'Minimize', keywords: ['shrink'], unicode: '\uf78c' },
      // Communication
      { id: 'envelope', name: 'Envelope', keywords: ['email', 'mail'], unicode: '\uf0e0' },
      { id: 'envelope-open', name: 'Envelope Open', keywords: ['email', 'read'], unicode: '\uf2b6' },
      { id: 'paper-plane', name: 'Paper Plane', keywords: ['send', 'submit'], unicode: '\uf1d8' },
      { id: 'inbox', name: 'Inbox', keywords: ['email', 'messages'], unicode: '\uf01c' },
      { id: 'comment', name: 'Comment', keywords: ['chat', 'message'], unicode: '\uf075' },
      { id: 'comments', name: 'Comments', keywords: ['chat', 'discussion'], unicode: '\uf086' },
      { id: 'comment-dots', name: 'Comment Dots', keywords: ['typing', 'message'], unicode: '\uf4ad' },
      { id: 'message', name: 'Message', keywords: ['chat', 'sms'], unicode: '\uf27a' },
      { id: 'bell', name: 'Bell', keywords: ['notification', 'alert'], unicode: '\uf0f3' },
      { id: 'bell-slash', name: 'Bell Slash', keywords: ['mute', 'silent'], unicode: '\uf1f6' },
      { id: 'phone', name: 'Phone', keywords: ['call', 'mobile'], unicode: '\uf095' },
      { id: 'phone-flip', name: 'Phone Flip', keywords: ['call', 'answer'], unicode: '\uf879' },
      { id: 'phone-volume', name: 'Phone Volume', keywords: ['call', 'speaker'], unicode: '\uf2a0' },
      { id: 'phone-slash', name: 'Phone Slash', keywords: ['hangup', 'end'], unicode: '\uf3dd' },
      { id: 'video', name: 'Video', keywords: ['camera', 'call'], unicode: '\uf03d' },
      { id: 'video-slash', name: 'Video Slash', keywords: ['camera', 'off'], unicode: '\uf4e2' },
      { id: 'share', name: 'Share', keywords: ['social', 'send'], unicode: '\uf064' },
      { id: 'share-nodes', name: 'Share Nodes', keywords: ['social', 'network'], unicode: '\uf1e0' },
      { id: 'share-from-square', name: 'Share Square', keywords: ['social', 'export'], unicode: '\uf14d' },
      { id: 'at', name: 'At', keywords: ['email', 'mention'], unicode: '\uf1fa' },
      { id: 'hashtag', name: 'Hashtag', keywords: ['tag', 'social'], unicode: '\uf292' },
      { id: 'retweet', name: 'Retweet', keywords: ['share', 'forward'], unicode: '\uf079' },
      { id: 'reply', name: 'Reply', keywords: ['respond', 'back'], unicode: '\uf3e5' },
      { id: 'reply-all', name: 'Reply All', keywords: ['respond', 'group'], unicode: '\uf122' },
      // Files & Content
      { id: 'link', name: 'Link', keywords: ['chain', 'url'], unicode: '\uf0c1' },
      { id: 'link-slash', name: 'Unlink', keywords: ['broken', 'disconnect'], unicode: '\uf127' },
      { id: 'folder', name: 'Folder', keywords: ['directory'], unicode: '\uf07b' },
      { id: 'folder-open', name: 'Folder Open', keywords: ['directory', 'browse'], unicode: '\uf07c' },
      { id: 'folder-plus', name: 'Folder Plus', keywords: ['directory', 'new'], unicode: '\uf65e' },
      { id: 'folder-minus', name: 'Folder Minus', keywords: ['directory', 'remove'], unicode: '\uf65d' },
      { id: 'file', name: 'File', keywords: ['document'], unicode: '\uf15b' },
      { id: 'file-lines', name: 'File Lines', keywords: ['document', 'text'], unicode: '\uf15c' },
      { id: 'file-pdf', name: 'PDF', keywords: ['document', 'adobe'], unicode: '\uf1c1' },
      { id: 'file-word', name: 'Word', keywords: ['document', 'microsoft'], unicode: '\uf1c2' },
      { id: 'file-excel', name: 'Excel', keywords: ['spreadsheet', 'microsoft'], unicode: '\uf1c3' },
      { id: 'file-powerpoint', name: 'PowerPoint', keywords: ['presentation', 'microsoft'], unicode: '\uf1c4' },
      { id: 'file-image', name: 'Image File', keywords: ['photo', 'picture'], unicode: '\uf1c5' },
      { id: 'file-video', name: 'Video File', keywords: ['movie', 'media'], unicode: '\uf1c8' },
      { id: 'file-audio', name: 'Audio File', keywords: ['music', 'sound'], unicode: '\uf1c7' },
      { id: 'file-code', name: 'Code File', keywords: ['programming', 'script'], unicode: '\uf1c9' },
      { id: 'file-zipper', name: 'Zip File', keywords: ['archive', 'compress'], unicode: '\uf1c6' },
      { id: 'file-arrow-down', name: 'Download File', keywords: ['save'], unicode: '\uf56d' },
      { id: 'file-arrow-up', name: 'Upload File', keywords: ['send'], unicode: '\uf574' },
      { id: 'file-export', name: 'Export File', keywords: ['save', 'output'], unicode: '\uf56e' },
      { id: 'file-import', name: 'Import File', keywords: ['load', 'input'], unicode: '\uf56f' },
      { id: 'copy', name: 'Copy', keywords: ['duplicate', 'clipboard'], unicode: '\uf0c5' },
      { id: 'paste', name: 'Paste', keywords: ['clipboard', 'insert'], unicode: '\uf0ea' },
      { id: 'scissors', name: 'Scissors', keywords: ['cut'], unicode: '\uf0c4' },
      { id: 'clipboard', name: 'Clipboard', keywords: ['copy', 'paste'], unicode: '\uf328' },
      { id: 'clipboard-check', name: 'Clipboard Check', keywords: ['done', 'task'], unicode: '\uf46c' },
      { id: 'clipboard-list', name: 'Clipboard List', keywords: ['tasks', 'todo'], unicode: '\uf46d' },
      { id: 'note-sticky', name: 'Sticky Note', keywords: ['memo', 'post-it'], unicode: '\uf249' },
      { id: 'cloud', name: 'Cloud', keywords: ['storage', 'online'], unicode: '\uf0c2' },
      { id: 'cloud-arrow-down', name: 'Cloud Download', keywords: ['storage', 'save'], unicode: '\uf0ed' },
      { id: 'cloud-arrow-up', name: 'Cloud Upload', keywords: ['storage', 'send'], unicode: '\uf0ee' },
      { id: 'box-archive', name: 'Archive', keywords: ['storage', 'box'], unicode: '\uf187' },
      { id: 'boxes-stacked', name: 'Boxes', keywords: ['storage', 'inventory'], unicode: '\uf468' },
      // Media - Images
      { id: 'image', name: 'Image', keywords: ['photo', 'picture'], unicode: '\uf03e' },
      { id: 'images', name: 'Images', keywords: ['photos', 'gallery'], unicode: '\uf302' },
      { id: 'camera', name: 'Camera', keywords: ['photo', 'capture'], unicode: '\uf030' },
      { id: 'camera-retro', name: 'Camera Retro', keywords: ['photo', 'vintage'], unicode: '\uf083' },
      { id: 'photo-film', name: 'Photo Film', keywords: ['media', 'slides'], unicode: '\uf87c' },
      { id: 'panorama', name: 'Panorama', keywords: ['wide', 'photo'], unicode: '\ue209' },
      { id: 'crop', name: 'Crop', keywords: ['cut', 'resize'], unicode: '\uf125' },
      { id: 'wand-magic-sparkles', name: 'Magic Wand', keywords: ['edit', 'enhance'], unicode: '\ue2ca' },
      { id: 'palette', name: 'Palette', keywords: ['color', 'art'], unicode: '\uf53f' },
      { id: 'paintbrush', name: 'Paintbrush', keywords: ['art', 'design'], unicode: '\uf1fc' },
      { id: 'brush', name: 'Brush', keywords: ['paint', 'art'], unicode: '\uf55d' },
      { id: 'fill-drip', name: 'Fill', keywords: ['paint', 'bucket'], unicode: '\uf576' },
      { id: 'droplet', name: 'Droplet', keywords: ['color', 'water'], unicode: '\uf043' },
      { id: 'eye-dropper', name: 'Eye Dropper', keywords: ['color', 'picker'], unicode: '\uf1fb' },
      // Media - Audio & Music
      { id: 'music', name: 'Music', keywords: ['audio', 'song'], unicode: '\uf001' },
      { id: 'headphones', name: 'Headphones', keywords: ['audio', 'listen'], unicode: '\uf025' },
      { id: 'headset', name: 'Headset', keywords: ['audio', 'gaming'], unicode: '\uf590' },
      { id: 'microphone', name: 'Microphone', keywords: ['audio', 'record'], unicode: '\uf130' },
      { id: 'microphone-slash', name: 'Mic Slash', keywords: ['mute', 'silent'], unicode: '\uf131' },
      { id: 'microphone-lines', name: 'Mic Lines', keywords: ['podcast', 'record'], unicode: '\uf3c9' },
      { id: 'podcast', name: 'Podcast', keywords: ['audio', 'show'], unicode: '\uf2ce' },
      { id: 'radio', name: 'Radio', keywords: ['broadcast', 'music'], unicode: '\uf8d7' },
      { id: 'volume-high', name: 'Volume High', keywords: ['sound', 'loud'], unicode: '\uf028' },
      { id: 'volume-low', name: 'Volume Low', keywords: ['sound', 'quiet'], unicode: '\uf027' },
      { id: 'volume-off', name: 'Volume Off', keywords: ['mute', 'silent'], unicode: '\uf026' },
      { id: 'volume-xmark', name: 'Volume Mute', keywords: ['mute', 'silent'], unicode: '\uf6a9' },
      { id: 'record-vinyl', name: 'Record', keywords: ['vinyl', 'music'], unicode: '\uf8d9' },
      { id: 'compact-disc', name: 'CD', keywords: ['disc', 'music'], unicode: '\uf51f' },
      { id: 'guitar', name: 'Guitar', keywords: ['music', 'instrument'], unicode: '\uf7a6' },
      { id: 'drum', name: 'Drum', keywords: ['music', 'percussion'], unicode: '\uf569' },
      // Media - Video & Playback
      { id: 'play', name: 'Play', keywords: ['start', 'video'], unicode: '\uf04b' },
      { id: 'pause', name: 'Pause', keywords: ['stop'], unicode: '\uf04c' },
      { id: 'stop', name: 'Stop', keywords: ['end'], unicode: '\uf04d' },
      { id: 'circle-play', name: 'Play Circle', keywords: ['start', 'video'], unicode: '\uf144' },
      { id: 'circle-pause', name: 'Pause Circle', keywords: ['stop'], unicode: '\uf28b' },
      { id: 'circle-stop', name: 'Stop Circle', keywords: ['end'], unicode: '\uf28d' },
      { id: 'forward', name: 'Forward', keywords: ['next', 'skip'], unicode: '\uf04e' },
      { id: 'backward', name: 'Backward', keywords: ['previous', 'rewind'], unicode: '\uf04a' },
      { id: 'forward-step', name: 'Forward Step', keywords: ['next'], unicode: '\uf051' },
      { id: 'backward-step', name: 'Backward Step', keywords: ['previous'], unicode: '\uf048' },
      { id: 'forward-fast', name: 'Fast Forward', keywords: ['skip'], unicode: '\uf050' },
      { id: 'backward-fast', name: 'Fast Backward', keywords: ['rewind'], unicode: '\uf049' },
      { id: 'repeat', name: 'Repeat', keywords: ['loop'], unicode: '\uf363' },
      { id: 'shuffle', name: 'Shuffle', keywords: ['random'], unicode: '\uf074' },
      { id: 'film', name: 'Film', keywords: ['movie', 'video'], unicode: '\uf008' },
      { id: 'clapperboard', name: 'Clapperboard', keywords: ['movie', 'action'], unicode: '\ue131' },
      { id: 'tv', name: 'TV', keywords: ['television', 'monitor'], unicode: '\uf26c' },
      { id: 'display', name: 'Display', keywords: ['screen', 'monitor'], unicode: '\ue163' },
      { id: 'youtube', name: 'YouTube', keywords: ['video', 'streaming'], unicode: '\uf167' },
      { id: 'closed-captioning', name: 'Closed Captioning', keywords: ['subtitles'], unicode: '\uf20a' },
      { id: 'expand', name: 'Expand', keywords: ['fullscreen'], unicode: '\uf065' },
      { id: 'compress', name: 'Compress', keywords: ['minimize'], unicode: '\uf066' },
      // Social & People
      { id: 'user', name: 'User', keywords: ['person', 'profile'], unicode: '\uf007' },
      { id: 'user-plus', name: 'User Plus', keywords: ['add', 'new'], unicode: '\uf234' },
      { id: 'user-minus', name: 'User Minus', keywords: ['remove'], unicode: '\uf503' },
      { id: 'user-check', name: 'User Check', keywords: ['verified'], unicode: '\uf4fc' },
      { id: 'user-xmark', name: 'User X', keywords: ['delete', 'ban'], unicode: '\uf235' },
      { id: 'user-pen', name: 'User Edit', keywords: ['modify'], unicode: '\uf4ff' },
      { id: 'user-gear', name: 'User Gear', keywords: ['settings'], unicode: '\uf4fe' },
      { id: 'user-shield', name: 'User Shield', keywords: ['admin', 'protect'], unicode: '\uf505' },
      { id: 'user-tie', name: 'User Tie', keywords: ['business', 'formal'], unicode: '\uf508' },
      { id: 'user-secret', name: 'User Secret', keywords: ['spy', 'incognito'], unicode: '\uf21b' },
      { id: 'user-astronaut', name: 'Astronaut', keywords: ['space', 'user'], unicode: '\uf4fb' },
      { id: 'user-ninja', name: 'Ninja', keywords: ['user', 'stealth'], unicode: '\uf504' },
      { id: 'users', name: 'Users', keywords: ['people', 'group'], unicode: '\uf0c0' },
      { id: 'users-gear', name: 'Users Gear', keywords: ['team', 'settings'], unicode: '\uf509' },
      { id: 'people-group', name: 'People Group', keywords: ['team', 'community'], unicode: '\ue533' },
      { id: 'user-group', name: 'User Group', keywords: ['team', 'members'], unicode: '\uf500' },
      { id: 'address-book', name: 'Address Book', keywords: ['contacts'], unicode: '\uf2b9' },
      { id: 'address-card', name: 'Address Card', keywords: ['contact', 'vcard'], unicode: '\uf2bb' },
      { id: 'id-card', name: 'ID Card', keywords: ['identity', 'badge'], unicode: '\uf2c2' },
      { id: 'id-badge', name: 'ID Badge', keywords: ['identity', 'employee'], unicode: '\uf2c1' },
      { id: 'globe', name: 'Globe', keywords: ['world', 'earth'], unicode: '\uf0ac' },
      { id: 'earth-americas', name: 'Earth Americas', keywords: ['world', 'globe'], unicode: '\uf57d' },
      { id: 'earth-europe', name: 'Earth Europe', keywords: ['world', 'globe'], unicode: '\uf7a2' },
      { id: 'earth-asia', name: 'Earth Asia', keywords: ['world', 'globe'], unicode: '\uf57e' },
      { id: 'language', name: 'Language', keywords: ['translate', 'globe'], unicode: '\uf1ab' },
      { id: 'heart', name: 'Heart', keywords: ['favorite', 'love'], unicode: '\uf004' },
      { id: 'heart-crack', name: 'Heart Crack', keywords: ['broken', 'sad'], unicode: '\uf7a9' },
      { id: 'heart-pulse', name: 'Heart Pulse', keywords: ['health', 'beat'], unicode: '\uf21e' },
      { id: 'star', name: 'Star', keywords: ['bookmark', 'rate'], unicode: '\uf005' },
      { id: 'star-half-stroke', name: 'Star Half', keywords: ['rate', 'partial'], unicode: '\uf5c0' },
      { id: 'bookmark', name: 'Bookmark', keywords: ['save', 'flag'], unicode: '\uf02e' },
      { id: 'thumbs-up', name: 'Thumbs Up', keywords: ['like', 'approve'], unicode: '\uf164' },
      { id: 'thumbs-down', name: 'Thumbs Down', keywords: ['dislike', 'reject'], unicode: '\uf165' },
      { id: 'face-smile', name: 'Smile', keywords: ['happy', 'emoji'], unicode: '\uf118' },
      { id: 'face-frown', name: 'Frown', keywords: ['sad', 'emoji'], unicode: '\uf119' },
      { id: 'face-meh', name: 'Meh', keywords: ['neutral', 'emoji'], unicode: '\uf11a' },
      { id: 'face-laugh', name: 'Laugh', keywords: ['happy', 'emoji'], unicode: '\uf599' },
      { id: 'face-grin-stars', name: 'Grin Stars', keywords: ['excited', 'emoji'], unicode: '\uf587' },
      { id: 'award', name: 'Award', keywords: ['badge', 'ribbon'], unicode: '\uf559' },
      { id: 'trophy', name: 'Trophy', keywords: ['award', 'winner'], unicode: '\uf091' },
      { id: 'medal', name: 'Medal', keywords: ['award', 'achievement'], unicode: '\uf5a2' },
      { id: 'crown', name: 'Crown', keywords: ['king', 'royal'], unicode: '\uf521' },
      { id: 'certificate', name: 'Certificate', keywords: ['award', 'diploma'], unicode: '\uf0a3' },
      // Hardware & Devices
      { id: 'desktop', name: 'Desktop', keywords: ['computer', 'pc'], unicode: '\uf108' },
      { id: 'laptop', name: 'Laptop', keywords: ['notebook'], unicode: '\uf109' },
      { id: 'mobile', name: 'Mobile', keywords: ['phone', 'smartphone'], unicode: '\uf3ce' },
      { id: 'mobile-screen', name: 'Mobile Screen', keywords: ['phone', 'app'], unicode: '\uf3cf' },
      { id: 'tablet', name: 'Tablet', keywords: ['ipad', 'device'], unicode: '\uf3fa' },
      { id: 'tablet-screen-button', name: 'Tablet Screen', keywords: ['ipad', 'device'], unicode: '\uf3fa' },
      { id: 'computer', name: 'Computer', keywords: ['pc', 'workstation'], unicode: '\ue4e5' },
      { id: 'keyboard', name: 'Keyboard', keywords: ['type', 'input'], unicode: '\uf11c' },
      { id: 'computer-mouse', name: 'Mouse', keywords: ['click', 'input'], unicode: '\uf8cc' },
      { id: 'print', name: 'Print', keywords: ['printer', 'document'], unicode: '\uf02f' },
      { id: 'fax', name: 'Fax', keywords: ['printer', 'office'], unicode: '\uf1ac' },
      { id: 'server', name: 'Server', keywords: ['hosting', 'database'], unicode: '\uf233' },
      { id: 'database', name: 'Database', keywords: ['storage', 'data'], unicode: '\uf1c0' },
      { id: 'hard-drive', name: 'Hard Drive', keywords: ['storage', 'disk'], unicode: '\uf0a0' },
      { id: 'sd-card', name: 'SD Card', keywords: ['storage', 'memory'], unicode: '\uf7c2' },
      { id: 'memory', name: 'Memory', keywords: ['ram', 'chip'], unicode: '\uf538' },
      { id: 'microchip', name: 'Microchip', keywords: ['cpu', 'processor'], unicode: '\uf2db' },
      { id: 'sim-card', name: 'SIM Card', keywords: ['mobile', 'phone'], unicode: '\uf7c4' },
      { id: 'wifi', name: 'WiFi', keywords: ['wireless', 'network'], unicode: '\uf1eb' },
      { id: 'bluetooth', name: 'Bluetooth', keywords: ['wireless', 'connect'], unicode: '\uf293' },
      { id: 'network-wired', name: 'Network Wired', keywords: ['ethernet', 'lan'], unicode: '\uf6ff' },
      { id: 'satellite-dish', name: 'Satellite Dish', keywords: ['signal', 'broadcast'], unicode: '\uf7c0' },
      { id: 'satellite', name: 'Satellite', keywords: ['space', 'gps'], unicode: '\uf7bf' },
      { id: 'tower-broadcast', name: 'Broadcast Tower', keywords: ['radio', 'signal'], unicode: '\uf519' },
      { id: 'tower-cell', name: 'Cell Tower', keywords: ['mobile', 'signal'], unicode: '\ue585' },
      { id: 'plug', name: 'Plug', keywords: ['power', 'electric'], unicode: '\uf1e6' },
      { id: 'charging-station', name: 'Charging Station', keywords: ['ev', 'electric'], unicode: '\uf5e7' },
      { id: 'battery-full', name: 'Battery Full', keywords: ['power', 'charge'], unicode: '\uf240' },
      { id: 'battery-half', name: 'Battery Half', keywords: ['power', 'charge'], unicode: '\uf242' },
      { id: 'battery-empty', name: 'Battery Empty', keywords: ['power', 'dead'], unicode: '\uf244' },
      { id: 'usb', name: 'USB', keywords: ['port', 'connect'], unicode: '\uf287' },
      { id: 'gamepad', name: 'Gamepad', keywords: ['gaming', 'controller'], unicode: '\uf11b' },
      { id: 'vr-cardboard', name: 'VR', keywords: ['virtual', 'reality'], unicode: '\uf729' },
      { id: 'robot', name: 'Robot', keywords: ['ai', 'bot'], unicode: '\uf544' },
      // Development & Code
      { id: 'code', name: 'Code', keywords: ['programming', 'developer'], unicode: '\uf121' },
      { id: 'code-branch', name: 'Code Branch', keywords: ['git', 'version'], unicode: '\uf126' },
      { id: 'code-commit', name: 'Code Commit', keywords: ['git', 'version'], unicode: '\uf386' },
      { id: 'code-compare', name: 'Code Compare', keywords: ['git', 'diff'], unicode: '\ue13a' },
      { id: 'code-fork', name: 'Code Fork', keywords: ['git', 'branch'], unicode: '\ue13b' },
      { id: 'code-merge', name: 'Code Merge', keywords: ['git', 'combine'], unicode: '\uf387' },
      { id: 'code-pull-request', name: 'Pull Request', keywords: ['git', 'pr'], unicode: '\ue13c' },
      { id: 'terminal', name: 'Terminal', keywords: ['console', 'command'], unicode: '\uf120' },
      { id: 'laptop-code', name: 'Laptop Code', keywords: ['developer', 'programming'], unicode: '\uf5fc' },
      { id: 'bug', name: 'Bug', keywords: ['debug', 'issue'], unicode: '\uf188' },
      { id: 'bug-slash', name: 'Bug Slash', keywords: ['fix', 'resolved'], unicode: '\ue490' },
      { id: 'wrench', name: 'Wrench', keywords: ['tools', 'build'], unicode: '\uf0ad' },
      { id: 'screwdriver', name: 'Screwdriver', keywords: ['tools', 'fix'], unicode: '\uf54a' },
      { id: 'screwdriver-wrench', name: 'Tools', keywords: ['build', 'settings'], unicode: '\uf7d9' },
      { id: 'hammer', name: 'Hammer', keywords: ['tools', 'build'], unicode: '\uf6e3' },
      { id: 'toolbox', name: 'Toolbox', keywords: ['tools', 'kit'], unicode: '\uf552' },
      { id: 'flask', name: 'Flask', keywords: ['science', 'lab'], unicode: '\uf0c3' },
      { id: 'flask-vial', name: 'Flask Vial', keywords: ['science', 'test'], unicode: '\ue4f3' },
      { id: 'vial', name: 'Vial', keywords: ['test', 'sample'], unicode: '\uf492' },
      { id: 'cube', name: 'Cube', keywords: ['3d', 'box'], unicode: '\uf1b2' },
      { id: 'cubes', name: 'Cubes', keywords: ['3d', 'blocks'], unicode: '\uf1b3' },
      { id: 'sitemap', name: 'Sitemap', keywords: ['structure', 'hierarchy'], unicode: '\uf0e8' },
      { id: 'diagram-project', name: 'Diagram', keywords: ['flow', 'chart'], unicode: '\uf542' },
      { id: 'puzzle-piece', name: 'Puzzle Piece', keywords: ['plugin', 'extension'], unicode: '\uf12e' },
      { id: 'layer-group', name: 'Layer Group', keywords: ['stack', 'layers'], unicode: '\uf5fd' },
      { id: 'object-group', name: 'Object Group', keywords: ['select', 'layers'], unicode: '\uf247' },
      { id: 'window-maximize', name: 'Window Maximize', keywords: ['expand'], unicode: '\uf2d0' },
      { id: 'window-minimize', name: 'Window Minimize', keywords: ['collapse'], unicode: '\uf2d1' },
      { id: 'window-restore', name: 'Window Restore', keywords: ['resize'], unicode: '\uf2d2' },
      { id: 'table', name: 'Table', keywords: ['grid', 'data'], unicode: '\uf0ce' },
      { id: 'table-cells', name: 'Table Cells', keywords: ['grid', 'spreadsheet'], unicode: '\uf00a' },
      { id: 'table-columns', name: 'Table Columns', keywords: ['grid', 'layout'], unicode: '\uf0db' },
      { id: 'table-list', name: 'Table List', keywords: ['rows', 'data'], unicode: '\uf00b' },
      // Business & Finance
      { id: 'briefcase', name: 'Briefcase', keywords: ['work', 'job'], unicode: '\uf0b1' },
      { id: 'building', name: 'Building', keywords: ['business', 'office'], unicode: '\uf1ad' },
      { id: 'building-columns', name: 'Building Columns', keywords: ['bank', 'government'], unicode: '\uf19c' },
      { id: 'industry', name: 'Industry', keywords: ['factory', 'manufacturing'], unicode: '\uf275' },
      { id: 'landmark', name: 'Landmark', keywords: ['monument', 'building'], unicode: '\uf66f' },
      { id: 'dollar-sign', name: 'Dollar', keywords: ['money', 'finance'], unicode: '\uf155' },
      { id: 'euro-sign', name: 'Euro', keywords: ['money', 'currency'], unicode: '\uf153' },
      { id: 'sterling-sign', name: 'Sterling', keywords: ['money', 'pound'], unicode: '\uf154' },
      { id: 'yen-sign', name: 'Yen', keywords: ['money', 'japan'], unicode: '\uf157' },
      { id: 'bitcoin-sign', name: 'Bitcoin', keywords: ['crypto', 'currency'], unicode: '\ue0b4' },
      { id: 'coins', name: 'Coins', keywords: ['money', 'currency'], unicode: '\uf51e' },
      { id: 'money-bill', name: 'Money Bill', keywords: ['cash', 'payment'], unicode: '\uf0d6' },
      { id: 'money-bills', name: 'Money Bills', keywords: ['cash', 'payment'], unicode: '\ue1f3' },
      { id: 'money-bill-wave', name: 'Money Wave', keywords: ['cash', 'payment'], unicode: '\uf53a' },
      { id: 'money-check', name: 'Money Check', keywords: ['payment', 'cheque'], unicode: '\uf53c' },
      { id: 'credit-card', name: 'Credit Card', keywords: ['payment', 'money'], unicode: '\uf09d' },
      { id: 'wallet', name: 'Wallet', keywords: ['money', 'payment'], unicode: '\uf555' },
      { id: 'piggy-bank', name: 'Piggy Bank', keywords: ['savings', 'money'], unicode: '\uf4d3' },
      { id: 'hand-holding-dollar', name: 'Hand Dollar', keywords: ['money', 'give'], unicode: '\uf4c0' },
      { id: 'sack-dollar', name: 'Money Sack', keywords: ['cash', 'bag'], unicode: '\uf81d' },
      { id: 'vault', name: 'Vault', keywords: ['safe', 'secure'], unicode: '\ue2c5' },
      { id: 'scale-balanced', name: 'Scale', keywords: ['law', 'justice'], unicode: '\uf24e' },
      { id: 'scale-unbalanced', name: 'Scale Unbalanced', keywords: ['unfair', 'justice'], unicode: '\uf515' },
      { id: 'cart-shopping', name: 'Shopping Cart', keywords: ['buy', 'store'], unicode: '\uf07a' },
      { id: 'cart-plus', name: 'Cart Plus', keywords: ['add', 'buy'], unicode: '\uf217' },
      { id: 'basket-shopping', name: 'Shopping Basket', keywords: ['buy', 'store'], unicode: '\uf291' },
      { id: 'bag-shopping', name: 'Shopping Bag', keywords: ['buy', 'store'], unicode: '\uf290' },
      { id: 'store', name: 'Store', keywords: ['shop', 'market'], unicode: '\uf54e' },
      { id: 'shop', name: 'Shop', keywords: ['store', 'market'], unicode: '\uf54f' },
      { id: 'receipt', name: 'Receipt', keywords: ['invoice', 'bill'], unicode: '\uf543' },
      { id: 'barcode', name: 'Barcode', keywords: ['scan', 'product'], unicode: '\uf02a' },
      { id: 'qrcode', name: 'QR Code', keywords: ['scan', 'link'], unicode: '\uf029' },
      { id: 'tags', name: 'Tags', keywords: ['label', 'price'], unicode: '\uf02c' },
      { id: 'tag', name: 'Tag', keywords: ['label', 'price'], unicode: '\uf02b' },
      { id: 'percent', name: 'Percent', keywords: ['discount', 'sale'], unicode: '\uf295' },
      { id: 'chart-line', name: 'Chart Line', keywords: ['analytics', 'stats'], unicode: '\uf201' },
      { id: 'chart-bar', name: 'Chart Bar', keywords: ['analytics', 'stats'], unicode: '\uf080' },
      { id: 'chart-pie', name: 'Chart Pie', keywords: ['analytics', 'stats'], unicode: '\uf200' },
      { id: 'chart-area', name: 'Chart Area', keywords: ['analytics', 'graph'], unicode: '\uf1fe' },
      { id: 'chart-column', name: 'Chart Column', keywords: ['analytics', 'stats'], unicode: '\ue0e3' },
      { id: 'chart-simple', name: 'Chart Simple', keywords: ['analytics', 'stats'], unicode: '\ue473' },
      { id: 'arrow-trend-up', name: 'Trend Up', keywords: ['growth', 'increase'], unicode: '\ue098' },
      { id: 'arrow-trend-down', name: 'Trend Down', keywords: ['decline', 'decrease'], unicode: '\ue097' },
      { id: 'ranking-star', name: 'Ranking Star', keywords: ['leaderboard', 'top'], unicode: '\ue561' },
      // Security & Privacy
      { id: 'lock', name: 'Lock', keywords: ['secure', 'password'], unicode: '\uf023' },
      { id: 'lock-open', name: 'Lock Open', keywords: ['unlock'], unicode: '\uf3c1' },
      { id: 'unlock', name: 'Unlock', keywords: ['open'], unicode: '\uf09c' },
      { id: 'key', name: 'Key', keywords: ['password', 'access'], unicode: '\uf084' },
      { id: 'shield', name: 'Shield', keywords: ['security', 'protect'], unicode: '\uf132' },
      { id: 'shield-halved', name: 'Shield Halved', keywords: ['security', 'antivirus'], unicode: '\uf3ed' },
      { id: 'shield-heart', name: 'Shield Heart', keywords: ['security', 'health'], unicode: '\ue574' },
      { id: 'user-lock', name: 'User Lock', keywords: ['security', 'protect'], unicode: '\uf502' },
      { id: 'fingerprint', name: 'Fingerprint', keywords: ['biometric', 'identity'], unicode: '\uf577' },
      { id: 'eye', name: 'Eye', keywords: ['view', 'visible'], unicode: '\uf06e' },
      { id: 'eye-slash', name: 'Eye Slash', keywords: ['hide', 'invisible'], unicode: '\uf070' },
      { id: 'mask', name: 'Mask', keywords: ['privacy', 'incognito'], unicode: '\uf6fa' },
      { id: 'ban', name: 'Ban', keywords: ['block', 'prohibit'], unicode: '\uf05e' },
      { id: 'circle-exclamation', name: 'Exclamation Circle', keywords: ['warning', 'alert'], unicode: '\uf06a' },
      { id: 'triangle-exclamation', name: 'Warning', keywords: ['alert', 'caution'], unicode: '\uf071' },
      { id: 'circle-check', name: 'Check Circle', keywords: ['success', 'done'], unicode: '\uf058' },
      { id: 'circle-xmark', name: 'X Circle', keywords: ['error', 'close'], unicode: '\uf057' },
      { id: 'circle-info', name: 'Info Circle', keywords: ['information'], unicode: '\uf05a' },
      { id: 'circle-question', name: 'Question Circle', keywords: ['help', 'support'], unicode: '\uf059' },
      { id: 'flag', name: 'Flag', keywords: ['report', 'mark'], unicode: '\uf024' },
      { id: 'bell-concierge', name: 'Bell Concierge', keywords: ['service', 'hotel'], unicode: '\uf562' },
      // Time & Calendar
      { id: 'calendar', name: 'Calendar', keywords: ['date', 'schedule'], unicode: '\uf073' },
      { id: 'calendar-days', name: 'Calendar Days', keywords: ['date', 'schedule'], unicode: '\uf073' },
      { id: 'calendar-check', name: 'Calendar Check', keywords: ['date', 'event'], unicode: '\uf274' },
      { id: 'calendar-plus', name: 'Calendar Plus', keywords: ['date', 'add'], unicode: '\uf271' },
      { id: 'calendar-minus', name: 'Calendar Minus', keywords: ['date', 'remove'], unicode: '\uf272' },
      { id: 'calendar-xmark', name: 'Calendar X', keywords: ['date', 'cancel'], unicode: '\uf273' },
      { id: 'calendar-week', name: 'Calendar Week', keywords: ['date', 'schedule'], unicode: '\uf784' },
      { id: 'clock', name: 'Clock', keywords: ['time', 'schedule'], unicode: '\uf017' },
      { id: 'clock-rotate-left', name: 'History', keywords: ['time', 'past'], unicode: '\uf1da' },
      { id: 'hourglass', name: 'Hourglass', keywords: ['time', 'wait'], unicode: '\uf254' },
      { id: 'hourglass-half', name: 'Hourglass Half', keywords: ['time', 'wait'], unicode: '\uf252' },
      { id: 'hourglass-start', name: 'Hourglass Start', keywords: ['time', 'begin'], unicode: '\uf251' },
      { id: 'hourglass-end', name: 'Hourglass End', keywords: ['time', 'finish'], unicode: '\uf253' },
      { id: 'stopwatch', name: 'Stopwatch', keywords: ['time', 'timer'], unicode: '\uf2f2' },
      { id: 'stopwatch-20', name: 'Stopwatch 20', keywords: ['time', 'timer'], unicode: '\ue06f' },
      { id: 'timer', name: 'Timer', keywords: ['countdown'], unicode: '\ue29e' },
      { id: 'alarm-clock', name: 'Alarm Clock', keywords: ['time', 'wake'], unicode: '\uf34e' },
      { id: 'business-time', name: 'Business Time', keywords: ['work', 'hours'], unicode: '\uf64a' },
      // Misc & Utilities
      { id: 'download', name: 'Download', keywords: ['save', 'get'], unicode: '\uf019' },
      { id: 'upload', name: 'Upload', keywords: ['send', 'put'], unicode: '\uf093' },
      { id: 'file-download', name: 'File Download', keywords: ['save'], unicode: '\uf56d' },
      { id: 'file-upload', name: 'File Upload', keywords: ['send'], unicode: '\uf574' },
      { id: 'floppy-disk', name: 'Floppy Disk', keywords: ['save'], unicode: '\uf0c7' },
      { id: 'print', name: 'Print', keywords: ['printer'], unicode: '\uf02f' },
      { id: 'list', name: 'List', keywords: ['menu', 'items'], unicode: '\uf03a' },
      { id: 'list-ul', name: 'List Unordered', keywords: ['bullets'], unicode: '\uf0ca' },
      { id: 'list-ol', name: 'List Ordered', keywords: ['numbers'], unicode: '\uf0cb' },
      { id: 'list-check', name: 'List Check', keywords: ['todo', 'tasks'], unicode: '\uf0ae' },
      { id: 'filter', name: 'Filter', keywords: ['sort', 'funnel'], unicode: '\uf0b0' },
      { id: 'sort', name: 'Sort', keywords: ['order', 'arrange'], unicode: '\uf0dc' },
      { id: 'sort-up', name: 'Sort Up', keywords: ['ascending'], unicode: '\uf0de' },
      { id: 'sort-down', name: 'Sort Down', keywords: ['descending'], unicode: '\uf0dd' },
      { id: 'grip-lines', name: 'Grip Lines', keywords: ['drag', 'move'], unicode: '\uf7a4' },
      { id: 'grip-lines-vertical', name: 'Grip Vertical', keywords: ['drag', 'move'], unicode: '\uf7a5' },
      { id: 'arrows-up-down-left-right', name: 'Move', keywords: ['drag', 'arrows'], unicode: '\uf047' },
      { id: 'arrows-left-right', name: 'Arrows Horizontal', keywords: ['resize', 'width'], unicode: '\uf07e' },
      { id: 'arrows-up-down', name: 'Arrows Vertical', keywords: ['resize', 'height'], unicode: '\uf07d' },
      { id: 'question', name: 'Question', keywords: ['help', 'support'], unicode: '\uf128' },
      { id: 'lightbulb', name: 'Lightbulb', keywords: ['idea', 'tip'], unicode: '\uf0eb' },
      { id: 'book', name: 'Book', keywords: ['read', 'documentation'], unicode: '\uf02d' },
      { id: 'book-open', name: 'Book Open', keywords: ['read', 'documentation'], unicode: '\uf518' },
      { id: 'bookmark', name: 'Bookmark', keywords: ['save', 'favorite'], unicode: '\uf02e' },
      { id: 'newspaper', name: 'Newspaper', keywords: ['news', 'article'], unicode: '\uf1ea' },
      { id: 'rss', name: 'RSS', keywords: ['feed', 'subscribe'], unicode: '\uf09e' },
      { id: 'graduation-cap', name: 'Graduation Cap', keywords: ['education', 'school'], unicode: '\uf19d' },
      { id: 'school', name: 'School', keywords: ['education', 'building'], unicode: '\uf549' },
      { id: 'chalkboard', name: 'Chalkboard', keywords: ['education', 'teach'], unicode: '\uf51b' },
      { id: 'chalkboard-user', name: 'Chalkboard User', keywords: ['education', 'teacher'], unicode: '\uf51c' },
      { id: 'rocket', name: 'Rocket', keywords: ['launch', 'startup'], unicode: '\uf135' },
      { id: 'atom', name: 'Atom', keywords: ['science', 'physics'], unicode: '\uf5d2' },
      { id: 'dna', name: 'DNA', keywords: ['science', 'biology'], unicode: '\uf471' },
      { id: 'microscope', name: 'Microscope', keywords: ['science', 'lab'], unicode: '\uf610' },
      { id: 'magnet', name: 'Magnet', keywords: ['attract', 'physics'], unicode: '\uf076' },
      // Travel & Transportation
      { id: 'plane', name: 'Plane', keywords: ['flight', 'travel'], unicode: '\uf072' },
      { id: 'plane-departure', name: 'Plane Departure', keywords: ['flight', 'takeoff'], unicode: '\uf5b0' },
      { id: 'plane-arrival', name: 'Plane Arrival', keywords: ['flight', 'landing'], unicode: '\uf5af' },
      { id: 'car', name: 'Car', keywords: ['drive', 'vehicle'], unicode: '\uf1b9' },
      { id: 'car-side', name: 'Car Side', keywords: ['drive', 'vehicle'], unicode: '\uf5e4' },
      { id: 'taxi', name: 'Taxi', keywords: ['cab', 'ride'], unicode: '\uf1ba' },
      { id: 'bus', name: 'Bus', keywords: ['transit', 'public'], unicode: '\uf207' },
      { id: 'bus-simple', name: 'Bus Simple', keywords: ['transit'], unicode: '\uf55e' },
      { id: 'train', name: 'Train', keywords: ['rail', 'transit'], unicode: '\uf238' },
      { id: 'train-subway', name: 'Subway', keywords: ['metro', 'transit'], unicode: '\uf239' },
      { id: 'train-tram', name: 'Tram', keywords: ['streetcar'], unicode: '\ue5b4' },
      { id: 'ship', name: 'Ship', keywords: ['boat', 'cruise'], unicode: '\uf21a' },
      { id: 'ferry', name: 'Ferry', keywords: ['boat', 'water'], unicode: '\ue4ea' },
      { id: 'sailboat', name: 'Sailboat', keywords: ['boat', 'sailing'], unicode: '\ue445' },
      { id: 'anchor', name: 'Anchor', keywords: ['ship', 'port'], unicode: '\uf13d' },
      { id: 'bicycle', name: 'Bicycle', keywords: ['bike', 'cycling'], unicode: '\uf206' },
      { id: 'motorcycle', name: 'Motorcycle', keywords: ['bike', 'vehicle'], unicode: '\uf21c' },
      { id: 'truck', name: 'Truck', keywords: ['delivery', 'shipping'], unicode: '\uf0d1' },
      { id: 'truck-fast', name: 'Truck Fast', keywords: ['delivery', 'express'], unicode: '\uf48b' },
      { id: 'helicopter', name: 'Helicopter', keywords: ['flight', 'aircraft'], unicode: '\uf533' },
      { id: 'shuttle-space', name: 'Space Shuttle', keywords: ['rocket', 'space'], unicode: '\uf197' },
      { id: 'road', name: 'Road', keywords: ['highway', 'street'], unicode: '\uf018' },
      { id: 'route', name: 'Route', keywords: ['path', 'direction'], unicode: '\uf4d7' },
      { id: 'map', name: 'Map', keywords: ['navigation', 'location'], unicode: '\uf279' },
      { id: 'map-location', name: 'Map Location', keywords: ['navigation', 'pin'], unicode: '\uf59f' },
      { id: 'map-location-dot', name: 'Map Location Dot', keywords: ['navigation', 'marker'], unicode: '\uf5a0' },
      { id: 'location-dot', name: 'Location Dot', keywords: ['pin', 'marker'], unicode: '\uf3c5' },
      { id: 'location-pin', name: 'Location Pin', keywords: ['marker'], unicode: '\uf041' },
      { id: 'location-crosshairs', name: 'Location Crosshairs', keywords: ['gps', 'target'], unicode: '\uf601' },
      { id: 'compass', name: 'Compass', keywords: ['navigation', 'direction'], unicode: '\uf14e' },
      { id: 'signs-post', name: 'Signs Post', keywords: ['direction', 'guide'], unicode: '\uf277' },
      { id: 'gas-pump', name: 'Gas Pump', keywords: ['fuel', 'station'], unicode: '\uf52f' },
      { id: 'suitcase', name: 'Suitcase', keywords: ['luggage', 'travel'], unicode: '\uf0f2' },
      { id: 'suitcase-rolling', name: 'Suitcase Rolling', keywords: ['luggage', 'travel'], unicode: '\uf5c1' },
      { id: 'passport', name: 'Passport', keywords: ['travel', 'id'], unicode: '\uf5ab' },
      { id: 'ticket', name: 'Ticket', keywords: ['travel', 'event'], unicode: '\uf145' },
      // Nature & Weather
      { id: 'sun', name: 'Sun', keywords: ['weather', 'bright'], unicode: '\uf185' },
      { id: 'moon', name: 'Moon', keywords: ['night', 'dark'], unicode: '\uf186' },
      { id: 'cloud-sun', name: 'Cloud Sun', keywords: ['weather', 'partly'], unicode: '\uf6c4' },
      { id: 'cloud-moon', name: 'Cloud Moon', keywords: ['weather', 'night'], unicode: '\uf6c3' },
      { id: 'cloud-rain', name: 'Cloud Rain', keywords: ['weather', 'rainy'], unicode: '\uf73d' },
      { id: 'cloud-showers-heavy', name: 'Heavy Rain', keywords: ['weather', 'storm'], unicode: '\uf740' },
      { id: 'cloud-bolt', name: 'Thunderstorm', keywords: ['weather', 'lightning'], unicode: '\uf76c' },
      { id: 'snowflake', name: 'Snowflake', keywords: ['weather', 'cold'], unicode: '\uf2dc' },
      { id: 'temperature-high', name: 'High Temperature', keywords: ['weather', 'hot'], unicode: '\uf769' },
      { id: 'temperature-low', name: 'Low Temperature', keywords: ['weather', 'cold'], unicode: '\uf76b' },
      { id: 'wind', name: 'Wind', keywords: ['weather', 'breeze'], unicode: '\uf72e' },
      { id: 'umbrella', name: 'Umbrella', keywords: ['rain', 'weather'], unicode: '\uf0e9' },
      { id: 'water', name: 'Water', keywords: ['liquid', 'ocean'], unicode: '\uf773' },
      { id: 'fire', name: 'Fire', keywords: ['flame', 'hot'], unicode: '\uf06d' },
      { id: 'fire-flame-curved', name: 'Flame', keywords: ['fire', 'hot'], unicode: '\uf7e4' },
      { id: 'leaf', name: 'Leaf', keywords: ['nature', 'plant'], unicode: '\uf06c' },
      { id: 'tree', name: 'Tree', keywords: ['nature', 'forest'], unicode: '\uf1bb' },
      { id: 'seedling', name: 'Seedling', keywords: ['plant', 'grow'], unicode: '\uf4d8' },
      { id: 'mountain', name: 'Mountain', keywords: ['nature', 'landscape'], unicode: '\uf6fc' },
      { id: 'mountain-sun', name: 'Mountain Sun', keywords: ['landscape', 'nature'], unicode: '\ue52f' },
      { id: 'umbrella-beach', name: 'Beach Umbrella', keywords: ['vacation', 'summer'], unicode: '\uf5ca' },
      { id: 'paw', name: 'Paw', keywords: ['pet', 'animal'], unicode: '\uf1b0' },
      { id: 'dog', name: 'Dog', keywords: ['pet', 'animal'], unicode: '\uf6d3' },
      { id: 'cat', name: 'Cat', keywords: ['pet', 'animal'], unicode: '\uf6be' },
      { id: 'fish', name: 'Fish', keywords: ['animal', 'aquatic'], unicode: '\uf578' },
      { id: 'bird', name: 'Bird', keywords: ['animal', 'flying'], unicode: '\uf516' },
      { id: 'horse', name: 'Horse', keywords: ['animal', 'riding'], unicode: '\uf6f0' },
      { id: 'spider', name: 'Spider', keywords: ['insect', 'bug'], unicode: '\uf717' },
      // Food & Drink
      { id: 'utensils', name: 'Utensils', keywords: ['food', 'restaurant'], unicode: '\uf2e7' },
      { id: 'bowl-food', name: 'Bowl Food', keywords: ['meal', 'eating'], unicode: '\ue4c6' },
      { id: 'pizza-slice', name: 'Pizza', keywords: ['food', 'fast'], unicode: '\uf818' },
      { id: 'burger', name: 'Burger', keywords: ['food', 'fast'], unicode: '\uf805' },
      { id: 'hotdog', name: 'Hotdog', keywords: ['food', 'fast'], unicode: '\uf80f' },
      { id: 'ice-cream', name: 'Ice Cream', keywords: ['dessert', 'sweet'], unicode: '\uf810' },
      { id: 'cookie', name: 'Cookie', keywords: ['dessert', 'sweet'], unicode: '\uf563' },
      { id: 'cake-candles', name: 'Cake', keywords: ['dessert', 'birthday'], unicode: '\uf1fd' },
      { id: 'apple-whole', name: 'Apple', keywords: ['fruit', 'healthy'], unicode: '\uf5d1' },
      { id: 'carrot', name: 'Carrot', keywords: ['vegetable', 'healthy'], unicode: '\uf787' },
      { id: 'lemon', name: 'Lemon', keywords: ['fruit', 'citrus'], unicode: '\uf094' },
      { id: 'pepper-hot', name: 'Pepper', keywords: ['spicy', 'food'], unicode: '\uf816' },
      { id: 'egg', name: 'Egg', keywords: ['food', 'breakfast'], unicode: '\uf7fb' },
      { id: 'bacon', name: 'Bacon', keywords: ['food', 'breakfast'], unicode: '\uf7e5' },
      { id: 'bread-slice', name: 'Bread', keywords: ['food', 'bakery'], unicode: '\uf7ec' },
      { id: 'cheese', name: 'Cheese', keywords: ['food', 'dairy'], unicode: '\uf7ef' },
      { id: 'mug-hot', name: 'Mug Hot', keywords: ['coffee', 'tea'], unicode: '\uf7b6' },
      { id: 'mug-saucer', name: 'Mug Saucer', keywords: ['coffee', 'tea'], unicode: '\uf0f4' },
      { id: 'coffee', name: 'Coffee', keywords: ['drink', 'cafe'], unicode: '\uf0f4' },
      { id: 'wine-glass', name: 'Wine Glass', keywords: ['drink', 'alcohol'], unicode: '\uf4e3' },
      { id: 'wine-bottle', name: 'Wine Bottle', keywords: ['drink', 'alcohol'], unicode: '\uf72f' },
      { id: 'beer-mug-empty', name: 'Beer Mug', keywords: ['drink', 'alcohol'], unicode: '\uf0fc' },
      { id: 'champagne-glasses', name: 'Champagne', keywords: ['drink', 'celebration'], unicode: '\uf79f' },
      { id: 'martini-glass', name: 'Martini', keywords: ['drink', 'cocktail'], unicode: '\uf57b' },
      { id: 'glass-water', name: 'Glass Water', keywords: ['drink', 'hydration'], unicode: '\ue4f4' },
      { id: 'bottle-water', name: 'Water Bottle', keywords: ['drink', 'hydration'], unicode: '\ue4c5' },
      // Sports & Games
      { id: 'futbol', name: 'Soccer Ball', keywords: ['football', 'sport'], unicode: '\uf1e3' },
      { id: 'basketball', name: 'Basketball', keywords: ['sport', 'ball'], unicode: '\uf434' },
      { id: 'football', name: 'Football', keywords: ['american', 'sport'], unicode: '\uf44e' },
      { id: 'baseball', name: 'Baseball', keywords: ['sport', 'ball'], unicode: '\uf433' },
      { id: 'volleyball', name: 'Volleyball', keywords: ['sport', 'ball'], unicode: '\uf45f' },
      { id: 'table-tennis-paddle-ball', name: 'Ping Pong', keywords: ['sport', 'table'], unicode: '\uf45d' },
      { id: 'bowling-ball', name: 'Bowling', keywords: ['sport', 'ball'], unicode: '\uf436' },
      { id: 'golf-ball-tee', name: 'Golf Ball', keywords: ['sport'], unicode: '\uf450' },
      { id: 'hockey-puck', name: 'Hockey Puck', keywords: ['sport', 'ice'], unicode: '\uf453' },
      { id: 'dumbbell', name: 'Dumbbell', keywords: ['fitness', 'gym'], unicode: '\uf44b' },
      { id: 'person-running', name: 'Running', keywords: ['exercise', 'sport'], unicode: '\uf70c' },
      { id: 'person-biking', name: 'Biking', keywords: ['cycling', 'sport'], unicode: '\uf84a' },
      { id: 'person-swimming', name: 'Swimming', keywords: ['sport', 'water'], unicode: '\uf5c4' },
      { id: 'person-skiing', name: 'Skiing', keywords: ['sport', 'winter'], unicode: '\uf7c9' },
      { id: 'person-snowboarding', name: 'Snowboarding', keywords: ['sport', 'winter'], unicode: '\uf7ce' },
      { id: 'person-hiking', name: 'Hiking', keywords: ['outdoor', 'walk'], unicode: '\uf6ec' },
      { id: 'chess', name: 'Chess', keywords: ['game', 'strategy'], unicode: '\uf439' },
      { id: 'chess-board', name: 'Chess Board', keywords: ['game', 'strategy'], unicode: '\uf43c' },
      { id: 'dice', name: 'Dice', keywords: ['game', 'random'], unicode: '\uf522' },
      { id: 'dice-d20', name: 'D20', keywords: ['game', 'rpg'], unicode: '\uf6cf' },
      { id: 'puzzle-piece', name: 'Puzzle Piece', keywords: ['game', 'jigsaw'], unicode: '\uf12e' },
      { id: 'gamepad', name: 'Gamepad', keywords: ['gaming', 'controller'], unicode: '\uf11b' },
      { id: 'headset', name: 'Headset', keywords: ['gaming', 'audio'], unicode: '\uf590' },
      // Health & Medical
      { id: 'heart-pulse', name: 'Heart Pulse', keywords: ['health', 'medical'], unicode: '\uf21e' },
      { id: 'stethoscope', name: 'Stethoscope', keywords: ['doctor', 'medical'], unicode: '\uf0f1' },
      { id: 'user-doctor', name: 'Doctor', keywords: ['medical', 'health'], unicode: '\uf0f0' },
      { id: 'hospital', name: 'Hospital', keywords: ['medical', 'building'], unicode: '\uf0f8' },
      { id: 'kit-medical', name: 'Medical Kit', keywords: ['first aid', 'health'], unicode: '\uf479' },
      { id: 'syringe', name: 'Syringe', keywords: ['medical', 'injection'], unicode: '\uf48e' },
      { id: 'pills', name: 'Pills', keywords: ['medicine', 'drug'], unicode: '\uf484' },
      { id: 'capsules', name: 'Capsules', keywords: ['medicine', 'drug'], unicode: '\uf46b' },
      { id: 'tablets', name: 'Tablets', keywords: ['medicine', 'drug'], unicode: '\uf490' },
      { id: 'prescription-bottle', name: 'Prescription', keywords: ['medicine', 'drug'], unicode: '\uf485' },
      { id: 'bandage', name: 'Bandage', keywords: ['medical', 'wound'], unicode: '\uf462' },
      { id: 'thermometer', name: 'Thermometer', keywords: ['temperature', 'fever'], unicode: '\uf491' },
      { id: 'x-ray', name: 'X-Ray', keywords: ['medical', 'scan'], unicode: '\uf497' },
      { id: 'tooth', name: 'Tooth', keywords: ['dental', 'health'], unicode: '\uf5c9' },
      { id: 'lungs', name: 'Lungs', keywords: ['health', 'breathing'], unicode: '\uf604' },
      { id: 'brain', name: 'Brain', keywords: ['mind', 'think'], unicode: '\uf5dc' },
      { id: 'bone', name: 'Bone', keywords: ['skeleton', 'anatomy'], unicode: '\uf5d7' },
      { id: 'wheelchair', name: 'Wheelchair', keywords: ['accessible', 'disability'], unicode: '\uf193' },
      { id: 'crutch', name: 'Crutch', keywords: ['injury', 'support'], unicode: '\uf7f7' },
      { id: 'virus', name: 'Virus', keywords: ['disease', 'covid'], unicode: '\ue074' },
      { id: 'virus-slash', name: 'Virus Slash', keywords: ['disease', 'safe'], unicode: '\ue075' },
      { id: 'shield-virus', name: 'Shield Virus', keywords: ['protect', 'health'], unicode: '\ue06c' },
      { id: 'hand-sparkles', name: 'Hand Sparkles', keywords: ['clean', 'sanitize'], unicode: '\ue05d' },
      { id: 'pump-soap', name: 'Soap', keywords: ['clean', 'wash'], unicode: '\ue06b' },
      { id: 'head-side-mask', name: 'Mask', keywords: ['covid', 'protect'], unicode: '\ue063' }
    ],
    brands: [
      // Version Control & Code Hosting
      { id: 'github', name: 'GitHub', keywords: ['git', 'code', 'repo'], unicode: '\uf09b' },
      { id: 'github-alt', name: 'GitHub Alt', keywords: ['git', 'code'], unicode: '\uf113' },
      { id: 'gitlab', name: 'GitLab', keywords: ['git', 'code', 'repo'], unicode: '\uf296' },
      { id: 'bitbucket', name: 'Bitbucket', keywords: ['git', 'code', 'atlassian'], unicode: '\uf171' },
      { id: 'git', name: 'Git', keywords: ['version', 'control'], unicode: '\uf1d3' },
      { id: 'git-alt', name: 'Git Alt', keywords: ['version', 'control'], unicode: '\uf841' },
      { id: 'sourcetree', name: 'Sourcetree', keywords: ['git', 'atlassian'], unicode: '\uf7d3' },
      // DevOps & Cloud
      { id: 'docker', name: 'Docker', keywords: ['container', 'devops'], unicode: '\uf395' },
      { id: 'kubernetes', name: 'Kubernetes', keywords: ['container', 'devops', 'k8s'], unicode: '\uf5e7' },
      { id: 'aws', name: 'AWS', keywords: ['amazon', 'cloud'], unicode: '\uf375' },
      { id: 'google-cloud', name: 'Google Cloud', keywords: ['gcp', 'cloud'], unicode: '\uf3c2' },
      { id: 'microsoft', name: 'Microsoft', keywords: ['azure', 'cloud'], unicode: '\uf3ca' },
      { id: 'digital-ocean', name: 'Digital Ocean', keywords: ['cloud', 'hosting'], unicode: '\uf391' },
      { id: 'cloudflare', name: 'Cloudflare', keywords: ['cdn', 'dns'], unicode: '\ue07d' },
      { id: 'jenkins', name: 'Jenkins', keywords: ['ci', 'devops'], unicode: '\uf3b6' },
      { id: 'jira', name: 'Jira', keywords: ['project', 'atlassian'], unicode: '\uf7b1' },
      { id: 'confluence', name: 'Confluence', keywords: ['wiki', 'atlassian'], unicode: '\uf78d' },
      // Operating Systems
      { id: 'linux', name: 'Linux', keywords: ['os', 'penguin'], unicode: '\uf17c' },
      { id: 'ubuntu', name: 'Ubuntu', keywords: ['linux', 'os'], unicode: '\uf7df' },
      { id: 'centos', name: 'CentOS', keywords: ['linux', 'os'], unicode: '\uf789' },
      { id: 'redhat', name: 'Red Hat', keywords: ['linux', 'os'], unicode: '\uf7bc' },
      { id: 'fedora', name: 'Fedora', keywords: ['linux', 'os'], unicode: '\uf798' },
      { id: 'suse', name: 'SUSE', keywords: ['linux', 'os'], unicode: '\uf7d6' },
      { id: 'debian', name: 'Debian', keywords: ['linux', 'os'], unicode: '\ue60b' },
      { id: 'freebsd', name: 'FreeBSD', keywords: ['bsd', 'os'], unicode: '\uf3a4' },
      { id: 'windows', name: 'Windows', keywords: ['microsoft', 'os'], unicode: '\uf17a' },
      { id: 'apple', name: 'Apple', keywords: ['mac', 'ios'], unicode: '\uf179' },
      { id: 'android', name: 'Android', keywords: ['google', 'mobile'], unicode: '\uf17b' },
      { id: 'raspberry-pi', name: 'Raspberry Pi', keywords: ['linux', 'hardware'], unicode: '\uf7bb' },
      // Browsers
      { id: 'chrome', name: 'Chrome', keywords: ['browser', 'google'], unicode: '\uf268' },
      { id: 'firefox', name: 'Firefox', keywords: ['browser', 'mozilla'], unicode: '\uf269' },
      { id: 'firefox-browser', name: 'Firefox Browser', keywords: ['browser', 'mozilla'], unicode: '\ue007' },
      { id: 'safari', name: 'Safari', keywords: ['browser', 'apple'], unicode: '\uf267' },
      { id: 'edge', name: 'Edge', keywords: ['browser', 'microsoft'], unicode: '\uf282' },
      { id: 'opera', name: 'Opera', keywords: ['browser'], unicode: '\uf26a' },
      { id: 'internet-explorer', name: 'Internet Explorer', keywords: ['browser', 'ie'], unicode: '\uf26b' },
      // Programming Languages
      { id: 'js', name: 'JavaScript', keywords: ['code', 'programming'], unicode: '\uf3b8' },
      { id: 'js-square', name: 'JavaScript Square', keywords: ['code', 'programming'], unicode: '\uf3b9' },
      { id: 'python', name: 'Python', keywords: ['code', 'programming'], unicode: '\uf3e2' },
      { id: 'php', name: 'PHP', keywords: ['code', 'programming'], unicode: '\uf457' },
      { id: 'java', name: 'Java', keywords: ['code', 'programming'], unicode: '\uf4e4' },
      { id: 'rust', name: 'Rust', keywords: ['code', 'programming'], unicode: '\ue07a' },
      { id: 'golang', name: 'Go', keywords: ['code', 'programming', 'google'], unicode: '\ue40f' },
      { id: 'swift', name: 'Swift', keywords: ['code', 'programming', 'apple'], unicode: '\uf8e1' },
      { id: 'html5', name: 'HTML5', keywords: ['code', 'web'], unicode: '\uf13b' },
      { id: 'css3', name: 'CSS3', keywords: ['code', 'web', 'style'], unicode: '\uf13c' },
      { id: 'css3-alt', name: 'CSS3 Alt', keywords: ['code', 'web', 'style'], unicode: '\uf38b' },
      { id: 'sass', name: 'Sass', keywords: ['css', 'style'], unicode: '\uf41e' },
      { id: 'less', name: 'Less', keywords: ['css', 'style'], unicode: '\uf41d' },
      { id: 'markdown', name: 'Markdown', keywords: ['code', 'text'], unicode: '\uf60f' },
      { id: 'r-project', name: 'R', keywords: ['code', 'statistics'], unicode: '\uf4f7' },
      // JavaScript Frameworks
      { id: 'react', name: 'React', keywords: ['javascript', 'frontend'], unicode: '\uf41b' },
      { id: 'vuejs', name: 'Vue.js', keywords: ['javascript', 'frontend'], unicode: '\uf41f' },
      { id: 'angular', name: 'Angular', keywords: ['javascript', 'frontend'], unicode: '\uf420' },
      { id: 'node', name: 'Node', keywords: ['javascript', 'backend'], unicode: '\uf419' },
      { id: 'node-js', name: 'Node.js', keywords: ['javascript', 'backend'], unicode: '\uf3d3' },
      { id: 'npm', name: 'NPM', keywords: ['node', 'package'], unicode: '\uf3d4' },
      { id: 'yarn', name: 'Yarn', keywords: ['node', 'package'], unicode: '\uf7e3' },
      { id: 'gulp', name: 'Gulp', keywords: ['build', 'task'], unicode: '\uf3ae' },
      { id: 'grunt', name: 'Grunt', keywords: ['build', 'task'], unicode: '\uf3ad' },
      { id: 'ember', name: 'Ember', keywords: ['javascript', 'frontend'], unicode: '\uf423' },
      { id: 'backbone', name: 'Backbone', keywords: ['javascript', 'frontend'], unicode: '\uf417' },
      // Other Frameworks & Tools
      { id: 'laravel', name: 'Laravel', keywords: ['php', 'framework'], unicode: '\uf3bd' },
      { id: 'symfony', name: 'Symfony', keywords: ['php', 'framework'], unicode: '\uf83d' },
      { id: 'drupal', name: 'Drupal', keywords: ['php', 'cms'], unicode: '\uf1a9' },
      { id: 'magento', name: 'Magento', keywords: ['php', 'ecommerce'], unicode: '\uf3c4' },
      { id: 'wordpress', name: 'WordPress', keywords: ['cms', 'blog'], unicode: '\uf19a' },
      { id: 'wordpress-simple', name: 'WordPress Simple', keywords: ['cms', 'blog'], unicode: '\uf411' },
      { id: 'joomla', name: 'Joomla', keywords: ['cms', 'php'], unicode: '\uf1aa' },
      { id: 'bootstrap', name: 'Bootstrap', keywords: ['css', 'framework'], unicode: '\uf836' },
      { id: 'fonticons', name: 'Font Icons', keywords: ['icons', 'font'], unicode: '\uf280' },
      { id: 'font-awesome', name: 'Font Awesome', keywords: ['icons'], unicode: '\uf2b4' },
      // Databases
      { id: 'cpanel', name: 'cPanel', keywords: ['hosting', 'database'], unicode: '\uf388' },
      // Social Media - General
      { id: 'twitter', name: 'Twitter', keywords: ['x', 'social'], unicode: '\uf099' },
      { id: 'x-twitter', name: 'X Twitter', keywords: ['social', 'elon'], unicode: '\ue61b' },
      { id: 'square-twitter', name: 'Twitter Square', keywords: ['social'], unicode: '\uf081' },
      { id: 'facebook', name: 'Facebook', keywords: ['social', 'meta'], unicode: '\uf09a' },
      { id: 'facebook-f', name: 'Facebook F', keywords: ['social', 'meta'], unicode: '\uf39e' },
      { id: 'square-facebook', name: 'Facebook Square', keywords: ['social', 'meta'], unicode: '\uf082' },
      { id: 'facebook-messenger', name: 'Messenger', keywords: ['chat', 'meta'], unicode: '\uf39f' },
      { id: 'instagram', name: 'Instagram', keywords: ['social', 'photos'], unicode: '\uf16d' },
      { id: 'square-instagram', name: 'Instagram Square', keywords: ['social', 'photos'], unicode: '\ue055' },
      { id: 'linkedin', name: 'LinkedIn', keywords: ['social', 'business'], unicode: '\uf08c' },
      { id: 'linkedin-in', name: 'LinkedIn In', keywords: ['social', 'business'], unicode: '\uf0e1' },
      { id: 'pinterest', name: 'Pinterest', keywords: ['social', 'images'], unicode: '\uf0d2' },
      { id: 'pinterest-p', name: 'Pinterest P', keywords: ['social', 'images'], unicode: '\uf231' },
      { id: 'square-pinterest', name: 'Pinterest Square', keywords: ['social', 'images'], unicode: '\uf0d3' },
      { id: 'tiktok', name: 'TikTok', keywords: ['social', 'video'], unicode: '\ue07b' },
      { id: 'snapchat', name: 'Snapchat', keywords: ['social', 'photos'], unicode: '\uf2ab' },
      { id: 'square-snapchat', name: 'Snapchat Square', keywords: ['social', 'photos'], unicode: '\uf2ad' },
      { id: 'whatsapp', name: 'WhatsApp', keywords: ['chat', 'meta'], unicode: '\uf232' },
      { id: 'square-whatsapp', name: 'WhatsApp Square', keywords: ['chat', 'meta'], unicode: '\uf40c' },
      { id: 'telegram', name: 'Telegram', keywords: ['chat', 'messaging'], unicode: '\uf2c6' },
      { id: 'signal', name: 'Signal', keywords: ['chat', 'privacy'], unicode: '\uf8e6' },
      { id: 'viber', name: 'Viber', keywords: ['chat', 'messaging'], unicode: '\uf409' },
      { id: 'line', name: 'Line', keywords: ['chat', 'messaging'], unicode: '\uf3c0' },
      { id: 'wechat', name: 'WeChat', keywords: ['chat', 'china'], unicode: '\uf1d7' },
      { id: 'weibo', name: 'Weibo', keywords: ['social', 'china'], unicode: '\uf18a' },
      { id: 'qq', name: 'QQ', keywords: ['chat', 'china'], unicode: '\uf1d6' },
      // Video & Streaming
      { id: 'youtube', name: 'YouTube', keywords: ['video', 'google'], unicode: '\uf167' },
      { id: 'square-youtube', name: 'YouTube Square', keywords: ['video', 'google'], unicode: '\uf431' },
      { id: 'twitch', name: 'Twitch', keywords: ['streaming', 'gaming'], unicode: '\uf1e8' },
      { id: 'vimeo', name: 'Vimeo', keywords: ['video'], unicode: '\uf27d' },
      { id: 'vimeo-v', name: 'Vimeo V', keywords: ['video'], unicode: '\uf27d' },
      { id: 'square-vimeo', name: 'Vimeo Square', keywords: ['video'], unicode: '\uf194' },
      { id: 'dailymotion', name: 'Dailymotion', keywords: ['video'], unicode: '\ue052' },
      { id: 'kickstarter', name: 'Kickstarter', keywords: ['crowdfunding', 'video'], unicode: '\uf3bb' },
      { id: 'kickstarter-k', name: 'Kickstarter K', keywords: ['crowdfunding'], unicode: '\uf3bc' },
      // Music & Audio
      { id: 'spotify', name: 'Spotify', keywords: ['music', 'streaming'], unicode: '\uf1bc' },
      { id: 'apple-music', name: 'Apple Music', keywords: ['music', 'streaming'], unicode: '\uf8e8' },
      { id: 'deezer', name: 'Deezer', keywords: ['music', 'streaming'], unicode: '\ue077' },
      { id: 'soundcloud', name: 'SoundCloud', keywords: ['music', 'audio'], unicode: '\uf1be' },
      { id: 'itunes', name: 'iTunes', keywords: ['music', 'apple'], unicode: '\uf3b4' },
      { id: 'itunes-note', name: 'iTunes Note', keywords: ['music', 'apple'], unicode: '\uf3b5' },
      { id: 'napster', name: 'Napster', keywords: ['music', 'streaming'], unicode: '\uf3d2' },
      { id: 'lastfm', name: 'Last.fm', keywords: ['music', 'scrobble'], unicode: '\uf202' },
      { id: 'square-lastfm', name: 'Last.fm Square', keywords: ['music'], unicode: '\uf203' },
      { id: 'bandcamp', name: 'Bandcamp', keywords: ['music', 'indie'], unicode: '\uf2d5' },
      { id: 'audible', name: 'Audible', keywords: ['audio', 'books'], unicode: '\uf373' },
      { id: 'podcast', name: 'Podcast', keywords: ['audio', 'show'], unicode: '\uf2ce' },
      // Gaming
      { id: 'discord', name: 'Discord', keywords: ['chat', 'gaming'], unicode: '\uf392' },
      { id: 'steam', name: 'Steam', keywords: ['gaming', 'valve'], unicode: '\uf1b6' },
      { id: 'steam-symbol', name: 'Steam Symbol', keywords: ['gaming', 'valve'], unicode: '\uf3f6' },
      { id: 'square-steam', name: 'Steam Square', keywords: ['gaming'], unicode: '\uf1b7' },
      { id: 'playstation', name: 'PlayStation', keywords: ['gaming', 'sony'], unicode: '\uf3df' },
      { id: 'xbox', name: 'Xbox', keywords: ['gaming', 'microsoft'], unicode: '\uf412' },
      { id: 'nintendo-switch', name: 'Nintendo Switch', keywords: ['gaming'], unicode: '\uf418' },
      { id: 'battle-net', name: 'Battle.net', keywords: ['gaming', 'blizzard'], unicode: '\uf835' },
      { id: 'itch-io', name: 'itch.io', keywords: ['gaming', 'indie'], unicode: '\uf83a' },
      { id: 'unity', name: 'Unity', keywords: ['gaming', 'engine'], unicode: '\ue049' },
      { id: 'unreal-engine', name: 'Unreal Engine', keywords: ['gaming', 'engine'], unicode: '\uf8e8' },
      // Work & Productivity
      { id: 'slack', name: 'Slack', keywords: ['chat', 'work'], unicode: '\uf198' },
      { id: 'slack-hash', name: 'Slack Hash', keywords: ['chat', 'work'], unicode: '\uf3ef' },
      { id: 'trello', name: 'Trello', keywords: ['project', 'kanban'], unicode: '\uf181' },
      { id: 'asana', name: 'Asana', keywords: ['project', 'tasks'], unicode: '\ue1b5' },
      { id: 'notion', name: 'Notion', keywords: ['notes', 'wiki'], unicode: '\ue4c6' },
      { id: 'evernote', name: 'Evernote', keywords: ['notes'], unicode: '\uf839' },
      { id: 'google-drive', name: 'Google Drive', keywords: ['storage', 'cloud'], unicode: '\uf3aa' },
      { id: 'dropbox', name: 'Dropbox', keywords: ['storage', 'cloud'], unicode: '\uf16b' },
      { id: 'box', name: 'Box', keywords: ['storage', 'cloud'], unicode: '\uf15f' },
      { id: 'onedrive', name: 'OneDrive', keywords: ['storage', 'microsoft'], unicode: '\ue4c4' },
      { id: 'icloud', name: 'iCloud', keywords: ['storage', 'apple'], unicode: '\uf428' },
      { id: 'salesforce', name: 'Salesforce', keywords: ['crm', 'business'], unicode: '\uf83b' },
      { id: 'hubspot', name: 'HubSpot', keywords: ['crm', 'marketing'], unicode: '\uf3b2' },
      { id: 'mailchimp', name: 'Mailchimp', keywords: ['email', 'marketing'], unicode: '\uf59e' },
      { id: 'google', name: 'Google', keywords: ['search', 'chrome'], unicode: '\uf1a0' },
      { id: 'google-plus', name: 'Google Plus', keywords: ['social', 'google'], unicode: '\uf2b3' },
      { id: 'google-plus-g', name: 'Google Plus G', keywords: ['social', 'google'], unicode: '\uf0d5' },
      { id: 'google-play', name: 'Google Play', keywords: ['android', 'apps'], unicode: '\uf3ab' },
      { id: 'google-wallet', name: 'Google Wallet', keywords: ['payment', 'google'], unicode: '\uf1ee' },
      { id: 'google-pay', name: 'Google Pay', keywords: ['payment', 'google'], unicode: '\ue079' },
      { id: 'google-scholar', name: 'Google Scholar', keywords: ['research', 'academic'], unicode: '\ue63b' },
      // Community & Forums
      { id: 'reddit', name: 'Reddit', keywords: ['social', 'forum'], unicode: '\uf1a1' },
      { id: 'reddit-alien', name: 'Reddit Alien', keywords: ['social', 'forum'], unicode: '\uf281' },
      { id: 'square-reddit', name: 'Reddit Square', keywords: ['social', 'forum'], unicode: '\uf1a2' },
      { id: 'quora', name: 'Quora', keywords: ['qa', 'forum'], unicode: '\uf2c4' },
      { id: 'stack-overflow', name: 'Stack Overflow', keywords: ['qa', 'code'], unicode: '\uf16c' },
      { id: 'stack-exchange', name: 'Stack Exchange', keywords: ['qa', 'forum'], unicode: '\uf18d' },
      { id: 'hacker-news', name: 'Hacker News', keywords: ['tech', 'forum'], unicode: '\uf1d4' },
      { id: 'square-hacker-news', name: 'Hacker News Square', keywords: ['tech', 'forum'], unicode: '\uf3af' },
      { id: 'product-hunt', name: 'Product Hunt', keywords: ['startups', 'tech'], unicode: '\uf288' },
      { id: 'dev', name: 'DEV', keywords: ['blog', 'code'], unicode: '\uf6cc' },
      { id: 'medium', name: 'Medium', keywords: ['blog', 'writing'], unicode: '\uf23a' },
      { id: 'blogger', name: 'Blogger', keywords: ['blog', 'google'], unicode: '\uf37c' },
      { id: 'blogger-b', name: 'Blogger B', keywords: ['blog', 'google'], unicode: '\uf37d' },
      { id: 'tumblr', name: 'Tumblr', keywords: ['blog', 'social'], unicode: '\uf173' },
      { id: 'square-tumblr', name: 'Tumblr Square', keywords: ['blog', 'social'], unicode: '\uf174' },
      { id: 'goodreads', name: 'Goodreads', keywords: ['books', 'reading'], unicode: '\uf3a8' },
      { id: 'goodreads-g', name: 'Goodreads G', keywords: ['books', 'reading'], unicode: '\uf3a9' },
      // Payment & Finance
      { id: 'paypal', name: 'PayPal', keywords: ['payment', 'money'], unicode: '\uf1ed' },
      { id: 'stripe', name: 'Stripe', keywords: ['payment', 'money'], unicode: '\uf429' },
      { id: 'stripe-s', name: 'Stripe S', keywords: ['payment', 'money'], unicode: '\uf42a' },
      { id: 'apple-pay', name: 'Apple Pay', keywords: ['payment', 'apple'], unicode: '\uf415' },
      { id: 'amazon-pay', name: 'Amazon Pay', keywords: ['payment', 'amazon'], unicode: '\uf42c' },
      { id: 'cc-visa', name: 'Visa', keywords: ['payment', 'card'], unicode: '\uf1f0' },
      { id: 'cc-mastercard', name: 'Mastercard', keywords: ['payment', 'card'], unicode: '\uf1f1' },
      { id: 'cc-amex', name: 'Amex', keywords: ['payment', 'card'], unicode: '\uf1f3' },
      { id: 'cc-discover', name: 'Discover', keywords: ['payment', 'card'], unicode: '\uf1f2' },
      { id: 'cc-diners-club', name: 'Diners Club', keywords: ['payment', 'card'], unicode: '\uf24c' },
      { id: 'cc-jcb', name: 'JCB', keywords: ['payment', 'card'], unicode: '\uf24b' },
      { id: 'cc-paypal', name: 'PayPal Card', keywords: ['payment', 'card'], unicode: '\uf1f4' },
      { id: 'cc-stripe', name: 'Stripe Card', keywords: ['payment', 'card'], unicode: '\uf1f5' },
      { id: 'cc-apple-pay', name: 'Apple Pay Card', keywords: ['payment', 'card'], unicode: '\uf416' },
      { id: 'cc-amazon-pay', name: 'Amazon Pay Card', keywords: ['payment', 'card'], unicode: '\uf42d' },
      { id: 'bitcoin', name: 'Bitcoin', keywords: ['crypto', 'money'], unicode: '\uf15a' },
      { id: 'btc', name: 'BTC', keywords: ['crypto', 'bitcoin'], unicode: '\uf15a' },
      { id: 'ethereum', name: 'Ethereum', keywords: ['crypto', 'money'], unicode: '\uf42e' },
      { id: 'monero', name: 'Monero', keywords: ['crypto', 'privacy'], unicode: '\uf3d0' },
      { id: 'shopify', name: 'Shopify', keywords: ['ecommerce', 'store'], unicode: '\ue057' },
      { id: 'amazon', name: 'Amazon', keywords: ['shopping', 'ecommerce'], unicode: '\uf270' },
      { id: 'ebay', name: 'eBay', keywords: ['shopping', 'auction'], unicode: '\uf4f4' },
      { id: 'etsy', name: 'Etsy', keywords: ['shopping', 'handmade'], unicode: '\uf2d7' },
      // Design & Creative
      { id: 'figma', name: 'Figma', keywords: ['design', 'ui'], unicode: '\uf799' },
      { id: 'sketch', name: 'Sketch', keywords: ['design', 'ui'], unicode: '\uf7c6' },
      { id: 'invision', name: 'InVision', keywords: ['design', 'prototype'], unicode: '\uf7b0' },
      { id: 'adobe', name: 'Adobe', keywords: ['design', 'creative'], unicode: '\uf778' },
      { id: 'behance', name: 'Behance', keywords: ['design', 'portfolio'], unicode: '\uf1b4' },
      { id: 'square-behance', name: 'Behance Square', keywords: ['design', 'portfolio'], unicode: '\uf1b5' },
      { id: 'dribbble', name: 'Dribbble', keywords: ['design', 'portfolio'], unicode: '\uf17d' },
      { id: 'square-dribbble', name: 'Dribbble Square', keywords: ['design', 'portfolio'], unicode: '\uf397' },
      { id: 'deviantart', name: 'DeviantArt', keywords: ['art', 'portfolio'], unicode: '\uf1bd' },
      { id: 'artstation', name: 'ArtStation', keywords: ['art', 'portfolio'], unicode: '\ue188' },
      { id: 'unsplash', name: 'Unsplash', keywords: ['photos', 'stock'], unicode: '\ue07c' },
      { id: 'pexels', name: 'Pexels', keywords: ['photos', 'stock'], unicode: '\ue8bb' },
      { id: 'flickr', name: 'Flickr', keywords: ['photos', 'social'], unicode: '\uf16e' },
      { id: '500px', name: '500px', keywords: ['photos', 'portfolio'], unicode: '\uf26e' },
      { id: 'creative-commons', name: 'Creative Commons', keywords: ['license', 'open'], unicode: '\uf25e' },
      // Education & Learning
      { id: 'wikipedia-w', name: 'Wikipedia', keywords: ['wiki', 'knowledge'], unicode: '\uf266' },
      { id: 'gratipay', name: 'Gratipay', keywords: ['donate', 'tips'], unicode: '\uf184' },
      { id: 'patreon', name: 'Patreon', keywords: ['donate', 'creator'], unicode: '\uf3d9' },
      { id: 'kofi', name: 'Ko-fi', keywords: ['donate', 'coffee'], unicode: '\ue4c2' },
      { id: 'buy-n-large', name: 'Buy N Large', keywords: ['shop'], unicode: '\uf8a6' },
      // Security & Privacy
      { id: 'keybase', name: 'Keybase', keywords: ['security', 'crypto'], unicode: '\uf4f5' },
      { id: 'keycdn', name: 'KeyCDN', keywords: ['cdn', 'security'], unicode: '\uf3ba' },
      { id: 'expeditedssl', name: 'ExpediteSSL', keywords: ['ssl', 'security'], unicode: '\uf23e' },
      // Food & Delivery
      { id: 'uber', name: 'Uber', keywords: ['ride', 'delivery'], unicode: '\uf402' },
      { id: 'lyft', name: 'Lyft', keywords: ['ride', 'transport'], unicode: '\uf3c3' },
      { id: 'airbnb', name: 'Airbnb', keywords: ['travel', 'stay'], unicode: '\uf834' },
      { id: 'yelp', name: 'Yelp', keywords: ['reviews', 'food'], unicode: '\uf1e9' },
      { id: 'tripadvisor', name: 'TripAdvisor', keywords: ['travel', 'reviews'], unicode: '\uf262' },
      // News & Media
      { id: 'bbc', name: 'BBC', keywords: ['news', 'media'], unicode: '\uf2db' },
      { id: 'nytimes', name: 'NY Times', keywords: ['news', 'media'], unicode: '\uf3eb' },
      { id: 'mashable', name: 'Mashable', keywords: ['news', 'tech'], unicode: '\uf3cb' },
      // Hardware
      { id: 'usb', name: 'USB', keywords: ['port', 'hardware'], unicode: '\uf287' },
      { id: 'bluetooth', name: 'Bluetooth', keywords: ['wireless', 'hardware'], unicode: '\uf293' },
      { id: 'bluetooth-b', name: 'Bluetooth B', keywords: ['wireless', 'hardware'], unicode: '\uf294' },
      // Misc Brands
      { id: 'waze', name: 'Waze', keywords: ['navigation', 'maps'], unicode: '\uf83f' },
      { id: 'strava', name: 'Strava', keywords: ['fitness', 'running'], unicode: '\uf428' },
      { id: 'meetup', name: 'Meetup', keywords: ['events', 'community'], unicode: '\uf2e0' },
      { id: 'eventbrite', name: 'Eventbrite', keywords: ['events', 'tickets'], unicode: '\uf410' },
      { id: 'imdb', name: 'IMDB', keywords: ['movies', 'database'], unicode: '\uf2d8' },
      { id: 'pied-piper', name: 'Pied Piper', keywords: ['silicon valley', 'tv'], unicode: '\uf2ae' },
      { id: 'pied-piper-alt', name: 'Pied Piper Alt', keywords: ['silicon valley', 'tv'], unicode: '\uf1a8' },
      { id: 'pied-piper-hat', name: 'Pied Piper Hat', keywords: ['silicon valley', 'tv'], unicode: '\uf4e5' },
      { id: 'hooli', name: 'Hooli', keywords: ['silicon valley', 'tv'], unicode: '\uf427' },
      { id: 'mandalorian', name: 'Mandalorian', keywords: ['star wars', 'disney'], unicode: '\uf50f' },
      { id: 'galactic-republic', name: 'Galactic Republic', keywords: ['star wars'], unicode: '\uf50c' },
      { id: 'galactic-senate', name: 'Galactic Senate', keywords: ['star wars'], unicode: '\uf50d' },
      { id: 'empire', name: 'Empire', keywords: ['star wars'], unicode: '\uf1d1' },
      { id: 'rebel', name: 'Rebel', keywords: ['star wars'], unicode: '\uf1d0' },
      { id: 'jedi-order', name: 'Jedi Order', keywords: ['star wars'], unicode: '\uf50e' },
      { id: 'sith', name: 'Sith', keywords: ['star wars'], unicode: '\uf512' },
      { id: 'old-republic', name: 'Old Republic', keywords: ['star wars'], unicode: '\uf510' },
      { id: 'd-and-d', name: 'D&D', keywords: ['gaming', 'rpg'], unicode: '\uf38d' },
      { id: 'd-and-d-beyond', name: 'D&D Beyond', keywords: ['gaming', 'rpg'], unicode: '\uf6ca' },
      { id: 'wizards-of-the-coast', name: 'Wizards', keywords: ['gaming', 'magic'], unicode: '\uf730' },
      { id: 'critical-role', name: 'Critical Role', keywords: ['dnd', 'streaming'], unicode: '\uf6c9' },
      { id: 'gitkraken', name: 'GitKraken', keywords: ['git', 'tool'], unicode: '\uf3a6' },
      { id: 'codepen', name: 'CodePen', keywords: ['code', 'sandbox'], unicode: '\uf1cb' },
      { id: 'codiepie', name: 'Codiepie', keywords: ['code'], unicode: '\uf284' },
      { id: 'jsfiddle', name: 'JSFiddle', keywords: ['code', 'sandbox'], unicode: '\uf1cc' },
      { id: 'glide', name: 'Glide', keywords: ['mobile', 'apps'], unicode: '\uf2a5' },
      { id: 'glide-g', name: 'Glide G', keywords: ['mobile', 'apps'], unicode: '\uf2a6' },
      { id: 'gitter', name: 'Gitter', keywords: ['chat', 'code'], unicode: '\uf426' },
      { id: 'rocketchat', name: 'Rocket.Chat', keywords: ['chat', 'team'], unicode: '\uf3e8' },
      { id: 'mattermost', name: 'Mattermost', keywords: ['chat', 'team'], unicode: '\ue4c6' },
      { id: 'square-gitlab', name: 'GitLab Square', keywords: ['git', 'code'], unicode: '\ue5ae' },
      { id: 'square-github', name: 'GitHub Square', keywords: ['git', 'code'], unicode: '\uf092' },
      { id: 'square-git', name: 'Git Square', keywords: ['version', 'control'], unicode: '\uf1d2' },
      { id: 'sticker-mule', name: 'Sticker Mule', keywords: ['print', 'stickers'], unicode: '\uf3f7' },
      { id: 'digital-ocean', name: 'DigitalOcean', keywords: ['cloud', 'hosting'], unicode: '\uf391' },
      { id: 'linode', name: 'Linode', keywords: ['cloud', 'hosting'], unicode: '\uf2b8' },
      { id: 'vultr', name: 'Vultr', keywords: ['cloud', 'hosting'], unicode: '\ue4c3' },
      { id: 'hive', name: 'Hive', keywords: ['blockchain', 'social'], unicode: '\ue07f' },
      { id: 'threads', name: 'Threads', keywords: ['social', 'meta'], unicode: '\ue618' },
      { id: 'bluesky', name: 'Bluesky', keywords: ['social', 'decentralized'], unicode: '\ue671' },
      { id: 'mastodon', name: 'Mastodon', keywords: ['social', 'fediverse'], unicode: '\uf4f6' },
      { id: 'pixiv', name: 'Pixiv', keywords: ['art', 'anime'], unicode: '\ue4c1' }
    ]
  }
};

/**
 * Search icons by name and keywords
 * @param {string} query - Search query
 * @param {string} pack - 'all', 'material', 'fontawesome-solid', 'fontawesome-brands'
 * @returns {Array} Matching icons with pack info
 */
function searchIcons(query, pack = 'all') {
  const q = query.toLowerCase().trim();
  let icons = [];

  // Material Icons
  if (pack === 'all' || pack === 'material') {
    const materialIcons = ICON_REGISTRY.material.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.keywords.some(k => k.includes(q))
    ).map(i => ({ ...i, pack: 'material' }));
    icons = icons.concat(materialIcons);
  }

  // Font Awesome Solid
  if (pack === 'all' || pack === 'fontawesome' || pack === 'fontawesome-solid') {
    const solidIcons = ICON_REGISTRY.fontawesome.solid.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.keywords.some(k => k.includes(q))
    ).map(i => ({ ...i, pack: 'fontawesome-solid' }));
    icons = icons.concat(solidIcons);
  }

  // Font Awesome Brands
  if (pack === 'all' || pack === 'fontawesome' || pack === 'fontawesome-brands') {
    const brandIcons = ICON_REGISTRY.fontawesome.brands.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.keywords.some(k => k.includes(q))
    ).map(i => ({ ...i, pack: 'fontawesome-brands' }));
    icons = icons.concat(brandIcons);
  }

  return icons;
}

/**
 * Get all icons from a pack
 * @param {string} pack - 'material', 'fontawesome-solid', 'fontawesome-brands'
 * @returns {Array} All icons from the pack
 */
function getAllIconsFromPack(pack) {
  if (pack === 'material') {
    return ICON_REGISTRY.material.map(i => ({ ...i, pack: 'material' }));
  }
  if (pack === 'fontawesome-solid') {
    return ICON_REGISTRY.fontawesome.solid.map(i => ({ ...i, pack: 'fontawesome-solid' }));
  }
  if (pack === 'fontawesome-brands') {
    return ICON_REGISTRY.fontawesome.brands.map(i => ({ ...i, pack: 'fontawesome-brands' }));
  }
  return [];
}

// Debounce utility function
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

// State
const state = {
  links: [],
  tags: [],
  preferences: {
    layout: 'grid',
    pageTitle: 'Simple Linkz',
    themePreset: 'midnight',
    accentColor: '#3b82f6',
    backgroundColor: '#0a0a0a'
  },
  searchQuery: '',
  activeTagFilter: null,  // null = show all, tagId = filter by that tag
  editingLink: null,
  csrfToken: null
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
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/logout`, { method: 'POST', headers });
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
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/links`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ links })
    });
    if (res.status === 401) {
      showLoginScreen();
    }
    // Handle CSRF token expiration
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        // Retry with new token
        const retryHeaders = { 'Content-Type': 'application/json' };
        if (state.csrfToken) {
          retryHeaders['X-CSRF-Token'] = state.csrfToken;
        }
        const retryRes = await fetch(`${BASE_PATH}/api/links`, {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify({ links })
        });
        return retryRes.json();
      }
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
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/preferences`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ preferences })
    });
    if (res.status === 401) {
      showLoginScreen();
    }
    // Handle CSRF token expiration
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'Content-Type': 'application/json' };
        if (state.csrfToken) {
          retryHeaders['X-CSRF-Token'] = state.csrfToken;
        }
        const retryRes = await fetch(`${BASE_PATH}/api/preferences`, {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify({ preferences })
        });
        return retryRes.json();
      }
    }
    return res.json();
  },

  async exportData() {
    const res = await fetch(`${BASE_PATH}/api/export`);
    return res.json();
  },

  async importData(data) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    // Handle CSRF token expiration
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'Content-Type': 'application/json' };
        if (state.csrfToken) {
          retryHeaders['X-CSRF-Token'] = state.csrfToken;
        }
        const retryRes = await fetch(`${BASE_PATH}/api/import`, {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify(data)
        });
        return retryRes.json();
      }
    }
    return res.json();
  },

  async getPageTitle(url) {
    const res = await fetch(`${BASE_PATH}/api/page-title?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      return res.json();
    }
    return null;
  },

  async getCsrfToken() {
    const res = await fetch(`${BASE_PATH}/api/csrf`, {
      credentials: 'include'
    });
    if (res.ok) {
      return res.json();
    }
    return null;
  },

  async getTags() {
    const res = await fetch(`${BASE_PATH}/api/tags`);
    if (res.status === 401) {
      showLoginScreen();
      return { tags: [] };
    }
    return res.json();
  },

  async createTag(name, color) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, color })
    });
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken };
        const retryRes = await fetch(`${BASE_PATH}/api/tags`, {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify({ name, color })
        });
        return retryRes.json();
      }
    }
    return res.json();
  },

  async updateTag(id, name, color) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/tags/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name, color })
    });
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken };
        const retryRes = await fetch(`${BASE_PATH}/api/tags/${id}`, {
          method: 'PUT',
          headers: retryHeaders,
          body: JSON.stringify({ name, color })
        });
        return retryRes.json();
      }
    }
    return res.json();
  },

  async deleteTag(id) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/tags/${id}`, {
      method: 'DELETE',
      headers
    });
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken };
        const retryRes = await fetch(`${BASE_PATH}/api/tags/${id}`, {
          method: 'DELETE',
          headers: retryHeaders
        });
        return retryRes.json();
      }
    }
    return res.json();
  },

  async bulkTag(linkIds, operation, tagIds) {
    const headers = { 'Content-Type': 'application/json' };
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/links/bulk-tag`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ linkIds, operation, tagIds })
    });
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken };
        const retryRes = await fetch(`${BASE_PATH}/api/links/bulk-tag`, {
          method: 'POST',
          headers: retryHeaders,
          body: JSON.stringify({ linkIds, operation, tagIds })
        });
        return retryRes.json();
      }
    }
    return res.json();
  },

  async getCustomIcons() {
    const res = await fetch(`${BASE_PATH}/api/icons`);
    if (res.status === 401) {
      return { icons: [] };
    }
    return res.json();
  },

  async uploadCustomIcon(file) {
    const formData = new FormData();
    formData.append('icon', file);

    const headers = {};
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }

    const res = await fetch(`${BASE_PATH}/api/icons`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'X-CSRF-Token': state.csrfToken };
        const retryRes = await fetch(`${BASE_PATH}/api/icons`, {
          method: 'POST',
          headers: retryHeaders,
          body: formData
        });
        return retryRes.json();
      }
    }
    return res.json();
  },

  async deleteCustomIcon(iconId) {
    const headers = {};
    if (state.csrfToken) {
      headers['X-CSRF-Token'] = state.csrfToken;
    }
    const res = await fetch(`${BASE_PATH}/api/icons/${iconId}`, {
      method: 'DELETE',
      headers
    });
    if (res.status === 403) {
      const error = await res.clone().json().catch(() => ({}));
      if (error.code === 'CSRF_INVALID') {
        await fetchCsrfToken();
        const retryHeaders = { 'X-CSRF-Token': state.csrfToken };
        const retryRes = await fetch(`${BASE_PATH}/api/icons/${iconId}`, {
          method: 'DELETE',
          headers: retryHeaders
        });
        return retryRes.json();
      }
    }
    return res.json();
  }
};

// Fetch CSRF token (on app init if logged in, or after login)
async function fetchCsrfToken() {
  const result = await api.getCsrfToken();
  if (result && result.csrfToken) {
    state.csrfToken = result.csrfToken;
  }
}

// Helper function to make authenticated API requests with CSRF token
async function apiRequest(url, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  // Add CSRF token for mutating requests
  if (options.method && options.method !== 'GET') {
    if (state.csrfToken) {
      defaultHeaders['X-CSRF-Token'] = state.csrfToken;
    }
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    credentials: 'include'
  });

  // Handle CSRF token expiration/invalidity
  if (res.status === 403) {
    const error = await res.clone().json().catch(() => ({}));
    if (error.code === 'CSRF_INVALID') {
      // Fetch new CSRF token and retry once
      await fetchCsrfToken();
      if (state.csrfToken) {
        const retryHeaders = {
          ...defaultHeaders,
          ...options.headers,
          'X-CSRF-Token': state.csrfToken
        };
        return fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include'
        });
      }
    }
  }

  return res;
}

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
        // Store CSRF token from login response
        if (loginResult.csrfToken) {
          state.csrfToken = loginResult.csrfToken;
        }
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
      // Store CSRF token from login response
      if (result.csrfToken) {
        state.csrfToken = result.csrfToken;
      }
      showDashboard();
    } else {
      const errorEl = document.getElementById('login-error');
      // Handle rate limiting
      if (result.code === 'RATE_LIMITED') {
        const minutes = Math.ceil(result.retryAfter / 60000);
        errorEl.textContent = `Too many failed attempts. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`;
      } else {
        errorEl.textContent = result.error || 'Login failed';
      }
      errorEl.classList.remove('hidden');
    }
  };
}

// Dashboard
async function showDashboard() {
  // Fetch CSRF token if not already present (for page reloads)
  if (!state.csrfToken) {
    await fetchCsrfToken();
  }

  // Load preferences first and apply theme before showing the app
  await loadPreferences();
  applyTheme();

  // Now show the dashboard with the correct theme already applied
  document.getElementById('setup-screen').classList.add('hidden');
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  await loadLinks();
  await loadTags();
  setupEventListeners();
  renderLinks();
  updateTagFilter();

  // Hide loading overlay after everything is ready
  hideLoadingOverlay();
}

async function loadLinks() {
  const result = await api.getLinks();
  state.links = result.links || [];

  // Fetch favicons in the background without blocking render
  fetchMissingFavicons();
}

async function loadTags() {
  const result = await api.getTags();
  state.tags = result.tags || [];
}

// Fetch favicons for links that don't have them yet (truly async background operation)
async function fetchMissingFavicons() {
  const linksNeedingFavicons = state.links.filter(link => !link.faviconUrl);

  if (linksNeedingFavicons.length === 0) {
    return;
  }

  showToast('Fetching favicons...', 'info', 2000);
  let needsSave = false;
  const faviconUpdates = [];

  // Fetch favicons in parallel
  const fetchPromises = linksNeedingFavicons.map(async (link) => {
    const faviconUrl = await fetchFavicon(link.url);
    if (faviconUrl) {
      link.faviconUrl = faviconUrl;
      needsSave = true;
      // Collect updates for batching instead of immediate render
      faviconUpdates.push({ linkId: link.id, faviconUrl });
    }
  });

  // Wait for all favicon fetches to complete
  await Promise.all(fetchPromises);

  // Batch update all favicons at once to reduce layout thrashing
  if (faviconUpdates.length > 0) {
    batchFaviconUpdates(faviconUpdates);
  }

  // Save updated links if we fetched any new favicons
  if (needsSave) {
    await api.saveLinks(state.links);
    showToast('Favicons updated', 'success');
  }
}

async function loadPreferences() {
  const result = await api.getPreferences();
  if (result.preferences) {
    state.preferences = result.preferences;
  }
}

function setupEventListeners() {
  // Search (debounced to reduce render thrashing on rapid typing)
  document.getElementById('search').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase();
    debouncedRenderLinks();
  });

  // Layout toggle with transition
  document.querySelectorAll('#layout-toggle button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const layout = btn.dataset.layout;
      if (state.preferences.layout === layout) return;
      const container = document.getElementById('links-container');
      container.classList.add('layout-transitioning');
      state.preferences.layout = layout;
      await api.savePreferences(state.preferences);
      setTimeout(() => {
        renderLinks();
        updateLayoutToggle();
        // Force reflow then fade in
        container.offsetHeight;
        container.classList.remove('layout-transitioning');
      }, 150);
    });
  });

  // Add link button
  document.getElementById('add-link-btn').addEventListener('click', () => {
    state.editingLink = null;
    showLinkModal();
  });

  // Empty state CTA button
  const emptyStateBtn = document.getElementById('empty-state-add-btn');
  if (emptyStateBtn) {
    emptyStateBtn.addEventListener('click', () => {
      state.editingLink = null;
      showLinkModal();
    });
  }

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', showSettingsModal);

  // Link modal
  document.getElementById('link-cancel-btn').addEventListener('click', hideLinkModal);
  document.getElementById('link-form').addEventListener('submit', handleSaveLink);
  document.getElementById('link-url').addEventListener('blur', handleUrlBlur);

  // Change Icon button
  document.getElementById('change-icon-btn').addEventListener('click', () => {
    const urlInput = document.getElementById('link-url');
    const url = urlInput.value.trim();
    showIconPickerModal(url, (iconType, iconValue) => {
      document.getElementById('link-icon-type').value = iconType;
      document.getElementById('link-icon-value').value = iconValue || '';
      updateLinkIconPreview(iconType, iconValue, url);
    });
  });

  // Settings modal
  document.getElementById('settings-cancel-btn').addEventListener('click', cancelSettingsModal);
  document.getElementById('settings-save-btn').addEventListener('click', hideSettingsModal);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('reset-credentials-btn').addEventListener('click', handleResetCredentials);
  document.getElementById('export-btn').addEventListener('click', handleExport);
  document.getElementById('import-file').addEventListener('change', handleImport);
  document.getElementById('manage-tags-btn').addEventListener('click', showTagModal);

  // Tag modal
  document.getElementById('tag-modal-close-btn').addEventListener('click', hideTagModal);
  document.getElementById('add-tag-form').addEventListener('submit', handleAddTag);
  document.getElementById('edit-tag-form').addEventListener('submit', handleEditTagSubmit);

  // Tag filter
  document.getElementById('tag-filter').addEventListener('change', (e) => {
    setTagFilter(e.target.value);
  });

  // Accent color input (live preview)
  document.getElementById('accentColor').addEventListener('input', (e) => {
    state.preferences.accentColor = e.target.value;
    document.documentElement.style.setProperty('--sl-accent', e.target.value);
    const accentTextColor = isLightColor(e.target.value) ? '#0f172a' : '#ffffff';
    document.documentElement.style.setProperty('--sl-accent-text', accentTextColor);
    savePreferencesDebounced();
  });

  // Background color input (live preview)
  document.getElementById('backgroundColor').addEventListener('input', (e) => {
    state.preferences.backgroundColor = e.target.value;
    document.documentElement.style.setProperty('--sl-bg', e.target.value);
    savePreferencesDebounced();
  });

  // Advanced styling toggle
  document.getElementById('toggle-advanced-btn').addEventListener('click', () => {
    const advancedSection = document.getElementById('advanced-styling');
    const chevron = document.getElementById('advanced-chevron');
    advancedSection.classList.toggle('hidden');
    chevron.style.transform = advancedSection.classList.contains('hidden') ? '' : 'rotate(90deg)';
  });

  // Custom CSS inputs (live preview)
  document.getElementById('customBorderRadius').addEventListener('input', (e) => {
    if (!state.preferences.customCss) state.preferences.customCss = {};
    state.preferences.customCss.borderRadius = e.target.value;
    document.documentElement.style.setProperty('--sl-radius', e.target.value);
    savePreferencesDebounced();
  });

  document.getElementById('customFontFamily').addEventListener('input', (e) => {
    if (!state.preferences.customCss) state.preferences.customCss = {};
    state.preferences.customCss.fontFamily = e.target.value;
    document.documentElement.style.setProperty('--sl-font', e.target.value);
    savePreferencesDebounced();
  });

  document.getElementById('customLinkGap').addEventListener('input', (e) => {
    if (!state.preferences.customCss) state.preferences.customCss = {};
    state.preferences.customCss.linkGap = e.target.value;
    document.documentElement.style.setProperty('--sl-gap', e.target.value);
    renderLinks();
    savePreferencesDebounced();
  });

  // Reset custom CSS to defaults
  document.getElementById('reset-custom-css-btn').addEventListener('click', () => {
    const defaults = {
      borderRadius: '0.625rem',
      fontFamily: 'system-ui',
      linkGap: '1rem'
    };
    state.preferences.customCss = { ...defaults };
    updateCustomCssInputs();
    applyCustomCss(state.preferences.customCss);
    renderLinks();
    savePreferencesDebounced();
  });

  // Page title input
  document.getElementById('page-title').addEventListener('input', (e) => {
    const newTitle = e.target.value.trim() || 'Simple Linkz';
    state.preferences.pageTitle = newTitle;
    updatePageTitle();
  });

  // App title click to reload
  document.getElementById('app-title').addEventListener('click', () => {
    window.location.reload();
  });

  // Global keyboard shortcuts
  document.addEventListener('keydown', handleGlobalKeydown);

  // Icon picker event listeners
  setupIconPickerEventListeners();
}

// Handle global keyboard shortcuts
function handleGlobalKeydown(event) {
  // Check if any modal is open
  const linkModalOpen = !document.getElementById('link-modal').classList.contains('hidden');
  const settingsModalOpen = !document.getElementById('settings-modal').classList.contains('hidden');
  const isModalOpen = linkModalOpen || settingsModalOpen;

  // Check if user is in an input or textarea
  const activeTag = document.activeElement.tagName.toLowerCase();
  const isInInput = activeTag === 'input' || activeTag === 'textarea';

  // Handle '/' key to focus search
  if (event.key === '/' && !isModalOpen && !isInInput) {
    event.preventDefault();
    document.getElementById('search').focus();
  }
}

// Rendering
function renderLinks() {
  const container = document.getElementById('links-container');
  const emptyState = document.getElementById('empty-state');

  let filteredLinks = state.links;

  // Apply tag filter first
  if (state.activeTagFilter) {
    filteredLinks = filteredLinks.filter(link =>
      link.tags && link.tags.includes(state.activeTagFilter)
    );
  }

  // Then apply search filter
  if (state.searchQuery) {
    filteredLinks = filteredLinks.filter(link =>
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

// Debounced version for search input
const debouncedRenderLinks = debounce(renderLinks, 100);

function renderGrid(container, links) {
  container.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';
  container.style.gap = 'var(--sl-gap)';
  container.innerHTML = links.map(link => `
    <div class="link-card bg-white dark:bg-gray-800 rounded-lg p-4 shadow cursor-pointer group relative border-2 border-transparent"
         draggable="true"
         data-link-id="${link.id}"
         onclick="window.open('${escapeHtml(link.url)}', '_blank')">
      <div class="flex flex-col items-center justify-center">
        <div class="text-3xl mb-2 flex items-center justify-center">${getLinkIcon(link)}</div>
        <div class="text-sm font-medium text-gray-900 dark:text-white truncate w-full text-center">${escapeHtml(link.name)}</div>
      </div>
      <div class="flex sm:hidden sm:group-hover:flex absolute top-2 right-2 gap-1">
        <button onclick="event.stopPropagation(); editLink('${link.id}')"
                class="p-1 bg-blue-600 text-white rounded text-xs" aria-label="Edit link">✎</button>
        <button onclick="event.stopPropagation(); deleteLink('${link.id}')"
                class="p-1 bg-red-600 text-white rounded text-xs" aria-label="Delete link">✕</button>
      </div>
    </div>
  `).join('');

  setupDragAndDrop();
}

function renderList(container, links) {
  container.className = 'flex flex-col';
  container.style.gap = 'var(--sl-gap)';
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
      <div class="flex sm:hidden sm:group-hover:flex gap-2">
        <button onclick="event.stopPropagation(); editLink('${link.id}')"
                class="px-3 py-1 bg-blue-600 text-white rounded text-sm" aria-label="Edit link">Edit</button>
        <button onclick="event.stopPropagation(); deleteLink('${link.id}')"
                class="px-3 py-1 bg-red-600 text-white rounded text-sm" aria-label="Delete link">Delete</button>
      </div>
    </div>
  `).join('');

  setupDragAndDrop();
}

function renderCards(container, links) {
  container.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  container.style.gap = 'var(--sl-gap)';
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
      <div class="flex sm:hidden sm:group-hover:flex absolute top-4 right-4 gap-2">
        <button onclick="event.stopPropagation(); editLink('${link.id}')"
                class="px-3 py-1 bg-blue-600 text-white rounded text-sm" aria-label="Edit link">Edit</button>
        <button onclick="event.stopPropagation(); deleteLink('${link.id}')"
                class="px-3 py-1 bg-red-600 text-white rounded text-sm" aria-label="Delete link">Delete</button>
      </div>
    </div>
  `).join('');

  setupDragAndDrop();
}

function getLinkIcon(link) {
  // Use custom fallback emoji if provided, otherwise default to link icon
  const fallbackIcon = link.fallbackEmoji || '🔗';
  const iconType = link.iconType || 'favicon';
  const iconValue = link.iconValue;

  // Handle different icon types
  if (iconType === 'material' && iconValue) {
    return `<span class="material-icons link-icon">${escapeHtml(iconValue)}</span>`;
  }

  if (iconType === 'fontawesome' && iconValue) {
    // iconValue format: "solid:icon-name" or "brands:icon-name"
    const parts = iconValue.split(':');
    const fontClass = parts[0] === 'brands' ? 'fa-brands' : 'fa-solid';
    // Find the icon in registry to get unicode
    const pack = parts[0] === 'brands' ? 'fontawesome-brands' : 'fontawesome-solid';
    const icons = getAllIconsFromPack(pack);
    const icon = icons.find(i => i.id === parts[1]);
    if (icon) {
      return `<span class="${fontClass} link-icon" style="font-size: inherit;">${icon.unicode}</span>`;
    }
    return fallbackIcon;
  }

  if (iconType === 'custom' && iconValue) {
    return `<img src="${BASE_PATH}/icons/${escapeHtml(iconValue)}" alt="" class="favicon-img w-8 h-8 object-contain"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span style="display:none;">${fallbackIcon}</span>`;
  }

  // Default: favicon type
  // If there's a cached favicon URL, try to use it with emoji fallback
  if (link.faviconUrl) {
    // Check if image is too small (1x1 pixel favicons) and fall back to emoji
    return `<img src="${escapeHtml(link.faviconUrl)}" alt="" class="favicon-img w-8 h-8"
                 onload="if(this.naturalWidth < 8 || this.naturalHeight < 8) { this.style.display='none'; this.nextElementSibling.style.display='block'; }"
                 onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <span style="display:none;">${fallbackIcon}</span>`;
  }

  // No favicon, use custom emoji or default icon
  return fallbackIcon;
}

// Batch favicon DOM updates using requestAnimationFrame to reduce layout thrashing
function batchFaviconUpdates(faviconUpdates) {
  // faviconUpdates: Array of {linkId, faviconUrl}
  requestAnimationFrame(() => {
    faviconUpdates.forEach(({ linkId, faviconUrl }) => {
      const img = document.querySelector(`[data-link-id="${linkId}"] .favicon-img`);
      if (img) img.src = faviconUrl;
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateLayoutToggle() {
  document.querySelectorAll('#layout-toggle button').forEach(btn => {
    if (btn.dataset.layout === state.preferences.layout) {
      btn.classList.add('layout-btn-active');
      btn.classList.remove('layout-btn-inactive');
    } else {
      btn.classList.remove('layout-btn-active');
      btn.classList.add('layout-btn-inactive');
    }
  });
}

function updateBackgroundColorInput() {
  const bgInput = document.getElementById('backgroundColor');
  if (bgInput) {
    // Handle legacy color names by converting to hex
    let bgColor = state.preferences.backgroundColor || '#0a0a0a';
    if (BACKGROUND_COLORS[bgColor]) {
      bgColor = BACKGROUND_COLORS[bgColor];
    }
    bgInput.value = bgColor;
  }
}


// Debounced save preferences to avoid too many API calls
const savePreferencesDebounced = debounce(async () => {
  await api.savePreferences(state.preferences);
}, 500);

function updatePageTitle() {
  document.getElementById('app-title').textContent = state.preferences.pageTitle;
  document.title = state.preferences.pageTitle;
}

// Theme Engine
function applyCustomCss(customCss) {
  if (!customCss) return;

  const propertyMap = {
    borderRadius: '--sl-radius',
    fontFamily: '--sl-font',
    linkGap: '--sl-gap'
  };

  Object.entries(customCss).forEach(([key, value]) => {
    if (propertyMap[key] && value) {
      document.documentElement.style.setProperty(propertyMap[key], value);
    }
  });
}

function applyTheme() {
  // Apply custom CSS properties
  applyCustomCss(state.preferences.customCss);

  // Get theme preset
  const presetName = state.preferences.themePreset || 'midnight';
  const preset = THEME_PRESETS[presetName] || THEME_PRESETS.midnight;

  // Apply theme preset colors
  document.documentElement.style.setProperty('--sl-surface', preset.surface);
  document.documentElement.style.setProperty('--sl-surface-hover', preset.surfaceHover);
  document.documentElement.style.setProperty('--sl-text', preset.text);
  document.documentElement.style.setProperty('--sl-text-muted', preset.textMuted);
  document.documentElement.style.setProperty('--sl-border', preset.border);

  // Apply accent color
  const accentColor = state.preferences.accentColor || '#3b82f6';
  document.documentElement.style.setProperty('--sl-accent', accentColor);
  // Determine if accent needs light or dark text
  const accentTextColor = isLightColor(accentColor) ? '#0f172a' : '#ffffff';
  document.documentElement.style.setProperty('--sl-accent-text', accentTextColor);

  // Apply page background color (handle both legacy names and hex values)
  let bgHex = state.preferences.backgroundColor || '#0a0a0a';
  // Convert legacy color names to hex if needed
  if (BACKGROUND_COLORS[bgHex]) {
    bgHex = BACKGROUND_COLORS[bgHex];
    state.preferences.backgroundColor = bgHex; // Migrate to hex
  }
  document.documentElement.style.setProperty('--sl-bg', bgHex);

  updateThemePresetUI();
  updateBackgroundColorInput();
  updateAccentColorInput();
  updatePageTitle();
}

// Check if a color is light (for determining text contrast)
function isLightColor(hexColor) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

function updateAccentColorInput() {
  const accentInput = document.getElementById('accentColor');
  if (accentInput) {
    accentInput.value = state.preferences.accentColor || '#3b82f6';
  }
}

function updateThemePresetUI() {
  const container = document.getElementById('theme-presets');
  if (!container) return;

  // Render theme preset cards
  container.innerHTML = Object.entries(THEME_PRESETS).map(([id, preset]) => {
    const isActive = state.preferences.themePreset === id;
    return `
      <button type="button" data-theme="${id}" class="theme-preset ${isActive ? 'active' : ''}">
        <div class="theme-preset-preview">
          <span style="background: ${preset.surface}"></span>
          <span style="background: ${preset.surfaceHover}"></span>
          <span style="background: ${preset.text}"></span>
        </div>
        <div class="theme-preset-name">${preset.name}</div>
      </button>
    `;
  }).join('');

  // Add click handlers
  container.querySelectorAll('.theme-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      const themeId = btn.dataset.theme;
      state.preferences.themePreset = themeId;
      applyTheme();
      savePreferencesDebounced();
    });
  });
}

function updateCustomCssInputs() {
  const customCss = state.preferences.customCss || {};
  const borderRadiusInput = document.getElementById('customBorderRadius');
  const fontFamilyInput = document.getElementById('customFontFamily');
  const linkGapInput = document.getElementById('customLinkGap');

  if (borderRadiusInput) borderRadiusInput.value = customCss.borderRadius || '0.625rem';
  if (fontFamilyInput) fontFamilyInput.value = customCss.fontFamily || 'system-ui';
  if (linkGapInput) linkGapInput.value = customCss.linkGap || '1rem';
}

// Link Modal
function showLinkModal() {
  const modal = document.getElementById('link-modal');
  const title = document.getElementById('link-modal-title');
  const nameInput = document.getElementById('link-name');
  const urlInput = document.getElementById('link-url');
  const emojiInput = document.getElementById('link-emoji');
  const errorEl = document.getElementById('link-error');
  const iconTypeInput = document.getElementById('link-icon-type');
  const iconValueInput = document.getElementById('link-icon-value');

  errorEl.classList.add('hidden');

  if (state.editingLink) {
    title.textContent = 'Edit Link';
    nameInput.value = state.editingLink.name;
    urlInput.value = state.editingLink.url;
    emojiInput.value = state.editingLink.fallbackEmoji || '';
    renderLinkTagsCheckboxes(state.editingLink.tags || []);

    // Set icon type and value
    iconTypeInput.value = state.editingLink.iconType || 'favicon';
    iconValueInput.value = state.editingLink.iconValue || '';
    updateLinkIconPreview(state.editingLink.iconType || 'favicon', state.editingLink.iconValue, state.editingLink.url);
  } else {
    title.textContent = 'Add Link';
    nameInput.value = '';
    urlInput.value = '';
    emojiInput.value = '';
    renderLinkTagsCheckboxes([]);

    // Reset icon to favicon
    iconTypeInput.value = 'favicon';
    iconValueInput.value = '';
    updateLinkIconPreview('favicon', null, '');
  }

  openModal(modal);
  urlInput.focus();
}

/**
 * Update the icon preview in the link modal
 */
function updateLinkIconPreview(iconType, iconValue, linkUrl) {
  const previewContainer = document.getElementById('link-icon-preview');

  if (iconType === 'favicon') {
    if (linkUrl) {
      previewContainer.innerHTML = `<img src="${BASE_PATH}/api/favicon?url=${encodeURIComponent(linkUrl)}" alt="Favicon" class="w-8 h-8" onerror="this.parentElement.innerHTML='<span class=\\'text-2xl\\'>🌐</span>'">`;
    } else {
      previewContainer.innerHTML = '<span class="text-muted text-sm">Favicon</span>';
    }
  } else if (iconType === 'material') {
    previewContainer.innerHTML = `<span class="material-icons text-2xl link-icon">${iconValue || 'link'}</span>`;
  } else if (iconType === 'fontawesome') {
    // iconValue format: "solid:icon-name" or "brands:icon-name"
    const parts = (iconValue || 'solid:link').split(':');
    const fontClass = parts[0] === 'brands' ? 'fa-brands' : 'fa-solid';
    // Find the icon in registry to get unicode
    const pack = parts[0] === 'brands' ? 'fontawesome-brands' : 'fontawesome-solid';
    const icons = getAllIconsFromPack(pack);
    const icon = icons.find(i => i.id === parts[1]);
    if (icon) {
      previewContainer.innerHTML = `<span class="${fontClass} text-2xl link-icon">${icon.unicode}</span>`;
    } else {
      previewContainer.innerHTML = `<span class="text-muted text-sm">FA Icon</span>`;
    }
  } else if (iconType === 'custom') {
    if (iconValue) {
      previewContainer.innerHTML = `<img src="${BASE_PATH}/icons/${iconValue}" alt="Custom icon" class="w-8 h-8 object-contain" onerror="this.parentElement.innerHTML='<span class=\\'text-2xl\\'>📷</span>'">`;
    } else {
      previewContainer.innerHTML = '<span class="text-muted text-sm">Custom</span>';
    }
  } else {
    previewContainer.innerHTML = '<span class="text-muted text-sm">None</span>';
  }
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
  closeModal(document.getElementById('link-modal'), () => {
    state.editingLink = null;
  });
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
  const selectedTags = getSelectedLinkTags();
  const iconType = document.getElementById('link-icon-type').value || 'favicon';
  const iconValue = document.getElementById('link-icon-value').value || null;
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
      linkToSave = { ...state.links[index], name, url, fallbackEmoji, tags: selectedTags, iconType, iconValue };

      // If URL changed and using favicon, refresh the favicon URL
      if (state.links[index].url !== url && iconType === 'favicon') {
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
      tags: selectedTags,
      order: state.links.length,
      iconType,
      iconValue,
      faviconUrl: iconType === 'favicon' ? await fetchFavicon(url) : null
    };
    state.links.push(newLink);
  }

  const saveBtn = document.querySelector('#link-form button[type="submit"]');
  setButtonLoading(saveBtn, true);

  const result = await api.saveLinks(state.links);
  setButtonLoading(saveBtn, false);
  if (result.success) {
    const wasEditing = !!state.editingLink;
    hideLinkModal();
    renderLinks();
    showToast(wasEditing ? 'Link saved' : 'Link created', 'success');
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
  const confirmed = await showConfirmModal(
    'Delete Link',
    'Are you sure you want to delete this link?'
  );
  if (!confirmed) return;

  state.links = state.links.filter(l => l.id !== id);

  // Reorder remaining links
  state.links.forEach((link, index) => {
    link.order = index;
  });

  await api.saveLinks(state.links);
  renderLinks();
  showToast('Link deleted', 'success');
};

// Store original preferences for cancel/revert
let originalPreferences = null;

// Settings Modal
function showSettingsModal() {
  // Store original preferences for reverting on cancel
  originalPreferences = JSON.parse(JSON.stringify(state.preferences));

  openModal(document.getElementById('settings-modal'));
  document.getElementById('page-title').value = state.preferences.pageTitle || 'Simple Linkz';

  // Initialize theme presets UI
  updateThemePresetUI();

  // Initialize accent color
  updateAccentColorInput();

  // Initialize background buttons
  updateBackgroundButtons();

  // Initialize custom CSS inputs
  updateCustomCssInputs();
}

async function hideSettingsModal() {
  const saveBtn = document.getElementById('settings-save-btn');
  setButtonLoading(saveBtn, true);
  await api.savePreferences(state.preferences);
  setButtonLoading(saveBtn, false);
  originalPreferences = null;
  closeModal(document.getElementById('settings-modal'));
  showToast('Settings saved', 'success');
}

function cancelSettingsModal() {
  // Revert to original preferences
  if (originalPreferences) {
    state.preferences = JSON.parse(JSON.stringify(originalPreferences));
    originalPreferences = null;
  }
  applyTheme();
  closeModal(document.getElementById('settings-modal'));
}

async function handleLogout() {
  closeModal(document.getElementById('settings-modal'));
  await api.logout();
  state.csrfToken = null;
  showLoginScreen();
}

async function handleResetCredentials() {
  const confirmed = await showConfirmModal(
    'Reset Credentials',
    'Are you sure you want to reset your credentials? This will log you out and require you to create a new username and password.'
  );
  if (!confirmed) return;

  hideSettingsModal();
  const headers = { 'Content-Type': 'application/json' };
  if (state.csrfToken) {
    headers['X-CSRF-Token'] = state.csrfToken;
  }
  const res = await fetch(`${BASE_PATH}/api/reset-credentials`, { method: 'POST', headers });
  if (res.ok) {
    state.csrfToken = null; // Clear CSRF token on reset
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
  showToast('Export downloaded', 'success');
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
        await loadTags();
        await loadPreferences();
        applyTheme();
        renderLinks();
        updateTagFilter();
        hideSettingsModal();
        const count = state.links.length;
        showToast(`${count} links imported`, 'success');
      } else {
        showToast('Import failed: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      showToast('Invalid import file', 'error');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Reset file input
}

// Tag Management Modal
function showTagModal() {
  openModal(document.getElementById('tag-modal'));
  renderTagList();
  document.getElementById('new-tag-name').value = '';
  document.getElementById('new-tag-color').value = '#3B82F6';
  document.getElementById('tag-error').classList.add('hidden');
}

function hideTagModal() {
  closeModal(document.getElementById('tag-modal'));
  // Refresh the tag filter dropdown
  updateTagFilter();
}
// Make hideTagModal global for onclick in HTML
window.hideTagModal = hideTagModal;

function renderTagList() {
  const container = document.getElementById('tag-list');

  if (state.tags.length === 0) {
    container.innerHTML = '<p class="text-muted text-sm italic">No tags created yet.</p>';
    return;
  }

  container.innerHTML = state.tags.map(tag => `
    <div class="flex items-center gap-2 p-2 surface-hover-bg rounded-lg" data-tag-id="${tag.id}">
      <span class="w-4 h-4 rounded-full flex-shrink-0" style="background-color: ${escapeHtml(tag.color)}"></span>
      <span class="flex-1 text-sm font-medium">${escapeHtml(tag.name)}</span>
      <button onclick="editTag('${tag.id}')" class="px-2 py-1 text-xs accent-bg rounded transition-colors">Edit</button>
      <button onclick="deleteTag('${tag.id}')" class="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors">Delete</button>
    </div>
  `).join('');
}

async function handleAddTag(e) {
  e.preventDefault();

  const name = document.getElementById('new-tag-name').value.trim();
  const color = document.getElementById('new-tag-color').value;
  const errorEl = document.getElementById('tag-error');

  if (!name) {
    errorEl.textContent = 'Tag name is required';
    errorEl.classList.remove('hidden');
    return;
  }

  const result = await api.createTag(name, color);
  if (result.tag) {
    state.tags.push(result.tag);
    state.tags.sort((a, b) => a.name.localeCompare(b.name));
    renderTagList();
    document.getElementById('new-tag-name').value = '';
    document.getElementById('new-tag-color').value = '#3B82F6';
    errorEl.classList.add('hidden');
    updateTagFilter();
    showToast('Tag created', 'success');
  } else {
    errorEl.textContent = result.error || 'Failed to create tag';
    errorEl.classList.remove('hidden');
  }
}

// Edit Tag Modal functions
function showEditTagModal(id) {
  const tag = state.tags.find(t => t.id === id);
  if (!tag) return;

  document.getElementById('edit-tag-id').value = id;
  document.getElementById('edit-tag-name').value = tag.name;
  document.getElementById('edit-tag-color').value = tag.color;
  document.getElementById('edit-tag-error').classList.add('hidden');
  openModal(document.getElementById('edit-tag-modal'));
  document.getElementById('edit-tag-name').focus();
}

function hideEditTagModal() {
  closeModal(document.getElementById('edit-tag-modal'));
}
window.hideEditTagModal = hideEditTagModal;

async function handleEditTagSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('edit-tag-id').value;
  const newName = document.getElementById('edit-tag-name').value.trim();
  const newColor = document.getElementById('edit-tag-color').value;
  const errorEl = document.getElementById('edit-tag-error');

  if (!newName) {
    errorEl.textContent = 'Tag name is required';
    errorEl.classList.remove('hidden');
    return;
  }

  const result = await api.updateTag(id, newName, newColor);
  if (result.tag) {
    const index = state.tags.findIndex(t => t.id === id);
    if (index !== -1) {
      state.tags[index] = result.tag;
      state.tags.sort((a, b) => a.name.localeCompare(b.name));
    }
    hideEditTagModal();
    renderTagList();
    updateTagFilter();
  } else {
    errorEl.textContent = result.error || 'Failed to update tag';
    errorEl.classList.remove('hidden');
  }
}

window.editTag = function(id) {
  showEditTagModal(id);
};

// Custom Confirm Dialog
function showConfirmModal(title, message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;
    openModal(modal);

    const confirmBtn = document.getElementById('confirm-modal-confirm');
    const cancelBtn = document.getElementById('confirm-modal-cancel');

    const cleanup = () => {
      closeModal(modal);
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
  });
}

window.deleteTag = async function(id) {
  const confirmed = await showConfirmModal(
    'Delete Tag',
    'Are you sure you want to delete this tag? It will be removed from all links.'
  );
  if (!confirmed) return;

  const result = await api.deleteTag(id);
  if (result.success) {
    state.tags = state.tags.filter(t => t.id !== id);
    // Remove tag from all links in local state
    state.links.forEach(link => {
      if (link.tags) {
        link.tags = link.tags.filter(t => t !== id);
      }
    });
    // If currently filtering by this tag, clear filter
    if (state.activeTagFilter === id) {
      state.activeTagFilter = null;
    }
    renderTagList();
    renderLinks();
    updateTagFilter();
  }
};

// Tag Filter
function updateTagFilter() {
  const select = document.getElementById('tag-filter');
  const currentValue = select.value;

  select.innerHTML = '<option value="">All Links</option>';
  state.tags.forEach(tag => {
    const option = document.createElement('option');
    option.value = tag.id;
    option.textContent = tag.name;
    option.style.color = tag.color;
    select.appendChild(option);
  });

  // Restore previous selection if still valid
  if (currentValue && state.tags.some(t => t.id === currentValue)) {
    select.value = currentValue;
  } else {
    select.value = '';
    state.activeTagFilter = null;
  }
}

function setTagFilter(tagId) {
  state.activeTagFilter = tagId || null;
  renderLinks();
}

// Tag Selection in Link Modal
function renderLinkTagsCheckboxes(selectedTags = []) {
  const container = document.getElementById('link-tags-container');
  const noTagsMessage = document.getElementById('no-tags-message');

  if (state.tags.length === 0) {
    container.innerHTML = '<span class="text-gray-400 text-sm italic" id="no-tags-message">No tags available. Create tags in Settings.</span>';
    return;
  }

  container.innerHTML = state.tags.map(tag => {
    const isChecked = selectedTags.includes(tag.id);
    return `
      <label class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${isChecked ? 'ring-2 ring-offset-1' : ''}"
             style="background-color: ${tag.color}20; color: ${tag.color}; ${isChecked ? `ring-color: ${tag.color}` : ''}">
        <input type="checkbox" class="link-tag-checkbox sr-only" value="${tag.id}" ${isChecked ? 'checked' : ''}>
        <span class="w-2 h-2 rounded-full" style="background-color: ${tag.color}"></span>
        <span>${escapeHtml(tag.name)}</span>
        ${isChecked ? '<span class="tag-checkmark">✓</span>' : ''}
      </label>
    `;
  }).join('');

  // Add change handlers to toggle appearance (use change event on checkbox, not click on label)
  container.querySelectorAll('.link-tag-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const label = this.closest('label');
      if (!label) return;

      if (this.checked) {
        label.classList.add('ring-2', 'ring-offset-1');
        // Add checkmark if not present
        if (!label.querySelector('.tag-checkmark')) {
          const checkmark = document.createElement('span');
          checkmark.className = 'tag-checkmark';
          checkmark.textContent = '✓';
          label.appendChild(checkmark);
        }
      } else {
        label.classList.remove('ring-2', 'ring-offset-1');
        // Remove checkmark
        const checkmark = label.querySelector('.tag-checkmark');
        if (checkmark) {
          checkmark.remove();
        }
      }
    });
  });
}

function getSelectedLinkTags() {
  const checkboxes = document.querySelectorAll('.link-tag-checkbox:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

// Icon Picker Modal State
let iconPickerState = {
  currentTab: 'favicon',
  faSubtab: 'solid',
  searchQuery: '',
  customIcons: [],
  onSelect: null,  // Callback when icon is selected
  currentLinkUrl: null  // For favicon preview
};

async function loadCustomIcons() {
  const result = await api.getCustomIcons();
  if (result && result.icons) {
    iconPickerState.customIcons = result.icons;
  }
}

function showIconPickerModal(currentUrl, onSelectCallback) {
  iconPickerState.currentLinkUrl = currentUrl;
  iconPickerState.onSelect = onSelectCallback;
  iconPickerState.currentTab = 'favicon';
  iconPickerState.searchQuery = '';

  // Reset UI
  openModal(document.getElementById('icon-picker-modal'));
  document.getElementById('icon-search-input').value = '';

  // Load custom icons
  loadCustomIcons().then(() => {
    renderCustomIconsGrid();
  });

  // Set initial tab
  switchIconTab('favicon');

  // Update favicon preview
  updateFaviconPreview(currentUrl);
}

function hideIconPickerModal() {
  closeModal(document.getElementById('icon-picker-modal'), () => {
    iconPickerState.onSelect = null;
  });
}

window.hideIconPickerModal = hideIconPickerModal;

function updateFaviconPreview(url) {
  const previewContainer = document.getElementById('favicon-preview');
  if (url) {
    previewContainer.innerHTML = `<img src="${BASE_PATH}/api/favicon?url=${encodeURIComponent(url)}" alt="Favicon" class="w-8 h-8" onerror="this.parentElement.innerHTML='<span class=\\'text-xl\\'>🌐</span>'">`;
  } else {
    previewContainer.innerHTML = '<span class="text-gray-400 text-xs">No URL</span>';
  }
}

function switchIconTab(tab) {
  iconPickerState.currentTab = tab;

  // Update tab button styles using CSS classes
  ['favicon', 'material', 'fontawesome', 'custom'].forEach(t => {
    const btn = document.getElementById(`icon-tab-${t}`);
    if (t === tab) {
      btn.classList.add('active');
      btn.classList.remove('btn-secondary');
    } else {
      btn.classList.remove('active');
      btn.classList.add('btn-secondary');
    }
  });

  // Show/hide content
  ['favicon', 'material', 'fontawesome', 'custom'].forEach(t => {
    const content = document.getElementById(`icon-content-${t}`);
    if (t === tab) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });

  // Show/hide search
  const searchContainer = document.getElementById('icon-search-container');
  if (tab === 'material' || tab === 'fontawesome') {
    searchContainer.classList.remove('hidden');
  } else {
    searchContainer.classList.add('hidden');
  }

  // Show/hide FA subtabs
  const faSubtabs = document.getElementById('fontawesome-subtabs');
  if (tab === 'fontawesome') {
    faSubtabs.classList.remove('hidden');
  } else {
    faSubtabs.classList.add('hidden');
  }

  // Render icons for the selected tab
  if (tab === 'material') {
    renderMaterialIconsGrid();
  } else if (tab === 'fontawesome') {
    renderFontAwesomeIconsGrid();
  } else if (tab === 'custom') {
    renderCustomIconsGrid();
  }
}

window.switchIconTab = switchIconTab;

function switchFaSubtab(subtab) {
  iconPickerState.faSubtab = subtab;

  // Update subtab button styles
  ['solid', 'brands'].forEach(t => {
    const btn = document.getElementById(`fa-subtab-${t}`);
    if (t === subtab) {
      btn.classList.add('accent-bg');
      btn.classList.remove('btn-secondary');
    } else {
      btn.classList.remove('accent-bg');
      btn.classList.add('btn-secondary');
    }
  });

  renderFontAwesomeIconsGrid();
}

window.switchFaSubtab = switchFaSubtab;

function renderMaterialIconsGrid() {
  const container = document.getElementById('material-icons-grid');
  const query = iconPickerState.searchQuery.toLowerCase();

  let icons;
  if (query) {
    icons = searchIcons(query, 'material');
  } else {
    icons = getAllIconsFromPack('material');
  }

  container.innerHTML = icons.map(icon => `
    <button type="button" onclick="selectIcon('material', '${icon.id}')"
      class="icon-grid-item w-10 h-10 flex items-center justify-center rounded"
      title="${escapeHtml(icon.name)}">
      <span class="material-icons">${icon.id}</span>
    </button>
  `).join('');

  if (icons.length === 0) {
    container.innerHTML = '<p class="col-span-8 text-center text-gray-500 text-sm py-4">No icons found</p>';
  }
}

function renderFontAwesomeIconsGrid() {
  const container = document.getElementById('fontawesome-icons-grid');
  const query = iconPickerState.searchQuery.toLowerCase();
  const pack = `fontawesome-${iconPickerState.faSubtab}`;

  let icons;
  if (query) {
    icons = searchIcons(query, pack);
  } else {
    icons = getAllIconsFromPack(pack);
  }

  const fontClass = iconPickerState.faSubtab === 'brands' ? 'fa-brands' : 'fa-solid';

  container.innerHTML = icons.map(icon => `
    <button type="button" onclick="selectIcon('fontawesome', '${iconPickerState.faSubtab}:${icon.id}')"
      class="icon-grid-item w-10 h-10 flex items-center justify-center rounded"
      title="${escapeHtml(icon.name)}">
      <span class="${fontClass}" style="font-size: 18px;">${icon.unicode || ''}</span>
    </button>
  `).join('');

  if (icons.length === 0) {
    container.innerHTML = '<p class="col-span-8 text-center text-gray-500 text-sm py-4">No icons found</p>';
  }
}

function renderCustomIconsGrid() {
  const container = document.getElementById('custom-icons-grid');
  const noIconsMsg = document.getElementById('no-custom-icons');

  if (iconPickerState.customIcons.length === 0) {
    container.innerHTML = '';
    noIconsMsg.classList.remove('hidden');
    return;
  }

  noIconsMsg.classList.add('hidden');
  container.innerHTML = iconPickerState.customIcons.map(icon => `
    <div class="relative group">
      <button type="button" onclick="selectIcon('custom', '${icon.filename}')"
        class="custom-icon-item w-12 h-12 flex items-center justify-center rounded border transition-colors overflow-hidden">
        <img src="${BASE_PATH}/icons/${icon.filename}" alt="${escapeHtml(icon.originalName || 'Custom icon')}" class="w-10 h-10 object-contain">
      </button>
      <button type="button" onclick="deleteCustomIcon('${icon.id}')"
        class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        title="Delete icon">×</button>
    </div>
  `).join('');
}

async function deleteCustomIcon(iconId) {
  if (!confirm('Delete this custom icon? Any links using it will revert to favicon.')) {
    return;
  }

  const result = await api.deleteCustomIcon(iconId);
  if (result.success) {
    iconPickerState.customIcons = iconPickerState.customIcons.filter(i => i.id !== iconId);
    renderCustomIconsGrid();
  } else {
    alert(result.error || 'Failed to delete icon');
  }
}

window.deleteCustomIcon = deleteCustomIcon;

function selectIcon(type, value) {
  if (iconPickerState.onSelect) {
    iconPickerState.onSelect(type, value);
  }
  hideIconPickerModal();
}

window.selectIcon = selectIcon;

// Icon search debounced handler
const handleIconSearch = debounce((query) => {
  iconPickerState.searchQuery = query;
  if (iconPickerState.currentTab === 'material') {
    renderMaterialIconsGrid();
  } else if (iconPickerState.currentTab === 'fontawesome') {
    renderFontAwesomeIconsGrid();
  }
}, 200);

// Icon upload handler
async function handleIconUpload(file) {
  if (!file) return;

  if (file.size > 100 * 1024) {
    alert('File size exceeds 100KB limit');
    return;
  }

  const result = await api.uploadCustomIcon(file);
  if (result.icon) {
    iconPickerState.customIcons.push(result.icon);
    renderCustomIconsGrid();
  } else {
    alert(result.error || 'Failed to upload icon');
  }
}

// Favicon select button handler
function setupIconPickerEventListeners() {
  // Icon search input
  const searchInput = document.getElementById('icon-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleIconSearch(e.target.value);
    });
  }

  // Icon upload
  const uploadInput = document.getElementById('icon-upload');
  if (uploadInput) {
    uploadInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleIconUpload(e.target.files[0]);
        e.target.value = ''; // Reset for next upload
      }
    });
  }

  // Favicon select button
  const faviconBtn = document.getElementById('select-favicon-btn');
  if (faviconBtn) {
    faviconBtn.addEventListener('click', () => {
      selectIcon('favicon', null);
    });
  }
}

// Drag and Drop
let draggedElement = null;

function setupDragAndDrop() {
  const linkElements = document.querySelectorAll('[data-link-id]');

  linkElements.forEach(el => {
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragover', handleDragOver);
    el.addEventListener('dragleave', handleDragLeave);
    el.addEventListener('drop', handleDrop);
    el.addEventListener('dragend', handleDragEnd);
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  if (this !== draggedElement && draggedElement) {
    // Clear previous indicators
    document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });
    // Show drop indicator based on cursor position
    const rect = this.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      this.classList.add('drag-over-top');
    } else {
      this.classList.add('drag-over-bottom');
    }
  }
  return false;
}

function handleDragLeave(e) {
  this.classList.remove('drag-over-top', 'drag-over-bottom');
}

function handleDrop(e) {
  e.stopPropagation();

  // Clear all drag indicators
  document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
    el.classList.remove('drag-over-top', 'drag-over-bottom');
  });

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
    showToast('Order saved', 'info');

    // Brief pulse on the dropped card
    setTimeout(() => {
      const droppedCard = document.querySelector(`[data-link-id="${draggedId}"]`);
      if (droppedCard) {
        droppedCard.classList.add('drop-complete');
        droppedCard.addEventListener('animationend', () => droppedCard.classList.remove('drop-complete'), { once: true });
      }
    }, 50);
  }

  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  // Clean up any lingering indicators
  document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
    el.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  draggedElement = null;
}

// Start the app
init();
