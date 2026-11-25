import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Garante que a CSP publicada em `_headers` autorize todos os scripts inline
 * executáveis emitidos pelo Astro. Sem isso, o tema e a navegação podem ser
 * bloqueados no site publicado, mesmo funcionando em desenvolvimento.
 */

const DIST = 'dist';
const HEADERS = join(DIST, '_headers');

const EXECUTABLE_TYPES = new Set(['', 'module', 'text/javascript', 'application/javascript']);

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (entry.endsWith('.html')) files.push(full);
  }
  return files;
}

function attribute(attrs: string, name: string): string | undefined {
  const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

if (!existsSync(HEADERS)) {
  console.error('❌ dist/_headers não encontrado. Execute `npm run build` antes da auditoria.');
  process.exit(1);
}

const headers = readFileSync(HEADERS, 'utf8');
const csp = headers
  .split(/\r?\n/)
  .find((line) => /^Content-Security-Policy:/i.test(line.trim()))
  ?.replace(/^Content-Security-Policy:\s*/i, '');

if (!csp) {
  console.error('❌ CSP não encontrada em dist/_headers.');
  process.exit(1);
}

const allowed = new Set([...csp.matchAll(/sha256-[A-Za-z0-9+/=]+/g)].map((match) => match[0]));
const hashes = new Map<string, string[]>();

for (const file of walk(DIST)) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1];
    const content = match[2];
    if (!content.trim() || attribute(attrs, 'src')) continue;
    const type = (attribute(attrs, 'type') ?? '').toLowerCase();
    if (!EXECUTABLE_TYPES.has(type)) continue;
    const hash = `sha256-${createHash('sha256').update(content).digest('base64')}`;
    const files = hashes.get(hash) ?? [];
    if (!files.includes(file)) files.push(file);
    hashes.set(hash, files);
  }
}

const missing = [...hashes].filter(([hash]) => !allowed.has(hash));

if (missing.length > 0) {
  console.error('❌ Scripts inline sem hash autorizado na CSP:');
  for (const [hash, files] of missing) {
    console.error(`  ${hash}`);
    console.error(`    encontrado em: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '…' : ''}`);
  }
  console.error('\nAtualize o script-src de public/_headers com os hashes acima.');
  process.exit(1);
}

const unused = [...allowed].filter((hash) => !hashes.has(hash));
if (unused.length > 0) {
  console.warn(`⚠️  Hashes na CSP sem script correspondente no build: ${unused.join(', ')}`);
}

console.log(
  `✅ CSP válida: ${hashes.size} script(s) inline autorizado(s) em ${walk(DIST).length} página(s).`,
);
