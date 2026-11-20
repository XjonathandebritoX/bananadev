import type { DisciplineStatus, ProgressState } from '../curriculum/types';

export const STORAGE_KEY = 'bananadev.progress.v1';
export const STORAGE_VERSION = 1;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface CurriculumHours {
  totalHours: number;
  disciplines: { id: string; hours: number; semester: number }[];
  projects: { id: string; hours: number }[];
}

export interface ProgressStats {
  totalHours: number;
  completedHours: number;
  percent: number;
  disciplinesCompleted: number;
  disciplinesInProgress: number;
  disciplinesTotal: number;
  projectsCompleted: number;
  projectsTotal: number;
  semesters: {
    number: number;
    completed: number;
    inProgress: number;
    total: number;
    hoursCompleted: number;
    percent: number;
  }[];
}

const VALID_STATUS: DisciplineStatus[] = ['not-started', 'in-progress', 'completed'];

export function createEmptyState(): ProgressState {
  return {
    version: STORAGE_VERSION,
    disciplines: {},
    projects: {},
    lastVisited: null,
    recent: [],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Valida dados vindos do armazenamento local ou de um arquivo importado.
 * Nunca confia no conteúdo: apenas ids em formato esperado e estados válidos.
 */
export function sanitizeState(input: unknown): ProgressState {
  const state = createEmptyState();
  if (!isRecord(input)) return state;

  const readEntries = (value: unknown): Record<string, { status: DisciplineStatus; updatedAt: string }> => {
    const entries: Record<string, { status: DisciplineStatus; updatedAt: string }> = {};
    if (!isRecord(value)) return entries;
    for (const [id, entry] of Object.entries(value)) {
      if (!/^[a-z0-9-]{2,80}$/.test(id)) continue;
      if (!isRecord(entry)) continue;
      const status = entry.status;
      if (typeof status !== 'string' || !VALID_STATUS.includes(status as DisciplineStatus)) continue;
      const updatedAt =
        typeof entry.updatedAt === 'string' && !Number.isNaN(Date.parse(entry.updatedAt))
          ? entry.updatedAt
          : new Date(0).toISOString();
      entries[id] = { status: status as DisciplineStatus, updatedAt };
    }
    return entries;
  };

  state.disciplines = readEntries(input.disciplines);
  state.projects = readEntries(input.projects);
  state.lastVisited = typeof input.lastVisited === 'string' ? input.lastVisited : null;
  state.recent = Array.isArray(input.recent)
    ? input.recent.filter((id): id is string => typeof id === 'string' && /^[a-z0-9-]{2,80}$/.test(id)).slice(0, 8)
    : [];

  return state;
}

function clone(state: ProgressState): ProgressState {
  return {
    version: STORAGE_VERSION,
    disciplines: { ...state.disciplines },
    projects: { ...state.projects },
    lastVisited: state.lastVisited,
    recent: [...state.recent],
  };
}

type Listener = (state: ProgressState) => void;

export class ProgressStore {
  private state: ProgressState;
  private listeners = new Set<Listener>();

  constructor(
    private readonly storage: StorageLike,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {
    this.state = this.load();
  }

  private load(): ProgressState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyState();
      return sanitizeState(JSON.parse(raw));
    } catch {
      return createEmptyState();
    }
  }

  private persist(): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* armazenamento indisponível (modo privado, cota) */
    }
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  snapshot(): ProgressState {
    return clone(this.state);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Recarrega do armazenamento (usado na sincronização entre abas). */
  refresh(): void {
    this.state = this.load();
    this.emit();
  }

  statusOf(kind: 'discipline' | 'project', id: string): DisciplineStatus {
    const collection = kind === 'discipline' ? this.state.disciplines : this.state.projects;
    return collection[id]?.status ?? 'not-started';
  }

  setStatus(kind: 'discipline' | 'project', id: string, status: DisciplineStatus): void {
    if (!VALID_STATUS.includes(status)) return;
    const collection = kind === 'discipline' ? this.state.disciplines : this.state.projects;
    if (status === 'not-started') {
      delete collection[id];
    } else {
      collection[id] = { status, updatedAt: this.now() };
    }
    this.persist();
    this.emit();
  }

  markVisited(id: string): void {
    this.state.lastVisited = id;
    this.state.recent = [id, ...this.state.recent.filter((item) => item !== id)].slice(0, 8);
    this.persist();
    this.emit();
  }

  clear(): void {
    this.state = createEmptyState();
    try {
      this.storage.removeItem(STORAGE_KEY);
    } catch {
      /* ignora */
    }
    this.emit();
  }

  /** Exporta um arquivo de backup legível e portátil. */
  exportJson(): string {
    const payload = {
      app: 'bananadev',
      kind: 'progress-backup',
      version: STORAGE_VERSION,
      exportedAt: this.now(),
      progress: this.state,
    };
    return `${JSON.stringify(payload, null, 2)}\n`;
  }

  /** Importa um backup e devolve o resultado da validação. */
  importJson(text: string): { ok: true; state: ProgressState } | { ok: false; error: string } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: 'O arquivo não é um JSON válido.' };
    }
    if (!isRecord(parsed)) return { ok: false, error: 'Estrutura de backup inválida.' };
    const candidate = isRecord(parsed.progress) ? parsed.progress : parsed;
    if (!isRecord(candidate) || (!('disciplines' in candidate) && !('projects' in candidate))) {
      return { ok: false, error: 'O arquivo não parece ser um backup de progresso do #BananaDev.' };
    }
    const state = sanitizeState(candidate);
    const knownEntries = Object.keys(state.disciplines).length + Object.keys(state.projects).length;
    if (knownEntries === 0 && !state.lastVisited) {
      return { ok: false, error: 'O backup não contém nenhum progresso registrado.' };
    }
    this.state = state;
    this.persist();
    this.emit();
    return { ok: true, state: this.snapshot() };
  }

  stats(curriculum: CurriculumHours): ProgressStats {
    const disciplinesCompleted = curriculum.disciplines.filter(
      (discipline) => this.statusOf('discipline', discipline.id) === 'completed',
    );
    const disciplinesInProgress = curriculum.disciplines.filter(
      (discipline) => this.statusOf('discipline', discipline.id) === 'in-progress',
    );
    const projectsCompleted = curriculum.projects.filter(
      (project) => this.statusOf('project', project.id) === 'completed',
    );

    const completedHours =
      disciplinesCompleted.reduce((total, discipline) => total + discipline.hours, 0) +
      projectsCompleted.reduce((total, project) => total + project.hours, 0);

    const semesterNumbers = [...new Set(curriculum.disciplines.map((discipline) => discipline.semester))].sort(
      (a, b) => a - b,
    );

    const semesters = semesterNumbers.map((number) => {
      const semesterDisciplines = curriculum.disciplines.filter((discipline) => discipline.semester === number);
      const completed = semesterDisciplines.filter(
        (discipline) => this.statusOf('discipline', discipline.id) === 'completed',
      );
      const inProgress = semesterDisciplines.filter(
        (discipline) => this.statusOf('discipline', discipline.id) === 'in-progress',
      );
      const hoursCompleted = completed.reduce((total, discipline) => total + discipline.hours, 0);
      const semesterHours = semesterDisciplines.reduce((total, discipline) => total + discipline.hours, 0);
      return {
        number,
        completed: completed.length,
        inProgress: inProgress.length,
        total: semesterDisciplines.length,
        hoursCompleted,
        percent: semesterHours === 0 ? 0 : Math.round((hoursCompleted / semesterHours) * 100),
      };
    });

    return {
      totalHours: curriculum.totalHours,
      completedHours,
      percent: curriculum.totalHours === 0 ? 0 : Math.min(100, Math.round((completedHours / curriculum.totalHours) * 100)),
      disciplinesCompleted: disciplinesCompleted.length,
      disciplinesInProgress: disciplinesInProgress.length,
      disciplinesTotal: curriculum.disciplines.length,
      projectsCompleted: projectsCompleted.length,
      projectsTotal: curriculum.projects.length,
      semesters,
    };
  }
}
