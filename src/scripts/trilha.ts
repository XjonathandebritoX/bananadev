import { progressStore } from '../lib/progress/browser';
import { filterEntries, KIND_LABEL, RESOURCE_KIND_LABEL, snippet } from '../lib/search';
import type { SearchEntry } from '../lib/search';
import { STATUS_META } from '../lib/resources';
import type { DisciplineStatus } from '../lib/curriculum/types';
import { initProgressUI } from './progress-ui';

interface Filters {
  query: string;
  semester: number | null;
  technology: string | null;
  resourceKind: string | null;
  status: DisciplineStatus | 'all';
}

const filters: Filters = { query: '', semester: null, technology: null, resourceKind: null, status: 'all' };

function parseIndex(): SearchEntry[] {
  const element = document.getElementById('bd-search-index');
  if (!element?.textContent) return [];
  try {
    return JSON.parse(element.textContent) as SearchEntry[];
  } catch {
    return [];
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/** Destaca os termos buscados sem inserir HTML não escapado. */
function highlight(value: string, query: string): string {
  const safe = escapeHtml(value);
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (tokens.length === 0) return safe;
  const pattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  return safe.replace(pattern, '<mark>$1</mark>');
}

export function initTrilha(): void {
  initProgressUI();
  const entries = parseIndex();
  if (entries.length === 0) return;

  const store = progressStore();
  const curriculum = document.querySelector<HTMLElement>('[data-curriculum]');
  const resultsPanel = document.querySelector<HTMLElement>('[data-search-results]');
  const resultsList = document.querySelector<HTMLElement>('[data-results-list]');
  const resultsEmpty = document.querySelector<HTMLElement>('[data-results-empty]');
  const resultsCount = document.querySelector<HTMLElement>('[data-results-count]');
  const searchCount = document.querySelector<HTMLElement>('[data-search-count]');
  const input = document.querySelector<HTMLInputElement>('[data-search-input]');
  const techSelect = document.querySelector<HTMLSelectElement>('[data-filter-technology]');
  const kindSelect = document.querySelector<HTMLSelectElement>('[data-filter-kind]');

  if (!curriculum || !resultsPanel || !resultsList || !resultsCount || !searchCount || !input) return;

  const statusOf = (entry: SearchEntry): DisciplineStatus => {
    if (entry.kind === 'discipline') return store.statusOf('discipline', entry.id);
    if (entry.kind === 'project') return store.statusOf('project', entry.id);
    return 'not-started';
  };

  const isFiltering = () =>
    Boolean(filters.query) ||
    filters.semester !== null ||
    Boolean(filters.technology) ||
    Boolean(filters.resourceKind) ||
    filters.status !== 'all';

  const syncUrl = () => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.semester !== null) params.set('semestre', String(filters.semester));
    if (filters.technology) params.set('tech', filters.technology);
    if (filters.resourceKind) params.set('material', filters.resourceKind);
    if (filters.status !== 'all') params.set('status', filters.status);
    const search = params.toString();
    const next = `${window.location.pathname}${search ? `?${search}` : ''}${search ? '#busca' : ''}`;
    window.history.replaceState(null, '', next);
  };

  const render = () => {
    const active = isFiltering();
    curriculum.hidden = active;
    resultsPanel.hidden = !active;

    if (!active) {
      searchCount.textContent = 'Exibindo a trilha completa.';
      return;
    }

    const pool =
      filters.status === 'all' ? entries : entries.filter((entry) => entry.kind !== 'specialization');

    const results = filterEntries(pool, filters, statusOf);
    resultsList.innerHTML = '';

    for (const { entry } of results) {
      const link = document.createElement('a');
      link.className = 'search-result';
      link.href = entry.href;
      link.innerHTML = `
        <span class="search-result__type">${escapeHtml(KIND_LABEL[entry.kind])} · ${escapeHtml(entry.subtitle)}</span>
        <span class="search-result__title">${highlight(entry.title, filters.query)}</span>
        <span class="search-result__snippet">${highlight(snippet(entry.text, filters.query), filters.query)}</span>
      `;
      if (entry.kind !== 'specialization') {
        const badge = document.createElement('span');
        badge.className = 'tag tag--outline';
        badge.style.marginTop = '0.35rem';
        badge.textContent = STATUS_META[statusOf(entry)].label;
        link.appendChild(badge);
      }
      resultsList.appendChild(link);
    }

    if (resultsEmpty) resultsEmpty.hidden = results.length > 0;
    const label = results.length === 1 ? '1 resultado' : `${results.length} resultados`;
    resultsCount.textContent = `${label} para os filtros atuais.`;
    searchCount.textContent = `${label} encontrados.`;
  };

  const setPressed = (selector: string, active: Element | null) => {
    for (const chip of document.querySelectorAll<HTMLButtonElement>(selector)) {
      chip.setAttribute('aria-pressed', String(chip === active));
    }
  };

  let debounce = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(() => {
      filters.query = input.value;
      syncUrl();
      render();
    }, 140);
  });

  for (const chip of document.querySelectorAll<HTMLButtonElement>('[data-filter-semester]')) {
    chip.addEventListener('click', () => {
      const value = chip.dataset.filterSemester ?? '';
      filters.semester = value === '' ? null : Number(value);
      setPressed('[data-filter-semester]', chip);
      syncUrl();
      render();
    });
  }

  for (const chip of document.querySelectorAll<HTMLButtonElement>('[data-filter-status]')) {
    chip.addEventListener('click', () => {
      filters.status = (chip.dataset.filterStatus ?? 'all') as DisciplineStatus | 'all';
      setPressed('[data-filter-status]', chip);
      syncUrl();
      render();
    });
  }

  techSelect?.addEventListener('change', () => {
    filters.technology = techSelect.value || null;
    syncUrl();
    render();
  });

  kindSelect?.addEventListener('change', () => {
    filters.resourceKind = kindSelect.value || null;
    syncUrl();
    render();
  });

  const clear = () => {
    filters.query = '';
    filters.semester = null;
    filters.technology = null;
    filters.resourceKind = null;
    filters.status = 'all';
    input.value = '';
    if (techSelect) techSelect.value = '';
    if (kindSelect) kindSelect.value = '';
    setPressed('[data-filter-semester]', document.querySelector('[data-filter-semester=""]'));
    setPressed('[data-filter-status]', document.querySelector('[data-filter-status="all"]'));
    syncUrl();
    render();
  };

  document.querySelector('[data-clear-filters]')?.addEventListener('click', clear);

  for (const link of document.querySelectorAll<HTMLAnchorElement>('[data-section-link]')) {
    link.addEventListener('click', () => {
      clear();
    });
  }

  // Contadores por semestre e total.
  for (const counter of document.querySelectorAll<HTMLElement>('[data-count-semester]')) {
    const number = Number(counter.dataset.countSemester);
    const total = entries.filter((entry) => entry.kind === 'discipline' && entry.semester === number).length;
    counter.textContent = String(total);
  }
  input.setAttribute('aria-describedby', 'bd-search-hint');
  const hint = document.createElement('p');
  hint.id = 'bd-search-hint';
  hint.className = 'sr-only';
  hint.textContent = 'Pressione a tecla barra para focar a busca.';
  document.body.appendChild(hint);

  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
    event.preventDefault();
    input.focus();
    input.select();
  });

  // Estado inicial vindo da URL.
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  const semester = params.get('semestre');
  const tech = params.get('tech');
  const material = params.get('material');
  const status = params.get('status');

  if (query) {
    filters.query = query;
    input.value = query;
  }
  if (semester && ['1', '2', '3', '4', '5', '6'].includes(semester)) {
    filters.semester = Number(semester);
    setPressed('[data-filter-semester]', document.querySelector(`[data-filter-semester="${semester}"]`));
  }
  if (tech && techSelect) {
    filters.technology = tech;
    techSelect.value = tech;
  }
  if (material && kindSelect) {
    filters.resourceKind = material;
    kindSelect.value = material;
  }
  if (status && ['not-started', 'in-progress', 'completed'].includes(status)) {
    filters.status = status as DisciplineStatus;
    setPressed('[data-filter-status]', document.querySelector(`[data-filter-status="${status}"]`));
  }

  render();
}
