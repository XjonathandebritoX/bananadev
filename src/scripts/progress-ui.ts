import { curriculumHours, formatHours, progressStore } from '../lib/progress/browser';
import { STATUS_META } from '../lib/resources';
import type { DisciplineStatus } from '../lib/curriculum/types';
import type { ProgressStats } from '../lib/progress/store';

const data = curriculumHours();

function announce(message: string): void {
  const region = document.querySelector<HTMLElement>('[data-live-region]');
  if (!region) return;
  region.textContent = '';
  window.setTimeout(() => {
    region.textContent = message;
  }, 60);
}

function setText(selector: string, value: string): void {
  for (const element of document.querySelectorAll<HTMLElement>(selector)) {
    element.textContent = value;
  }
}

function render(stats: ProgressStats): void {
  setText('[data-stat="percent"]', `${stats.percent}%`);
  setText('[data-stat="hours"]', formatHours(stats.completedHours));
  setText('[data-stat="hours-total"]', formatHours(stats.totalHours));
  setText('[data-stat="disciplines"]', `${stats.disciplinesCompleted} de ${stats.disciplinesTotal}`);
  setText('[data-stat="projects"]', `${stats.projectsCompleted} de ${stats.projectsTotal}`);
  setText('[data-stat="in-progress"]', String(stats.disciplinesInProgress));

  for (const ring of document.querySelectorAll<HTMLElement>('[data-progress-ring]')) {
    ring.style.setProperty('--value', String(stats.percent));
    ring.setAttribute('aria-valuenow', String(stats.percent));
    const label = ring.querySelector<HTMLElement>('[data-ring-value]');
    if (label) label.textContent = `${stats.percent}%`;
  }

  for (const bar of document.querySelectorAll<HTMLElement>('[data-progress-bar]')) {
    bar.style.width = `${stats.percent}%`;
  }

  for (const semester of stats.semesters) {
    const bar = document.querySelector<HTMLElement>(`[data-semester-bar="${semester.number}"]`);
    if (bar) bar.style.width = `${semester.percent}%`;

    setText(`[data-semester-pct="${semester.number}"]`, `${semester.percent}%`);
    setText(
      `[data-semester-count="${semester.number}"]`,
      `${semester.completed}/${semester.total} disciplinas`,
    );
    setText(`[data-semester-hours="${semester.number}"]`, formatHours(semester.hoursCompleted));
  }

  if (stats.completedHours === 0) {
    setText('[data-progress-message]', 'Nenhuma disciplina concluída ainda. Comece pela primeira da trilha.');
  } else if (stats.percent >= 100) {
    setText('[data-progress-message]', 'Formação concluída. Agora é manter o portfólio e contribuir em projetos.');
  } else {
    setText(
      '[data-progress-message]',
      `${formatHours(stats.completedHours)} de ${formatHours(stats.totalHours)} concluídas.`,
    );
  }
}

function syncControls(): void {
  const store = progressStore();

  for (const input of document.querySelectorAll<HTMLInputElement>('input[data-status-input]')) {
    const id = input.dataset.itemId;
    const kind = input.dataset.itemKind as 'discipline' | 'project' | undefined;
    if (!id || !kind) continue;
    input.checked = store.statusOf(kind, id) === input.value;
  }

  for (const card of document.querySelectorAll<HTMLElement>('[data-discipline-card]')) {
    const id = card.dataset.disciplineCard;
    if (!id) continue;
    card.dataset.status = store.statusOf('discipline', id);
  }

  for (const badge of document.querySelectorAll<HTMLElement>('[data-status-badge]')) {
    const id = badge.dataset.itemId;
    const kind = (badge.dataset.itemKind as 'discipline' | 'project' | undefined) ?? 'discipline';
    if (!id) continue;
    const status = store.statusOf(kind, id);
    badge.textContent = STATUS_META[status].label;
    badge.dataset.status = status;
  }

  render(store.stats(data));
}

export function initProgressUI(): void {
  const store = progressStore();
  syncControls();

  document.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (!input.matches('input[data-status-input]')) return;

    const id = input.dataset.itemId;
    const kind = input.dataset.itemKind as 'discipline' | 'project' | undefined;
    if (!id || !kind) return;

    const status = input.value as DisciplineStatus;
    store.setStatus(kind, id, status);
    const label = kind === 'project' ? 'Projeto' : 'Disciplina';
    announce(`${label} marcada como ${STATUS_META[status].label.toLowerCase()}.`);
  });

  store.subscribe(() => {
    syncControls();
  });

  const visited = document.querySelector<HTMLElement>('[data-visited]');
  if (visited?.dataset.visited) store.markVisited(visited.dataset.visited);
}
