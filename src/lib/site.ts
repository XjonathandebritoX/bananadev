/**
 * Identidade e configuração institucional do BananaDev.
 * Todos os links internos passam por `url()` para respeitar a base de deploy.
 */

export const SITE = {
  name: 'BananaDev',
  fullName: '#BananaDev',
  subtitle: 'Formação autodidata em Análise e Desenvolvimento de Sistemas',
  description:
    'Plataforma educacional open source com uma formação autodidata completa de 2.400 horas em Análise e Desenvolvimento de Sistemas: seis semestres, 45 disciplinas, materiais gratuitos e seis projetos integradores.',
  mission:
    'Democratizar o acesso ao conhecimento em tecnologia, mostrando que aprender, construir e compartilhar software está ao alcance de quem começa.',
  repo: 'https://github.com/XjonathandebritoX/bananadev',
  repoGit: 'https://github.com/XjonathandebritoX/bananadev.git',
  issues: 'https://github.com/XjonathandebritoX/bananadev/issues',
  pulls: 'https://github.com/XjonathandebritoX/bananadev/pulls',
  license: 'MIT',
  contentLicense: 'CC BY 4.0',
  author: 'BananaDev contributors',
} as const;

export const NAV = [
  { href: '/', label: 'Início' },
  { href: '/trilha/', label: 'Trilha' },
  { href: '/projetos/', label: 'Projetos' },
  { href: '/especializacoes/', label: 'Especializações' },
  { href: '/recursos/', label: 'Recursos' },
  { href: '/manifesto/', label: 'Manifesto' },
  { href: '/sobre/', label: 'Sobre' },
] as const;

export const FOOTER_NAV = [
  {
    title: 'Formação',
    links: [
      { href: '/trilha/', label: 'Matriz curricular' },
      { href: '/projetos/', label: 'Projetos integradores' },
      { href: '/especializacoes/', label: 'Especializações' },
      { href: '/recursos/', label: 'Recursos e ferramentas' },
    ],
  },
  {
    title: 'Projeto',
    links: [
      { href: '/sobre/', label: 'Sobre o BananaDev' },
      { href: '/manifesto/', label: 'Manifesto' },
      { href: '/progresso/', label: 'Meu progresso' },
      { href: '/privacidade/', label: 'Privacidade e dados' },
    ],
  },
] as const;

export const STATUS_LABEL = {
  'not-started': 'Não iniciada',
  'in-progress': 'Em andamento',
  completed: 'Concluída',
} as const;

/**
 * Prefixa caminhos internos com a base de publicação.
 * Em produção no GitHub Pages a base é `/bananadev`.
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!path.startsWith('/')) return `${base}/${path}`;
  return `${base}${path}` || '/';
}

export function absoluteUrl(path: string): string {
  const site = import.meta.env.SITE ?? 'https://xjonathandebritoX.github.io';
  return new URL(url(path), site).toString();
}

export const OG_IMAGE = '/og.png';
