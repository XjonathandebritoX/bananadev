/**
 * Tipos de dados curriculares gerados a partir do README.md.
 *
 * O README é a única fonte de verdade do currículo. Este arquivo descreve o
 * formato estruturado produzido pelo parser (`parse.ts`) e consumido pela
 * plataforma. Nunca edite `src/data/curriculum.generated.json` à mão.
 */

export type ResourceKind =
  | 'playlist'
  | 'video'
  | 'course'
  | 'docs'
  | 'book'
  | 'repo'
  | 'tool'
  | 'community'
  | 'practice';

export interface Resource {
  /** Rótulo editorial exibido na interface. */
  label: string;
  /** URL absoluta, sempre preservada do README. */
  url: string;
  /** Identificador da referência no bloco de links do README. */
  ref?: string;
  /** Tipo do recurso, usado para ícones e filtros. */
  kind: ResourceKind;
  /** Domínio legível (ex.: youtube.com). */
  domain: string;
}

export type DisciplineStatus = 'not-started' | 'in-progress' | 'completed';

export interface Discipline {
  /** Identificador estável usado em URLs e no progresso local. */
  id: string;
  /** Número da disciplina na matriz (1 a 45). */
  number: number;
  name: string;
  slug: string;
  hours: number;
  /** Ementa completa, exatamente como no README. */
  content: string;
  resources: Resource[];
  /** Observações editoriais que acompanham a ementa no README. */
  notes: string[];
  /** Tecnologias derivadas da taxonomia. */
  technologies: string[];
  semester: number;
  /** Caminho relativo da página da disciplina. */
  href: string;
}

export interface IntegratorProject {
  id: string;
  roman: string;
  /** Nome curto usado na seção de projetos integradores. */
  name: string;
  /** Título completo usado no semestre (inclui o nome curto). */
  title: string;
  slug: string;
  semester: number;
  hours: number;
  /** Entrega esperada, conforme o README. */
  delivery: string;
  /** Resumo da seção "Seis projetos integradores". */
  summary: string;
  technologies: string[];
  href: string;
}

export interface Semester {
  number: number;
  title: string;
  slug: string;
  hours: number;
  objective: string;
  /** Critério de avanço correspondente, extraído do README. */
  criteria: { title: string; text: string } | null;
  disciplines: Discipline[];
  project: IntegratorProject;
  href: string;
}

export interface Specialization {
  id: string;
  name: string;
  description: string;
  resources: Resource[];
  technologies: string[];
}

export interface CurriculumMeta {
  title: string;
  subtitle: string;
  version: string;
  totalHours: number;
  semesterCount: number;
  projectCount: number;
  disciplineCount: number;
  stack: string[];
  language: string;
  distribution: { label: string; percent: number }[];
  principles: string[];
  disclaimer: string;
}

export interface StudyPlan {
  name: string;
  hoursPerWeek: number;
  weeks: number;
  months: string;
}

export interface DevelopmentRules {
  items: string[];
  flow: string;
}

export interface Curriculum {
  meta: CurriculumMeta;
  semesters: Semester[];
  disciplines: Discipline[];
  projects: IntegratorProject[];
  specializations: Specialization[];
  studyPlans: StudyPlan[];
  developmentRules: DevelopmentRules;
  /** Bloco de referências do README: id => URL. */
  references: Record<string, string>;
}

export interface ProgressEntry {
  status: DisciplineStatus;
  updatedAt: string;
}

export interface ProgressState {
  version: 1;
  disciplines: Record<string, ProgressEntry>;
  projects: Record<string, ProgressEntry>;
  lastVisited: string | null;
  recent: string[];
  exportedAt?: string;
}
