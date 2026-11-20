# Guia de Desenvolvimento — BananaDev

Este documento explica como configurar, executar, testar e manter o projeto localmente.

## Estrutura do projeto

```
BananaDev/
├── public/                 # Assets estáticos copiados para dist/
│   ├── brand/              # Logo, favicons, og.png, manifest.webmanifest
│   └── fonts/              # (vazio — fontes ficam em src/assets/fonts/)
├── src/
│   ├── assets/fonts/       # Fontes locais (Fraunces, Inter) — SIL OFL 1.1
│   ├── components/         # Componentes Astro reutilizáveis
│   ├── layouts/            # BaseLayout.astro (HTML shell, SEO, header/footer)
│   ├── lib/
│   │   ├── curriculum/     # Parser, tipos, taxonomia, loader do README
│   │   ├── progress/       # Store de progresso (localStorage)
│   │   ├── search.ts       # Busca e filtros client-side
│   │   ├── resources.ts    # Metadados de recursos
│   │   └── site.ts         # Configuração institucional, URLs
│   ├── pages/              # Rotas (file-based routing)
│   │   ├── index.astro     # Home
│   │   ├── trilha/         # Matriz curricular + páginas de disciplina
│   │   ├── projetos/       # Projetos integradores
│   │   ├── especializacoes.astro
│   │   ├── recursos.astro
│   │   ├── manifesto.astro
│   │   ├── sobre.astro
│   │   ├── progresso.astro
│   │   ├── privacidade.astro
│   │   └── 404.astro
│   ├── scripts/            # Módulos client-side (ESM)
│   │   ├── nav.ts          # Menu mobile, tema, back-to-top
│   │   ├── theme.ts        # Alternância claro/escuro/sistema
│   │   ├── progress-ui.ts  # UI de progresso (disciplinas, projetos)
│   │   ├── progresso.ts    # Página /progresso (export/import/clear)
│   │   └── trilha.ts       # Busca/filtros na trilha
│   └── styles/
│       └── global.css      # Design system completo (tokens, componentes)
├── scripts/
│   └── generate-curriculum.ts  # Gera src/data/curriculum.generated.json a partir do README
├── .bananadev-work-BananaDev/  # (fora do repo) Ambiente isolado: node_modules, caches, ferramentas
├── astro.config.mjs
├── tsconfig.json
├── vitest.config.ts
├── package.json
├── README.md               # Fonte curricular — NÃO EDITE os dados manualmente
├── LICENSE                 # MIT (código)
├── CONTENT-LICENSE         # CC BY 4.0 (conteúdo curricular)
├── CONTRIBUTING.md
├── SECURITY.md
├── CODE_OF_CONDUCT.md
├── NOTICE.md
└── docs/
    ├── DEVELOPMENT.md      # Este arquivo
    └── DEPLOY.md
```

## Ferramentas necessárias

- **Node.js** ≥ 20.3.0 (recomendado: usar [Volta](https://volta.sh/) ou [fnm](https://github.com/Schniz/fnm))
- **npm** (vem com Node) — cache isolado em `.bananadev-work-BananaDev/cache/npm`
- **Git**
- **Python 3.11+** e **uv** (opcional, só para rodar o Website-Downloader localmente)

## Configuração inicial

```bash
# 1. Clone o repositório
git clone https://github.com/XjonathandebritoX/bananadev.git
cd bananadev

# 2. Crie/ative o ambiente isolado (uma vez por máquina)
mkdir -p ../.bananadev-work-BananaDev/npm-env
cp package.json ../.bananadev-work-BananaDev/npm-env/
cd ../.bananadev-work-BananaDev/npm-env
npm install --no-audit --no-fund
cd ../../bananadev

# 3. Link do node_modules isolado
ln -sfn ../.bananadev-work-BananaDev/npm-env/node_modules node_modules
cp ../.bananadev-work-BananaDev/npm-env/package-lock.json package-lock.json

# 4. Verifique
npm run curriculum:check   # valida README vs dados gerados
npm run check              # typecheck + astro check
```

> **Importante**: O `node_modules` fica **fora do repositório** (em `.bananadev-work-BananaDev/`). O link simbólico `node_modules -> ../.bananadev-work-BananaDev/npm-env/node_modules` resolve os módulos sem versionar dependências.

## Comandos principais

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (Astro) |
| `npm run build` | Build de produção (inclui `curriculum:check`) |
| `npm run preview` | Preview do build de produção |
| `npm run curriculum:generate` | Gera `src/data/curriculum.generated.json` a partir do README |
| `npm run curriculum:check` | Valida se o README e os dados gerados estão sincronizados |
| `npm run check` | TypeScript strict + `astro check` |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes E2E (Playwright) |
| `npm run test:all` | Pipeline completo: test + build + test:e2e |
| `npm run audit:links` | Auditoria de links do README e do site |

## Fluxo de atualização do currículo

1. Edite o `README.md` (matriz curricular).
2. Rode `npm run curriculum:generate` — isso:
   - Parsing do README
   - Validação de integridade (6 semestres, 45 disciplinas, 2.400h, 6 projetos)
   - Gera `src/data/curriculum.generated.json`
   - Gera `src/data/progress.generated.json` (índice para progresso)
3. Verifique o output no terminal (contadores de disciplinas, horas, links).
4. Commit **ambos** os arquivos: `README.md` + `src/data/*.generated.json`.
5. O CI falha se `curriculum:check` detectar divergência.

> **Regra de ouro**: Nunca edite `src/data/curriculum.generated.json` à mão. Ele é gerado e validado automaticamente.

## Adicionar/alterar uma disciplina

1. Edite o `README.md` na seção do semestre correspondente.
2. Mantenha o formato:
   ```markdown
   ### N. Nome da Disciplina - XXh
   **Conteúdo:** ementa...
   **Materiais:** [Rótulo][ref] e [Outro][ref2].
   ```
3. Adicione a referência no bloco final do README:
   ```markdown
   [ref]: https://url.com
   ```
4. Rode `npm run curriculum:generate` e confira se a disciplina aparece com número, horas, ementa, recursos e tecnologias corretas.

## Alterar a logo

1. Substitua `public/brand/original/bananadev-logo.png` (mantendo proporção 1:1, transparência, PNG).
2. Rode o script de geração de assets:
   ```bash
   cd ../.bananadev-work-BananaDev
   python3 tools/gen-assets.py
   ```
3. Gere o OG image:
   ```bash
   cd tools/Website-Downloader
   uv run python ../gen-og.py
   ```
4. Verifique se `public/brand/logo-256.png`, `logo-512.png`, `icon-*`, `favicon.ico`, `og.png` foram atualizados.
5. Commit.

## Atualizar cores/tokens de design

Edite `src/styles/global.css` — seção `:root` (tokens de cor, espaçamento, tipografia, sombras).

- Cores da marca derivadas da logo: `--yellow-500` (principal), `--yellow-100`..`--yellow-700` (escala).
- Tema escuro: `:root[data-theme='dark']` e `@media (prefers-color-scheme: dark)`.
- Teste ambos os temas (`npm run dev` + toggle no header) e responsividade.

## Testes

### Unitários (Vitest)

```bash
npm run test
```

Arquivos em `tests/unit/**/*.test.ts`. Cobrem:
- Parser curricular (`parse.ts`)
- Busca e filtros (`search.ts`)
- Store de progresso (`store.ts`)

### E2E (Playwright)

```bash
npm run test:e2e
```

Requer build prévio (`npm run build`). Testam:
- Navegação principal
- Busca/filtros na trilha
- Progresso (marcar, persistir, exportar/importar)
- Tema claro/escuro
- Responsividade (mobile/desktop)
- Acessibilidade básica

## Debugging

- **Astro dev server**: `npm run dev` → http://localhost:4321
- **Logs do parser**: `npm run curriculum:generate` mostra contadores e warnings.
- **Typecheck**: `npm run check` (roda `astro check` + `tsc --noEmit`).
- **Console do navegador**: erros de hydration, CSP, scripts.

## Problemas conhecidos

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `ENOENT: README.md` no build | Working directory diferente | `load.ts` usa `findReadmePath()` com múltiplas estratégias |
| Import "Could not resolve" | Caminho relativo errado em subdiretório | Use `../../` ou alias `@/` (configurado no `astro.config.mjs`) |
| Estilos não aplicados | Cache do Vite | `rm -rf node_modules/.vite dist && npm run dev` |
| Tema não persiste | `localStorage` bloqueado (modo privado) | Funcionalidade degrada graciosamente — sem erro |

## Contribuindo

Veja `CONTRIBUTING.md` para o fluxo completo (issue → branch → commit → PR → review → merge).

## Licenças

- Código: `LICENSE` (MIT)
- Conteúdo curricular: `CONTENT-LICENSE` (CC BY 4.0)
- Fontes: `licenses/OFL-*.txt` (SIL OFL 1.1)
- Créditos de terceiros: `NOTICE.md`