import type { Curriculum } from '../curriculum/types';
import type { DisciplineStatus } from '../curriculum/types';

export type SearchKind = 'discipline' | 'project' | 'specialization';

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  text: string;
  href: string;
  semester: number | null;
  technologies: string[];
  resourceKinds: string[];
  hours: number | null;
}

export interface SearchFilters {
  query?: string;
  semester?: number | null;
  technology?: string | null;
  resourceKind?: string | null;
  status?: DisciplineStatus | 'all';
}

export const KIND_LABEL: Record<SearchKind, string> = {
  discipline: 'Disciplina',
  project: 'Projeto integrador',
  specialization: 'Especialização',
};

export const RESOURCE_KIND_LABEL: Record<string, string> = {
  playlist: 'Playlist',
  video: 'Vídeo',
  course: 'Curso',
  docs: 'Documentação',
  book: 'Livro',
  repo: 'Repositório',
  tool: 'Ferramenta',
  community: 'Comunidade',
  practice: 'Prática',
};

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function buildSearchIndex(curriculum: Curriculum): SearchEntry[] {
  const entries: SearchEntry[] = curriculum.disciplines.map((discipline) => ({
    id: discipline.id,
    kind: 'discipline',
    title: discipline.name,
    subtitle: `${discipline.semester}º semestre · ${discipline.hours}h`,
    text: [discipline.content, ...discipline.notes, ...discipline.resources.map((resource) => resource.label)].join(' '),
    href: discipline.href,
    semester: discipline.semester,
    technologies: discipline.technologies,
    resourceKinds: [...new Set(discipline.resources.map((resource) => resource.kind))],
    hours: discipline.hours,
  }));

  for (const project of curriculum.projects) {
    entries.push({
      id: project.id,
      kind: 'project',
      title: project.title,
      subtitle: `${project.semester}º semestre · ${project.hours}h`,
      text: [project.delivery, project.summary].join(' '),
      href: `${project.href}#${project.id}`,
      semester: project.semester,
      technologies: project.technologies,
      resourceKinds: ['project'],
      hours: project.hours,
    });
  }

  for (const specialization of curriculum.specializations) {
    entries.push({
      id: specialization.id,
      kind: 'specialization',
      title: specialization.name,
      subtitle: 'Especialização opcional',
      text: [specialization.description, ...specialization.resources.map((resource) => resource.label)].join(' '),
      href: '/especializacoes/',
      semester: null,
      technologies: specialization.technologies,
      resourceKinds: [...new Set(specialization.resources.map((resource) => resource.kind))],
      hours: null,
    });
  }

  return entries;
}

export function scoreEntry(entry: SearchEntry, query: string): number {
  if (!query) return 0;
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length === 0) return 0;

  const title = normalize(entry.title);
  const tech = normalize(entry.technologies.join(' '));
  const text = normalize(entry.text);
  const haystack = `${title} ${tech} ${text}`;

  if (!tokens.every((token) => haystack.includes(token))) return 0;

  let score = 1;
  for (const token of tokens) {
    if (title.includes(token)) score += 6;
    if (title.startsWith(token)) score += 4;
    if (tech.includes(token)) score += 2;
  }
  if (normalizedQuery.length > 2 && title === normalizedQuery) score += 10;
  return score;
}

export interface SearchResult {
  entry: SearchEntry;
  score: number;
}

/**
 * Filtra e ordena entradas do índice. A função é pura: o status de progresso
 * é resolvido pelo chamador, que passa apenas entradas permitidas.
 */
export function filterEntries(
  entries: SearchEntry[],
  filters: SearchFilters,
  statusOf?: (entry: SearchEntry) => DisciplineStatus,
): SearchResult[] {
  const query = (filters.query ?? '').trim();
  const semester = filters.semester ?? null;
  const technology = filters.technology ?? null;
  const resourceKind = filters.resourceKind ?? null;
  const status = filters.status ?? 'all';

  const results: SearchResult[] = [];
  for (const entry of entries) {
    if (semester !== null && entry.semester !== semester) continue;
    if (technology && !entry.technologies.includes(technology)) continue;
    if (resourceKind && !entry.resourceKinds.includes(resourceKind)) continue;
    if (status !== 'all' && statusOf) {
      const current = statusOf(entry);
      if (status === 'not-started' && current !== 'not-started') continue;
      if (status === 'in-progress' && current !== 'in-progress') continue;
      if (status === 'completed' && current !== 'completed') continue;
    }
    const score = scoreEntry(entry, query);
    if (query && score === 0) continue;
    results.push({ entry, score });
  }

  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.entry.semester !== b.entry.semester) {
      return (a.entry.semester ?? 99) - (b.entry.semester ?? 99);
    }
    return a.entry.title.localeCompare(b.entry.title, 'pt-BR');
  });

  return results;
}

/** Trecho de contexto ao redor do primeiro termo encontrado. */
export function snippet(text: string, query: string, length = 150): string {
  if (!query) return text.slice(0, length) + (text.length > length ? '…' : '');
  const plain = text.replace(/\s+/g, ' ');
  const normalized = normalize(plain);
  const firstToken = normalize(query).split(' ').filter(Boolean)[0] ?? '';
  const index = normalized.indexOf(firstToken);
  if (index === -1) return plain.slice(0, length) + (plain.length > length ? '…' : '');
  const start = Math.max(0, index - Math.floor(length / 3));
  const slice = plain.slice(start, start + length);
  return `${start > 0 ? '…' : ''}${slice}${start + length < plain.length ? '…' : ''}`;
}
