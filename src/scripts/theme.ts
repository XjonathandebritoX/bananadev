export type ThemePref = 'light' | 'dark' | 'system';

export const THEME_KEY = 'bananadev.theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function systemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'light';
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
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
  const theme = resolveTheme(pref);
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-set]')) {
    button.setAttribute('aria-pressed', String(button.dataset.themeSet === pref));
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = theme === 'dark' ? '#131109' : '#fbf7ed';
  }
}

export function applyTheme(pref: ThemePref, persist = true): void {
  const theme = resolveTheme(pref);
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-theme-pref', pref);
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, pref);
    } catch {
      /* ignora */
    }
  }
  updateToggle(pref);
}

let initialized = false;

/** Inicializa os controles de tema e o listener do sistema. */
export function initTheme(): void {
  if (initialized) return;
  initialized = true;

  // Sincroniza o estado atual (o bootstrap inline já aplicou o tema antes da pintura).
  applyTheme(readPreference(localStorage), false);

  // Delegação de eventos: funciona também para botões adicionados depois.
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-theme-set]');
    if (!button) return;
    const next = button.dataset.themeSet;
    if (next === 'light' || next === 'dark' || next === 'system') {
      applyTheme(next);
    }
  });

  // Mantém o modo "system" sincronizado com a preferência do sistema operacional.
  if (typeof window.matchMedia === 'function') {
    const media = window.matchMedia(DARK_QUERY);
    const handle = () => {
      if (readPreference(localStorage) === 'system') {
        applyTheme('system', false);
      }
    };
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handle);
    } else {
      const legacy = media as unknown as {
        addListener?: (callback: (event: MediaQueryListEvent) => void) => void;
      };
      legacy.addListener?.(handle);
    }
  }

  // Sincroniza a preferência entre abas abertas.
  window.addEventListener('storage', (event) => {
    if (event.key === THEME_KEY) {
      applyTheme(readPreference(localStorage), false);
    }
  });
}
