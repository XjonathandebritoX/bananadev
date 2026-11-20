import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parseCurriculum } from './parse';
import type { Curriculum } from './types';

/**
 * Resolve o caminho do README.md de forma robusta.
 * Tenta múltiplas estratégias: import.meta.url (dev), process.cwd() (build), e procura por package.json.
 */
function findReadmePath(): string {
  // Estratégia 1: relativo ao arquivo atual (funciona em dev)
  const here = dirname(fileURLToPath(import.meta.url));
  const candidate1 = resolve(here, '../../../README.md');
  if (existsSync(candidate1)) return candidate1;

  // Estratégia 2: process.cwd() (funciona no build)
  const candidate2 = resolve(process.cwd(), 'README.md');
  if (existsSync(candidate2)) return candidate2;

  // Estratégia 3: procurar subindo a partir de cwd
  let searchDir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = resolve(searchDir, 'README.md');
    if (existsSync(candidate)) return candidate;
    searchDir = dirname(searchDir);
  }

  // Fallback: retornar o primeiro candidato (vai falhar com erro claro)
  return candidate1;
}

export const README_PATH = findReadmePath();

let cached: Curriculum | null = null;

export function readReadme(): string {
  return readFileSync(README_PATH, 'utf8');
}

/**
 * Carrega e valida o currículo a partir do README.md.
 * O resultado é memoizado durante o build.
 */
export function getCurriculum(): Curriculum {
  if (!cached) cached = parseCurriculum(readReadme());
  return cached;
}
