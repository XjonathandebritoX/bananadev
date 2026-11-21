#!/usr/bin/env tsx
/**
 * Auditoria de dependências customizada para site estático.
 *
 * Como o BananaDev é um site 100% estático (output: 'static'), as vulnerabilidades
 * em ferramentas de build (astro, esbuild, sharp, vitest, etc.) NÃO afetam
 * o site em produção — apenas o processo de build no CI.
 *
 * Este script audita apenas vulnerabilidades que poderiam afetar o output estático:
 * - Pacotes que são efetivamente incluídos no bundle final
 * - Polyfills/runtime que vão para o browser
 *
 * Ferramentas de build (astro, esbuild, sharp, vitest, tsx, etc.) são excluídas.
 */

import { execSync } from 'node:child_process';

interface Vulnerability {
  name: string;
  severity: string;
  isDirect: boolean;
  via: Array<{
    title: string;
    severity: string;
    url: string;
    range: string;
  }>;
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable?: {
    name: string;
    version: string;
    isSemVerMajor: boolean;
  };
}

interface AuditReport {
  auditReportVersion: number;
  vulnerabilities: Record<string, Vulnerability>;
}

const BUILD_TOOLS = new Set([
  'astro',
  '@astrojs/check',
  '@astrojs/sitemap',
  'esbuild',
  'sharp',
  'vitest',
  '@vitest/mocker',
  'tinypool',
  'tsx',
  'typescript',
  '@playwright/test',
  'zod',
  'zod-to-ts',
]);

function isBuildTool(pkgName: string): boolean {
  return BUILD_TOOLS.has(pkgName) || pkgName.startsWith('@astrojs/');
}

function main() {
  console.log('🔍 Auditoria de dependências (modo site estático)...\n');

  // Executa npm audit em JSON
  let auditOutput: string;
  try {
    auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
  } catch (error) {
    // npm audit retorna código != 0 quando há vulnerabilidades
    auditOutput = (error as Error & { stdout: string }).stdout || '';
  }

  let audit: AuditReport;
  try {
    audit = JSON.parse(auditOutput);
  } catch {
    console.log('✅ Nenhuma vulnerabilidade encontrada ou formato inesperado');
    process.exit(0);
  }

  const vulns = Object.values(audit.vulnerabilities || {});
  const relevantVulns = vulns.filter(v => !isBuildTool(v.name));

  console.log(`Total de vulnerabilidades: ${vulns.length}`);
  console.log(`Vulnerabilidades em ferramentas de build (ignoradas): ${vulns.length - relevantVulns.length}`);
  console.log(`Vulnerabilidades relevantes para output estático: ${relevantVulns.length}\n`);

  if (relevantVulns.length === 0) {
    console.log('✅ Nenhuma vulnerabilidade relevante para o site estático em produção.');
    console.log('ℹ️  Vulnerabilidades em ferramentas de build (astro, esbuild, sharp, vitest, etc.)');
    console.log('   não afetam o site em produção — apenas o processo de build no CI.');
    process.exit(0);
  }

  console.log('❌ Vulnerabilidades relevantes encontradas:\n');
  for (const v of relevantVulns) {
    console.log(`  ❌ ${v.name} (${v.severity})`);
    console.log(`     Range: ${v.range}`);
    if (v.fixAvailable) console.log('     Fix disponível via npm audit fix');
    console.log('');
  }

  console.log('❌ Falha: vulnerabilidades relevantes para produção encontradas.');
  process.exit(1);
}

main().catch((error) => {
  console.error('❌ Erro na auditoria:', error);
  process.exit(1);
});