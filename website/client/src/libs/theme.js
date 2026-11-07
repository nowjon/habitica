export const THEME_STORAGE_KEY = 'habitica-theme';
export const THEME_CHANGE_EVENT = 'habitica-theme-change';

export function getStoredTheme () {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'dark' || value === 'light') return value;
  } catch (_error) {
    // localStorage can throw in private browsing.
  }
  return null;
}

export function applyTheme (theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
}

export function isDarkTheme () {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

export function persistTheme (theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (_error) {
    // Ignore storage failures; the attribute still updates this page.
  }
  applyTheme(next);
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: next }));
}

export function initTheme () {
  applyTheme(getStoredTheme() || 'light');
}

// Logged-in preference wins. If the account has never chosen, keep the
// browser choice and save it so the next device picks it up.
export function bindThemeToUser (store) {
  let syncedUserId = null;

  store.watch(
    state => {
      if (!state.user || state.user.loadingStatus !== 'LOADED' || !state.user.data) return null;
      const mode = state.user.data.preferences && state.user.data.preferences.darkMode;
      if (mode === 'dark' || mode === 'light') return `${state.user.data._id}:${mode}`;
      return `${state.user.data._id}:unset`;
    },
    value => {
      if (!value) return;
      const splitAt = value.indexOf(':');
      const userId = value.slice(0, splitAt);
      const mode = value.slice(splitAt + 1);

      if (mode === 'dark' || mode === 'light') {
        syncedUserId = userId;
        persistTheme(mode);
        return;
      }

      if (syncedUserId === userId) return;
      const stored = getStoredTheme();
      if (!stored) {
        syncedUserId = userId;
        return;
      }

      syncedUserId = userId;
      store.dispatch('user:set', { 'preferences.darkMode': stored }).catch(() => {
        if (syncedUserId === userId) syncedUserId = null;
      });
    },
  );
}
