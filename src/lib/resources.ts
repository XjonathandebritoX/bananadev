import type { DisciplineStatus } from './curriculum/types';
import type { ResourceKind } from './curriculum/types';

export const RESOURCE_META: Record<ResourceKind, { label: string; icon: string }> = {
  playlist: { label: 'Playlist', icon: 'playlist' },
  video: { label: 'Vídeo', icon: 'video' },
  course: { label: 'Curso', icon: 'course' },
  docs: { label: 'Documentação', icon: 'docs' },
  book: { label: 'Livro', icon: 'book' },
  repo: { label: 'Repositório', icon: 'repo' },
  tool: { label: 'Ferramenta', icon: 'tool' },
  community: { label: 'Comunidade', icon: 'community' },
  practice: { label: 'Prática', icon: 'practice' },
};

export const STATUS_META: Record<DisciplineStatus, { label: string; short: string }> = {
  'not-started': { label: 'Não iniciada', short: 'Não iniciada' },
  'in-progress': { label: 'Em andamento', short: 'Em andamento' },
  completed: { label: 'Concluída', short: 'Concluída' },
};

export const RESOURCE_FILTERS: { value: ResourceKind; label: string }[] = [
  { value: 'playlist', label: 'Playlists' },
  { value: 'video', label: 'Vídeos' },
  { value: 'course', label: 'Cursos' },
  { value: 'docs', label: 'Documentação' },
  { value: 'book', label: 'Livros' },
  { value: 'repo', label: 'Repositórios' },
  { value: 'practice', label: 'Práticas' },
];
