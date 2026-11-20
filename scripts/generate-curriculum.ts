#!/usr/bin/env tsx
/**
 * Gera `src/data/curriculum.generated.json` a partir do README.md.
 *
 * - `tsx scripts/generate-curriculum.ts`        gera o arquivo
 * - `tsx scripts/generate-curriculum.ts --check` valida sem gravar (usado no build)
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCurriculum, CurriculumParseError } from '../src/lib/curriculum/parse';
import { README_PATH } from '../src/lib/curriculum/load';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'src/data/curriculum.generated.json');
const progressIndexOutput = resolve(root, 'src/data/progress.generated.json');
const check = process.argv.includes('--check');

function main(): void {
  let curriculum;
  try {
    curriculum = parseCurriculum(readFileSync(README_PATH, 'utf8'));
  } catch (error) {
    if (error instanceof CurriculumParseError) {
      console.error(`\n❌ ${error.message}\n`);
      process.exit(1);
    }
    throw error;
  }

  const json = `${JSON.stringify(curriculum, null, 2)}\n`;
  const disciplineHours = curriculum.disciplines.reduce((total, discipline) => total + discipline.hours, 0);

  console.log('📚 Currículo extraído do README.md');
  console.log(`   semestres: ${curriculum.semesters.length}`);
  console.log(`   disciplinas: ${curriculum.disciplines.length} (${disciplineHours}h)`);
  console.log(`   projetos integradores: ${curriculum.projects.length}`);
  console.log(`   especializações: ${curriculum.specializations.length}`);
  console.log(`   carga horária total: ${curriculum.meta.totalHours}h`);
  console.log(`   links preservados: ${curriculum.references ? Object.keys(curriculum.references).length : 0}`);

  if (check) {
    if (!existsSync(output)) {
      console.error('\n❌ src/data/curriculum.generated.json ausente. Rode `npm run curriculum:generate`.');
      process.exit(1);
    }
    const current = readFileSync(output, 'utf8');
    if (current !== json) {
      console.error('\n❌ Dados curriculares desatualizados em relação ao README.md.');
      console.error('   Rode `npm run curriculum:generate` e faça commit do resultado.\n');
      process.exit(1);
    }
    console.log('\n✅ Dados curriculares validados e sincronizados com o README.md\n');
    return;
  }

  const progressIndex = {
    totalHours: curriculum.meta.totalHours,
    disciplines: curriculum.disciplines.map((discipline) => ({
      id: discipline.id,
      hours: discipline.hours,
      semester: discipline.semester,
    })),
    projects: curriculum.projects.map((project) => ({ id: project.id, hours: project.hours })),
  };

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, json, 'utf8');
  writeFileSync(progressIndexOutput, `${JSON.stringify(progressIndex)}\n`, 'utf8');
  console.log(`\n✅ Gerado ${output}\n`);
}

main();
