import progressIndex from '../../data/progress.generated.json';
import type { CurriculumHours, ProgressStore as ProgressStoreType } from './store';
import { ProgressStore, STORAGE_KEY } from './store';

let store: ProgressStoreType | null = null;

export function progressStore(): ProgressStoreType {
  if (store) return store;
  store = new ProgressStore(window.localStorage);
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) store?.refresh();
  });
  return store;
}

export function curriculumHours(): CurriculumHours {
  return progressIndex as CurriculumHours;
}

export function formatHours(hours: number): string {
  return `${hours.toLocaleString('pt-BR')}h`;
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
