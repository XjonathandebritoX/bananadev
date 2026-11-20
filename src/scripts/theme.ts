export type ThemePref = 'light' | 'dark' | 'system';

export const THEME_KEY = 'bananadev.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function systemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

export function readPreference(storage: Pick<Storage, 'getItem'>): ThemePref {
  try {
    const value = storage.getItem(THEME_KEY);
    if (value === 'light' || value === 'dark' || value === 'system') return value;
  } catch {
    /* ignora */
  }
  return 'system';
}

export function resolveTheme(pref: ThemePref): 'light' | 'dark' {
  return pref === 'system' ? systemTheme() : pref;
}

function updateToggle(pref: ThemePref): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-set]')) {
    button.setAttribute('aria-pressed', String(button.dataset.themeSet === pref));
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = resolveTheme(pref) === 'dark' ? '#131109' : '#fbf7ed';
  }
}

export function applyTheme(pref: ThemePref, persist = true): void {
  const theme = resolveTheme(pref);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePref = pref;
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, pref);
    } catch {
      /* ignora */
    }
  }
  updateToggle(pref);
}

/** Inicializa os controles de tema e o listener do sistema. */
export function initTheme(): void {
  const pref = readPreference(localStorage);
  applyTheme(pref, false);

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-set]')) {
    button.addEventListener('click', () => {
      const next = button.dataset.themeSet as ThemePref;
      applyTheme(next);
    });
  }

  if (window.matchMedia) {
    const media = window.matchMedia(DARK_QUERY);
    const handle = () => {
      if (readPreference(localStorage) === 'system') applyTheme('system', false);
    };
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handle);
    } else {
      // Fallback for older browsers: addListener is deprecated but still exists
      (media as MediaQueryList & { addListener?: (callback: (e: MediaQueryListEvent) => void) => void }).addListener?.(handle);
    }
  }
}
