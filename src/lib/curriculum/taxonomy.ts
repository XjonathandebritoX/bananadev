/**
 * Taxonomia editorial de tecnologias.
 *
 * Não substitui a matriz curricular: apenas deriva etiquetas de navegação a
 * partir do texto que já existe no README. Nenhum tópico é inventado.
 */
export interface TechTag {
  id: string;
  label: string;
  pattern: RegExp;
}

export const TECH_TAGS: TechTag[] = [
  { id: 'python', label: 'Python', pattern: /\bpython\b|\bpytest\b|\bpandas\b|\bfastapi\b|\bscikit-learn\b|\bsqlalchemy\b/i },
  { id: 'javascript', label: 'JavaScript', pattern: /\bjavascript\b|\becmascript\b|\bjsx\b|\bdom\b|\bnode\.js\b/i },
  { id: 'typescript', label: 'TypeScript', pattern: /\btypescript\b/i },
  { id: 'react', label: 'React', pattern: /\breact\b/i },
  { id: 'web', label: 'HTML e CSS', pattern: /\bhtml5?\b|\bcss3?\b|\bflexbox\b|\bgrid\b|\bresponsividade\b|\bacessibilidade\b|\bweb\b/i },
  { id: 'fastapi', label: 'FastAPI', pattern: /\bfastapi\b|\bpydantic\b|\balembic\b/i },
  { id: 'sql', label: 'SQL', pattern: /\bsql\b|\bddl\b|\bdml\b|\bconsultas\b|\bpostgresql\b/i },
  { id: 'database', label: 'Banco de dados', pattern: /\bbanco de dados\b|\bsgbd\b|\bmodelagem\b|\bnormalização\b|\bentidade-relacionamento\b|\bmongodb\b|\bredis\b/i },
  { id: 'linux', label: 'Linux', pattern: /\blinux\b|\bbash\b|\bshell\b|\bterminal\b|\bsystemd\b|\bssh\b|\bprocessos\b/i },
  { id: 'git', label: 'Git e GitHub', pattern: /\bgit\b|\bgithub\b|\bcommits?\b|\bpull requests?\b|\bversionamento\b/i },
  { id: 'networks', label: 'Redes', pattern: /\bredes de computadores\b|\btcp\/ip\b|\bdns\b|\bhttp\b|\bfundamentos de roteamento\b|\bosi\b/i },
  { id: 'api', label: 'APIs', pattern: /\bapis?\b|\brest\b|\bopenapi\b|\bswagger\b|\bpostman\b|\binsomnia\b/i },
  { id: 'tests', label: 'Testes', pattern: /\btestes?\b|\btdd\b|\bpytest\b|\bplaywright\b|\bvitest\b|\bcobertura\b/i },
  { id: 'security', label: 'Segurança', pattern: /\bsegurança\b|\bowasp\b|\bxss\b|\bcsrf\b|\bcriptografia\b|\blgpd\b/i },
  { id: 'docker', label: 'Docker', pattern: /\bdocker\b|\bcontainers?\b|\bcompose\b/i },
  { id: 'cloud', label: 'Cloud', pattern: /\bcloud\b|\bnuvem\b|\baws\b|\bvirtualização\b|\bpaas\b|\biaas\b/i },
  { id: 'devops', label: 'CI/CD e DevOps', pattern: /\bci\/cd\b|\bgithub actions\b|\bdevops\b|\bpipelines?\b|\bdeploy\b/i },
  { id: 'architecture', label: 'Arquitetura', pattern: /\barquitetura\b|\bsolid\b|\bclean code\b|\bpadrões de projeto\b|\bmicrosserviços\b|\bdistribuídos\b/i },
  { id: 'data', label: 'Dados e IA', pattern: /\binteligência artificial\b|\bmachine learning\b|\bengenharia de dados\b|\betl\b|\bálgebra linear\b|\bestatística\b|\bpandas\b/i },
  { id: 'messaging', label: 'Mensageria', pattern: /\bmensageria\b|\brabbitmq\b|\bkafka\b|\bfilas?\b/i },
  { id: 'observability', label: 'Observabilidade', pattern: /\bobservabilidade\b|\bprometheus\b|\bgrafana\b|\bopentelemetry\b|\btracing\b/i },
  { id: 'ux', label: 'UX/UI', pattern: /\bux\/ui\b|\busabilidade\b|\bihc\b|\bfigma\b|\bprotótipo\b|\bprotótipos\b/i },
  { id: 'engineering', label: 'Engenharia de Software', pattern: /\bengenharia de software\b|\brequisitos\b|\buml\b|\bbpmn\b|\bscrum\b|\bkanban\b/i },
  { id: 'opensource', label: 'Open source', pattern: /\bopen source\b|\blicen[çc]as?\b|\bcontribuição\b/i },
  { id: 'computing', label: 'Fundamentos de computação', pattern: /\balgoritmos?\b|\bestruturas? de dados\b|\barquitetura e organização\b|\bcomputacional\b|\bmatemática discreta\b/i },
];

/** Deriva etiquetas de tecnologia a partir de um texto. */
export function deriveTechnologies(...texts: (string | undefined | null)[]): string[] {
  const haystack = texts.filter(Boolean).join(' \n ');
  return TECH_TAGS.filter((tag) => tag.pattern.test(haystack)).map((tag) => tag.id);
}

export function techLabel(id: string): string {
  return TECH_TAGS.find((tag) => tag.id === id)?.label ?? id;
}
