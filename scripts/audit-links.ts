#!/usr/bin/env tsx
/**
 * Auditoria de links do README.md e do site gerado.
 *
 * - Extrai todos os URLs do README
 * - Verifica status HTTP (HEAD/GET)
 * - Classifica: ok, redirect, blocked, auth, unverifiable, broken
 * - Gera relatório em .bananadev-work-#BananaDev/reports/link-audit.md
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const README_PATH = resolve(ROOT, 'README.md');
const WORK_DIR = resolve(ROOT, '../.bananadev-work-#BananaDev');
const REPORT_PATH = resolve(WORK_DIR, 'reports/link-audit.md');

interface LinkInfo {
  url: string;
  label: string;
  ref?: string;
  line?: number;
  source: 'readme' | 'site';
}

interface LinkResult extends LinkInfo {
  status: 'ok' | 'redirect' | 'blocked' | 'auth' | 'unverifiable' | 'broken';
  httpCode?: number;
  finalUrl?: string;
  error?: string;
}

const LINK_REF = /\[([^\[\]]+)\]\[([a-z0-9_]+)\]/gi;
const LINK_INLINE = /\[([^\[\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;
const REF_DEF = /^\[([a-z0-9_]+)\]:\s*(\S+)\s*$/im;

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 #BananaDev-LinkAuditor/1.0';

const BLOCKED_CODES = new Set([403, 429, 503]);
const AUTH_CODES = new Set([401, 403]);
const REDIRECT_CODES = new Set([301, 302, 303, 307, 308]);

async function checkUrl(url: string): Promise<{ status: LinkResult['status']; code?: number; finalUrl?: string; error?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (REDIRECT_CODES.has(response.status)) {
      return { status: 'redirect', code: response.status, finalUrl: response.headers.get('location') || undefined };
    }
    if (response.ok) return { status: 'ok', code: response.status };
    if (AUTH_CODES.has(response.status)) return { status: 'auth', code: response.status };
    if (BLOCKED_CODES.has(response.status)) return { status: 'blocked', code: response.status };
    return { status: 'broken', code: response.status };
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { status: 'unverifiable', error: 'Timeout' };
    }
    // Tenta GET se HEAD falhar (alguns servidores não suportam HEAD)
    try {
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(15000),
      });
      if (REDIRECT_CODES.has(response.status)) {
        return { status: 'redirect', code: response.status, finalUrl: response.headers.get('location') || undefined };
      }
      if (response.ok) return { status: 'ok', code: response.status };
      if (AUTH_CODES.has(response.status)) return { status: 'auth', code: response.status };
      if (BLOCKED_CODES.has(response.status)) return { status: 'blocked', code: response.status };
      return { status: 'broken', code: response.status };
    } catch {
      return { status: 'unverifiable', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

async function main() {
  console.log('🔍 Iniciando auditoria de links...');

  const readme = readFileSync(README_PATH, 'utf8');
  const lines = readme.split('\n');

  // 1. Coleta referências do bloco final
  const refs = new Map<string, string>();
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(REF_DEF);
    if (match) refs.set(match[1], match[2]);
  }

  // 2. Extrai links do corpo (antes do bloco de referências)
  const links: LinkInfo[] = [];
  let inRefBlock = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^<!-- Referências:/.test(line.trim())) {
      inRefBlock = true;
      continue;
    }
    if (inRefBlock) continue;

    // Links por referência [label][ref]
    for (const match of line.matchAll(LINK_REF)) {
      const [, label, ref] = match;
      const url = refs.get(ref);
      if (url) links.push({ url, label, ref, line: i + 1, source: 'readme' });
    }

    // Links inline [label](url)
    const withoutRefs = line.replace(LINK_REF, '');
    for (const match of withoutRefs.matchAll(LINK_INLINE)) {
      const [, label, url] = match;
      if (/^https?:\/\//.test(url)) links.push({ url, label, line: i + 1, source: 'readme' });
    }
  }

  console.log(`  Links únicos do README: ${links.length}`);

  // 3. Verifica cada link (com concorrência limitada)
  const results: LinkResult[] = [];
  const concurrency = 6;
  const queue = [...links];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const link = queue.shift();
      if (!link) break;
      const check = await checkUrl(link.url);
      results.push({ ...link, ...check });
      // Pequeno delay para não sobrecarregar
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await Promise.all(workers);

  // 4. Gera relatório
  mkdirSync(dirname(REPORT_PATH), { recursive: true });

  const byStatus = new Map<LinkResult['status'], LinkResult[]>();
  for (const r of results) {
    if (!byStatus.has(r.status)) byStatus.set(r.status, []);
    byStatus.get(r.status)!.push(r);
  }

  let md = `# Auditoria de Links — ${new Date().toISOString().split('T')[0]}\n\n`;
  md += `Total verificado: ${results.length}\n\n`;

  const statusOrder: LinkResult['status'][] = ['ok', 'redirect', 'blocked', 'auth', 'unverifiable', 'broken'];
  const statusLabels: Record<LinkResult['status'], string> = {
    ok: '✅ OK (2xx)',
    redirect: '↪️ Redirecionamento (3xx)',
    blocked: '🚫 Bloqueado (403/429/503)',
    auth: '🔐 Requer autenticação (401/403)',
    unverifiable: '❓ Não verificável (timeout/erro de rede)',
    broken: '❌ Quebrado (4xx/5xx sem categoria)',
  };

  for (const status of statusOrder) {
    const items = byStatus.get(status) || [];
    if (items.length === 0) continue;
    md += `## ${statusLabels[status]} (${items.length})\n\n`;
    for (const item of items) {
      md += `- **${item.label}** — \`${item.url}\``;
      if (item.line) md += ` (README linha ${item.line})`;
      if (item.httpCode) md += ` — HTTP ${item.httpCode}`;
      if (item.finalUrl) md += ` → ${item.finalUrl}`;
      if (item.error) md += ` — ${item.error}`;
      md += '\n';
    }
    md += '\n';
  }

  md += `---\n\n> **Nota**: Códigos 403/429 não indicam necessariamente link quebrado — podem ser proteção anti-bot, rate limiting ou acesso restrito. Verifique manualmente antes de substituir.\n`;

  writeFileSync(REPORT_PATH, md, 'utf8');
  console.log(`\n📄 Relatório salvo em: ${REPORT_PATH}`);

  // Resumo no console
  const broken = byStatus.get('broken')?.length || 0;
  const unverifiable = byStatus.get('unverifiable')?.length || 0;
  if (broken > 0 || unverifiable > 0) {
    console.log(`\n⚠️  ${broken} quebrado(s), ${unverifiable} não verificável(is). Revise o relatório.`);
    process.exitCode = 1;
  } else {
    console.log('\n✅ Todos os links verificados com sucesso.');
  }
}

main().catch((error) => {
  console.error('❌ Erro na auditoria:', error);
  process.exit(1);
});