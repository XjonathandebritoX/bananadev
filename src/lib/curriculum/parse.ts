import type {
  Curriculum,
  CurriculumMeta,
  DevelopmentRules,
  Discipline,
  IntegratorProject,
  Resource,
  ResourceKind,
  Semester,
  Specialization,
  StudyPlan,
} from './types';
import { deriveTechnologies } from './taxonomy';

/**
 * Parser determinístico da matriz curricular.
 *
 * Lê o README.md da raiz, valida a integridade de todas as etapas e devolve os
 * dados usados pela plataforma. Qualquer perda de informação obrigatória gera
 * erro de build com a lista completa de problemas encontrados.
 */
export class CurriculumParseError extends Error {
  readonly problems: string[];

  constructor(problems: string[]) {
    super(
      `Falha ao extrair o currículo do README.md:\n${problems
        .map((problem) => `  - ${problem}`)
        .join('\n')}`,
    );
    this.name = 'CurriculumParseError';
    this.problems = problems;
  }
}

const REF_DEFINITION = /^\[([a-z0-9_]+)\]:\s*(\S+)\s*$/i;
const LINK_REF = /\[([^\[\]]+)\]\[([a-z0-9_]+)\]/gi;
const LINK_INLINE = /\[([^\[\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;

const KIND_OVERRIDES: Record<string, ResourceKind> = {
  progit: 'book',
  bash_manual: 'docs',
  github_docs: 'docs',
  git_video: 'video',
  postman_full: 'playlist',
  postman_course: 'playlist',
  postman_learning: 'course',
  skillbuilder_aws: 'course',
  aws_skillbuilder: 'course',
  evg_actions: 'course',
  choose_license: 'tool',
  aws_calculator: 'tool',
  observability_channel: 'community',
  leetcode: 'practice',
  hackerrank: 'practice',
  docker_book: 'book',
  fastapi_book: 'book',
  figma: 'course',
  docker_linuxtips: 'playlist',
  ctfl: 'playlist',
  tests_vitest_playwright: 'video',
  git_lhama: 'playlist',
};

const DOC_HOSTS = [
  'docs.github.com',
  'developer.mozilla.org',
  'git-scm.com',
  'gnu.org',
  'postgresql.org',
  'pgdocptbr18-11aacb.gitlab.io',
  'playwright.dev',
  'docs.pytest.org',
  'pt-br.react.dev',
  'scikit-learn.org',
  'pandas.pydata.org',
  'prometheus.io',
  'grafana.com',
  'rabbitmq.com',
  'kafka.apache.org',
  'kubernetes.io',
  'graphql.org',
  'go.dev',
  'learn.microsoft.com',
  'learncpp.com',
  'refactoring.guru',
  'choosealicense.com',
  'spec.openapis.org',
  'top10.owasp.org',
  'www.postman.com',
  'postman.com',
];

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanText(value: string): string {
  return value
    .replace(/\[([^\[\]]+)\]\[[a-z0-9_]+\]/gi, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function classifyResource(ref: string | undefined, label: string, url: string): ResourceKind {
  if (ref && KIND_OVERRIDES[ref]) return KIND_OVERRIDES[ref];
  const host = domainOf(url);
  const lowerLabel = label.toLowerCase();

  if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') {
    if (url.includes('/playlist')) return 'playlist';
    if (url.includes('/watch') || host === 'youtu.be') return 'video';
    return 'community';
  }
  if (host === 'github.com') return 'repo';
  if (DOC_HOSTS.some((docHost) => host === docHost || host.endsWith(`.${docHost}`))) {
    if (/curso|curso em vídeo|trilha|aulas/.test(lowerLabel)) return 'course';
    return 'docs';
  }
  if (/documenta[çc][ãa]o|manual|referência/.test(lowerLabel)) return 'docs';
  if (/livro/.test(lowerLabel)) return 'book';
  if (/playlist/.test(lowerLabel)) return 'playlist';
  if (/laborat[óo]rio|workshop|exerc[íi]cios/.test(lowerLabel)) return 'practice';
  if (/curso|trilha|aprendizagem/.test(lowerLabel)) return 'course';
  return 'tool';
}

interface ExtractedLink {
  label: string;
  url: string;
  ref?: string;
  raw: string;
  index: number;
}

/** Extrai todos os links de um trecho, resolvendo referências do README. */
function extractLinks(text: string, refs: Record<string, string>, problems: string[]): ExtractedLink[] {
  const links: ExtractedLink[] = [];

  for (const match of text.matchAll(LINK_REF)) {
    const [raw, label, ref] = match;
    const url = refs[ref];
    if (!url) {
      problems.push(`Referência de link inexistente: [${label}][${ref}]`);
      continue;
    }
    links.push({ label: cleanText(label), url, ref, raw, index: match.index ?? 0 });
  }
  const withoutRefs = text.replace(LINK_REF, (full) => ' '.repeat(full.length));

  for (const match of withoutRefs.matchAll(LINK_INLINE)) {
    const [raw, label, url] = match;
    if (!/^https?:\/\//.test(url)) {
      problems.push(`Link inválido: ${raw}`);
      continue;
    }
    links.push({ label: cleanText(label), url, raw, index: match.index ?? 0 });
  }

  return links.sort((a, b) => a.index - b.index);
}

function toResources(links: ExtractedLink[]): Resource[] {
  const seen = new Set<string>();
  return links
    .filter((link) => {
      if (seen.has(link.url)) return false;
      seen.add(link.url);
      return true;
    })
    .map((link) => ({
      label: link.label,
      url: link.url,
      ref: link.ref,
      kind: classifyResource(link.ref, link.label, link.url),
      domain: domainOf(link.url),
    }));
}

/** Separa prosa residual (notas editoriais) dos links já extraídos. */
function extractNotes(text: string, links: ExtractedLink[]): string[] {
  let remainder = text;
  for (const link of links) {
    remainder = remainder.replace(link.raw, ' ');
  }
  const CONNECTOR_START = /^(como|e\b|ou\b|refer[êe]ncia|apoio|complemento|trilha|tamb[ée]m|para consulta|para o m[óo]dulo|,|;|\.)/i;
  const LINK_ARTIFACT = /\b(do|da|de|em|com|para)\s+e\b|\be\s*\.\s*$|^\(.*\)\s*(e|ou)?\s*\.?$/i;

  return remainder
    .split(/(?<=[.!?])\s+/)
    .map((sentence) =>
      sentence
        .replace(/\s+/g, ' ')
        .replace(/^[\s,;.:–-]+/, '')
        .replace(/[\s,;]+$/, '')
        .trim(),
    )
    .filter((sentence) => sentence.length >= 30)
    .filter((sentence) => /[a-zà-ú]{3}/i.test(sentence))
    .filter((sentence) => !CONNECTOR_START.test(sentence))
    .filter((sentence) => !LINK_ARTIFACT.test(sentence));
}

interface BlockFields {
  [key: string]: string;
}

/** Coleta campos `**Nome:** valor` de um bloco, aceitando quebra de linha. */
function collectFields(lines: string[]): BlockFields {
  const fields: BlockFields = {};
  let current: string | null = null;

  for (const line of lines) {
    const match = line.match(/^\*\*([^*]+):\*\*\s*(.*)$/);
    if (match) {
      current = match[1].trim().toLowerCase();
      fields[current] = match[2].trim();
      continue;
    }
    if (!line.trim()) {
      current = null;
      continue;
    }
    if (current) {
      fields[current] = `${fields[current]} ${line.trim()}`.trim();
    }
  }
  return fields;
}

function splitBlocks(lines: string[], level: number): { heading: string; body: string[] }[] {
  const blocks: { heading: string; body: string[] }[] = [];
  let current: { heading: string; body: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch && headingMatch[1].length === level) {
      if (current) blocks.push(current);
      current = { heading: headingMatch[2].trim(), body: [] };
      continue;
    }
    if (headingMatch && headingMatch[1].length < level && current) {
      blocks.push(current);
      current = null;
      continue;
    }
    if (current) current.body.push(line);
  }
  if (current) blocks.push(current);
  return blocks;
}

/** Recorta as seções H1 do documento por título. */
function splitSections(lines: string[]): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  const header: string[] = [];
  let current: string | null = null;
  let sawDocumentTitle = false;

  for (const line of lines) {
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      if (!sawDocumentTitle && /bananadev/i.test(h1[1])) {
        sawDocumentTitle = true;
        header.push(line);
        continue;
      }
      sawDocumentTitle = true;
      current = h1[1].trim();
      sections.set(current, []);
      continue;
    }
    if (current) sections.get(current)!.push(line);
    else header.push(line);
  }
  sections.set('cabecalho', header);
  return sections;
}

export function parseCurriculum(markdown: string): Curriculum {
  const problems: string[] = [];
  const normalized = markdown.replace(/\r\n?/g, '\n');
  const rawLines = normalized.split('\n');

  const references: Record<string, string> = {};
  const bodyLines: string[] = [];
  for (const line of rawLines) {
    const refMatch = line.match(REF_DEFINITION);
    if (refMatch) {
      references[refMatch[1]] = refMatch[2];
      continue;
    }
    if (/^<!--.*-->$/.test(line.trim())) continue;
    bodyLines.push(line);
  }

  const sections = splitSections(bodyLines);
  const header = sections.get('cabecalho') ?? [];

  // ---- Cabeçalho / metadados -------------------------------------------------
  const titleLine = header.find((line) => /^#\s+/.test(line)) ?? '';
  const titleMatch = titleLine.match(/^#\s+(#?BananaDev)\s*[-–—]\s*(.+)$/);
  const title = titleMatch ? titleMatch[1] : '#BananaDev';
  const subtitle = titleMatch ? titleMatch[2].trim() : 'Formação autodidata em Análise e Desenvolvimento de Sistemas';

  const headerText = header.join('\n');
  const totalHours = Number(headerText.match(/\*\*Carga horária planejada:\*\*\s*([\d.]+)\s*horas/i)?.[1]?.replace(/\./g, '')) || 0;
  const version = headerText.match(/\*\*Versão consolidada:\*\*\s*(.+)/i)?.[1]?.trim() ?? '';
  const stackLine = headerText.match(/\*\*Stack principal:\*\*\s*(.+)/i)?.[1]?.trim() ?? '';
  const language = headerText.match(/\*\*Idioma:\*\*\s*(.+)/i)?.[1]?.trim() ?? '';
  const disclaimer =
    header.find((line) => /^Percurso independente/.test(line.trim()))?.trim() ??
    'Projeto independente de formação autodidata. Não concede diploma de graduação.';

  const stack = stackLine
    ? stackLine
        .replace(/\.$/, '')
        .split(/,\s*|\s+e\s+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const distributionLine = header.find((line) => /Distribuição estimada/i.test(line)) ?? '';
  const distribution = [...distributionLine.matchAll(/([a-zà-ú][a-zà-ú\s/]+?)\s(\d+)%/gi)].map((match) => ({
    label: match[1].trim().replace(/^.*?:\*\*\s*/, ''),
    percent: Number(match[2]),
  }));

  const principles: string[] = [];
  const principlesBlock = splitBlocks(header, 2).find((block) => /^Princípios de execução$/i.test(block.heading));
  for (const line of principlesBlock?.body ?? []) {
    const item = line.match(/^\d+\.\s+(.*)$/);
    if (item) principles.push(cleanText(item[1]));
  }

  // ---- Semestres -------------------------------------------------------------
  const semesterEntries = [...sections.entries()].filter(([heading]) => /^\dº\s+semestre\s*[-–]/i.test(heading));

  const semesters: Semester[] = [];
  const disciplines: Discipline[] = [];
  const projectsBySemester = new Map<number, IntegratorProject>();

  for (const [heading, content] of semesterEntries) {
    const headingMatch = heading.match(/^(\d)º\s+semestre\s*[-–]\s*(.+)$/i);
    if (!headingMatch) {
      problems.push(`Cabeçalho de semestre não reconhecido: ${heading}`);
      continue;
    }
    const number = Number(headingMatch[1]);
    const semesterTitle = headingMatch[2].trim();
    const lines = content.filter((line) => line.trim() !== '' && line.trim() !== '---');
    const hours = Number(lines.find((line) => /Carga horária:/i.test(line))?.match(/(\d+)\s*h/i)?.[1] ?? 0);
    const objectiveLine = lines.find((line) => /^\*\*Objetivo:\*\*/i.test(line)) ?? '';
    const objective = cleanText(objectiveLine.replace(/^\*\*Objetivo:\*\*/i, ''));

    const blocks = splitBlocks(lines, 3);
    const semesterDisciplines: Discipline[] = [];
    let semesterProject: IntegratorProject | null = null;

    for (const block of blocks) {
      const disciplineMatch = block.heading.match(/^(\d+)\.\s+(.*?)\s*[-–]\s*(\d+)\s*h$/);
      if (disciplineMatch) {
        const disciplineNumber = Number(disciplineMatch[1]);
        const name = disciplineMatch[2].trim();
        const disciplineHours = Number(disciplineMatch[3]);
        const fields = collectFields(block.body);
        const contentText = fields['conteúdo'] ?? '';
        if (!contentText) problems.push(`Disciplina sem ementa: ${name}`);
        const materialText = fields['materiais'] ?? '';
        const links = extractLinks(materialText, references, problems);
        const resources = toResources(links);
        const notes = extractNotes(materialText, links);
        if (resources.length === 0 && notes.length === 0) problems.push(`Disciplina sem materiais: ${name}`);

        const slug = slugify(name);
        const discipline: Discipline = {
          id: `d${String(disciplineNumber).padStart(2, '0')}-${slug}`,
          number: disciplineNumber,
          name,
          slug,
          hours: disciplineHours,
          content: cleanText(contentText),
          resources,
          notes,
          technologies: deriveTechnologies(name, contentText, resources.map((resource) => resource.label).join(' ')),
          semester: number,
          href: `/trilha/disciplinas/${slug}/`,
        };
        semesterDisciplines.push(discipline);
        disciplines.push(discipline);
        continue;
      }

      const projectMatch = block.heading.match(/^Projeto Integrador\s+([IVX]+)\s*[-–]\s*(.*?)\s*[-–]\s*(\d+)\s*h$/i);
      if (projectMatch) {
        const roman = projectMatch[1].toUpperCase();
        const projectName = projectMatch[2].trim();
        const projectHours = Number(projectMatch[3]);
        const fields = collectFields(block.body);
        const delivery = cleanText(fields['entrega'] ?? '');
        if (!delivery) problems.push(`Projeto integrador sem entrega: ${projectName}`);
        const project: IntegratorProject = {
          id: `pi-${roman.toLowerCase()}`,
          roman,
          name: projectName,
          title: `Projeto Integrador ${roman} - ${projectName}`,
          slug: slugify(`projeto-integrador-${roman}-${projectName}`),
          semester: number,
          hours: projectHours,
          delivery,
          summary: '',
          technologies: deriveTechnologies(projectName, delivery),
          href: '/projetos/',
        };
        semesterProject = project;
        projectsBySemester.set(number, project);
        continue;
      }

      problems.push(`Bloco não reconhecido no ${number}º semestre: ${block.heading}`);
    }

    if (!semesterProject) problems.push(`Semestre ${number} sem projeto integrador`);

    semesters.push({
      number,
      title: semesterTitle,
      slug: `semestre-${number}`,
      hours,
      objective,
      criteria: null,
      disciplines: semesterDisciplines,
      project: semesterProject as IntegratorProject,
      href: `/trilha/#semestre-${number}`,
    });
  }

  semesters.sort((a, b) => a.number - b.number);

  // ---- Critérios para avançar ------------------------------------------------
  const criteriaBody = sections.get('Critérios para avançar de etapa') ?? [];
  const criteriaItems: { title: string; text: string }[] = [];
  for (const line of criteriaBody) {
    const item = line.match(/^\d+\.\s+\*\*(.+?):\*\*\s*(.*)$/);
    if (item) criteriaItems.push({ title: item[1].trim(), text: cleanText(item[2]) });
  }
  for (const semester of semesters) {
    semester.criteria = criteriaItems[semester.number - 1] ?? null;
  }

  // ---- Projetos integradores (seção resumo) ----------------------------------
  const projectsSection = splitBlocks(sections.get('Seis projetos integradores') ?? [], 3);
  for (const block of projectsSection) {
    const match = block.heading.match(/^PI\s+([IVX]+)\s*[-–]\s*(.*?)\s*\((\d)º\s*semestre\)$/i);
    if (!match) {
      problems.push(`Projeto da seção resumo não reconhecido: ${block.heading}`);
      continue;
    }
    const roman = match[1].toUpperCase();
    const shortName = match[2].trim();
    const semesterNumber = Number(match[3]);
    const project = projectsBySemester.get(semesterNumber);
    if (!project) {
      problems.push(`Projeto ${roman} não corresponde a um semestre`);
      continue;
    }
    if (project.roman !== roman) {
      problems.push(`Projeto ${roman} do resumo não corresponde ao semestre ${semesterNumber}`);
    }
    project.summary = cleanText(block.body.join(' '));
    project.name = shortName;
    project.technologies = deriveTechnologies(shortName, project.delivery, project.summary);
  }

  const projects = semesters.map((semester) => semester.project);

  // ---- Especializações -------------------------------------------------------
  const specializations: Specialization[] = [];
  for (const line of sections.get('Especializações opcionais - após o núcleo principal') ?? []) {
    const item = line.match(/^-\s+\*\*(.+?):\*\*\s*(.*)$/);
    if (!item) continue;
    const name = item[1].trim();
    const text = item[2].trim();
    const links = extractLinks(text, references, problems);
    specializations.push({
      id: slugify(name),
      name,
      description: cleanText(text.replace(/\s*\[[^\]]+\]\[[a-z0-9_]+\]\.?\s*$/gi, '')).trim(),
      resources: toResources(links),
      technologies: deriveTechnologies(name, text),
    });
  }

  // ---- Regras de desenvolvimento open source ---------------------------------
  const rulesBody = sections.get('Regras de desenvolvimento Open Source') ?? [];
  const developmentRules: DevelopmentRules = { items: [], flow: '' };
  for (const line of rulesBody) {
    const item = line.match(/^-\s+(.*)$/);
    if (item) developmentRules.items.push(cleanText(item[1]));
    const flow = line.match(/^\*\*Fluxo:\*\*\s*(.*)$/);
    if (flow) developmentRules.flow = cleanText(flow[1]);
  }

  // ---- Planejamento de dedicação ---------------------------------------------
  const studyPlans: StudyPlan[] = [];
  for (const line of sections.get('Planejamento de dedicação') ?? []) {
    const item = line.match(/^-\s+\*\*(.+?):\*\*\s*(\d+)h por semana\s*[-–]\s*(\d+)\s*semanas,\s*cerca de\s*([\d.,]+)\s*meses/i);
    if (item) {
      studyPlans.push({
        name: item[1].trim(),
        hoursPerWeek: Number(item[2]),
        weeks: Number(item[3]),
        months: item[4],
      });
    }
  }

  const meta: CurriculumMeta = {
    title,
    subtitle,
    version,
    totalHours,
    semesterCount: semesters.length,
    projectCount: projects.length,
    disciplineCount: disciplines.length,
    stack,
    language,
    distribution,
    principles,
    disclaimer,
  };

  const curriculum: Curriculum = {
    meta,
    semesters,
    disciplines,
    projects,
    specializations,
    studyPlans,
    developmentRules,
    references,
  };

  validateCurriculum(curriculum, problems);

  if (problems.length > 0) throw new CurriculumParseError(problems);
  return curriculum;
}

/** Validação de integridade — o build falha se qualquer regra for violada. */
export function validateCurriculum(curriculum: Curriculum, problems: string[] = []): string[] {
  const { meta, semesters, disciplines, projects, specializations } = curriculum;

  if (semesters.length !== 6) problems.push(`Esperados 6 semestres, encontrados ${semesters.length}`);
  if (projects.length !== 6) problems.push(`Esperados 6 projetos integradores, encontrados ${projects.length}`);
  if (meta.totalHours !== 2400) problems.push(`Carga horária total deveria ser 2.400h, encontrada ${meta.totalHours}h`);
  if (disciplines.length !== 45) problems.push(`Esperadas 45 disciplinas, encontradas ${disciplines.length}`);
  if (semesters.length !== meta.semesterCount) problems.push('semesterCount divergente da lista de semestres');
  if (projects.length !== meta.projectCount) problems.push('projectCount divergente da lista de projetos');
  if (disciplines.length !== meta.disciplineCount) problems.push('disciplineCount divergente da lista de disciplinas');

  const totalDisciplineHours = disciplines.reduce((total, discipline) => total + discipline.hours, 0);
  const totalProjectHours = projects.reduce((total, project) => total + project.hours, 0);
  if (totalDisciplineHours + totalProjectHours !== 2400) {
    problems.push(
      `Soma de disciplinas (${totalDisciplineHours}h) e projetos (${totalProjectHours}h) não fecha 2.400h`,
    );
  }

  const expectedNumbers = Array.from({ length: 45 }, (_, index) => index + 1);
  const actualNumbers = disciplines.map((discipline) => discipline.number).sort((a, b) => a - b);
  if (actualNumbers.join(',') !== expectedNumbers.join(',')) {
    problems.push('A numeração das disciplinas não é contínua de 1 a 45');
  }

  const slugs = new Set<string>();
  for (const discipline of disciplines) {
    if (slugs.has(discipline.slug)) problems.push(`Slug duplicado: ${discipline.slug}`);
    slugs.add(discipline.slug);
    if (!discipline.content) problems.push(`Disciplina ${discipline.number} sem ementa`);
    if (discipline.resources.length === 0 && discipline.notes.length === 0) {
      problems.push(`Disciplina ${discipline.number} sem materiais`);
    }
    if (discipline.hours <= 0) problems.push(`Disciplina ${discipline.number} com carga horária inválida`);
  }

  for (const semester of semesters) {
    const semesterTotal =
      semester.disciplines.reduce((total, discipline) => total + discipline.hours, 0) + semester.project.hours;
    if (semesterTotal !== 400) {
      problems.push(`${semester.number}º semestre soma ${semesterTotal}h em vez de 400h`);
    }
    if (semester.hours !== 400) problems.push(`${semester.number}º semestre declara ${semester.hours}h`);
    if (!semester.objective) problems.push(`${semester.number}º semestre sem objetivo`);
    if (!semester.project.delivery) problems.push(`${semester.number}º semestre sem entrega de projeto`);
  }

  if (specializations.length === 0) problems.push('Nenhuma especialização opcional encontrada');
  if (Object.keys(curriculum.references).length === 0) problems.push('Bloco de referências de links não encontrado');

  return problems;
}

/** Utilidades compartilhadas ------------------------------------------------- */
export function formatHours(hours: number): string {
  return `${hours.toLocaleString('pt-BR')}h`;
}

export function semesterLabel(semester: number): string {
  return `${semester}º semestre`;
}

export { slugify, cleanText };
