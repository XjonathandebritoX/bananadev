# Guia de Deploy — #BananaDev

Este documento descreve o processo de deploy verificado para o #BananaDev.

## Visão geral

- **Tipo**: Site estático (Astro `output: "static"`)
- **Build**: `npm run build` → gera pasta `dist/`
- **Branches**: `main` = produção; PRs = preview
- **Deploy automático**: GitHub Actions → Cloudflare Pages (preferencial) ou GitHub Pages

---

## Opção A: Cloudflare Pages (recomendado)

### Por que Cloudflare Pages

- Deploy nativo de sites estáticos
- Preview automático em PRs
- HTTPS, CDN global, headers de segurança
- Gratuito para projetos pessoais/open source
- Integração direta com GitHub (Git integration)

### Pré-requisitos

1. Conta no [Cloudflare](https://dash.cloudflare.com/)
2. Repositório GitHub público: `XjonathandebritoX/bananadev`
3. Permissão para instalar o **Cloudflare Pages GitHub App** no repositório/organização

### Configuração (uma vez)

1. Acesse https://dash.cloudflare.com/pages
2. Clique em **"Connect to Git"** → **GitHub**
3. Autorize o Cloudflare Pages App no repositório `XjonathandebritoX/bananadev` (ou na organização)
4. Selecione o repositório `bananadev`
5. Configuração do build:
   - **Framework preset**: `Astro`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: (vazio — raiz do repo)
   - **Environment variables** (opcional):
     - `SITE_URL`: `https://bananadev.pages.dev` (ou seu domínio customizado)
     - `BASE_PATH`: `/` (ou `/bananadev` se usar subpath)
6. Clique em **Save and Deploy**

### Deploy automático

- **Push na `main`** → deploy de produção em `https://bananadev.pages.dev` (ou domínio customizado)
- **Pull Request** → preview deploy em `https://<hash>.bananadev.pages.dev`
- **Rollback**: no painel do Cloudflare Pages, clique em "Retry deployment" ou promova um preview anterior

### Domínio customizado (opcional)

1. No painel do projeto Pages → **Custom domains** → **Set up a custom domain**
2. Exemplo: `bananadev.dev` ou `ads.bananadev.dev`
3. Configure DNS (CNAME para `<project>.pages.dev` ou A/AAAA para Cloudflare)
4. HTTPS automático (certificado gerenciado)

### Headers de segurança (configurados via `_headers` ou painel)

O build já gera `dist/_headers` se você criar `public/_headers`:

```text
# public/_headers (copiado para dist/)
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'
```

> **Nota**: O CSP acima permite `'unsafe-inline'` para scripts/estilos inline do Astro. Ajuste se remover inline scripts.

---

## Opção B: GitHub Pages (fallback)

Use apenas se Cloudflare Pages não estiver disponível.

### Configuração

1. No repositório GitHub: **Settings** → **Pages**
2. **Source**: `GitHub Actions`
3. Crie `.github/workflows/deploy.yml` (ver abaixo)

### Workflow `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci --no-audit --no-fund
      - name: Validate curriculum
        run: npm run curriculum:check
      - name: Build
        run: npm run build
        env:
          SITE_URL: https://xjonathandebritoX.github.io
          BASE_PATH: /bananadev
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### URL resultante

`https://xjonathandebritoX.github.io/bananadev/`

> **Importante**: O `BASE_PATH: /bananadev` deve corresponder ao nome do repositório. O `astro.config.mjs` já lê `BASE_PATH` do ambiente.

---

## Variáveis de ambiente de build

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `SITE_URL` | `https://xjonathandebritoX.github.io` | URL base do site (usada em canonical, OG, sitemap) |
| `BASE_PATH` | `/bananadev` | Subpath do deploy (vazio para raiz de domínio) |

No Cloudflare Pages, configure em **Settings → Environment variables**.
No GitHub Actions, defina no step `Build` (ver workflow acima).

---

## Checklist de pré-deploy

Antes de fazer push na `main`:

- [ ] `npm run curriculum:check` passa (README e dados sincronizados)
- [ ] `npm run check` passa (typecheck + astro check)
- [ ] `npm run test` passa (testes unitários)
- [ ] `npm run build` gera `dist/` sem erros
- [ ] `npm run test:e2e` passa (opcional, mas recomendado)
- [ ] `npm run audit:links` roda sem erros críticos
- [ ] Preview local (`npm run preview`) funciona
- [ ] Teste manual: home, trilha, busca, progresso, temas, mobile

---

## Pós-deploy

Após o deploy (Cloudflare ou GitHub Pages):

1. Acesse a URL de produção
2. Teste:
   - [ ] Home carrega com logo, hero, stats, CTA
   - [ ] Trilha: 6 semestres, 45 disciplinas, busca/filtros
   - [ ] Página de disciplina abre com ementa, materiais, progresso
   - [ ] Progresso: marcar disciplina → recarregar → persiste
   - [ ] Exportar/importar JSON de progresso
   - [ ] Tema claro/escuro/sistema + persistência
   - [ ] Responsividade (320px, 768px, 1440px)
   - [ ] Navegação por teclado (Tab, Enter, Escape)
   - [ ] Links externos abrem em nova aba (`rel="noopener noreferrer"`)
   - [ ] Sitemap.xml e robots.txt acessíveis
   - [ ] 404 page amigável

---

## Rollback

### Cloudflare Pages

Painel → **Deployments** → clique nos três pontos de um deploy anterior → **Promote to production**.

### GitHub Pages

Reverter o commit na `main` (`git revert <sha> && git push`) → novo deploy automático.

---

## Monitoramento

- **Cloudflare Analytics** (painel Pages → Analytics): requests, bandwidth, erros
- **GitHub Actions**: aba Actions → histórico de workflows
- **Lighthouse CI** (opcional): adicione step no workflow para rodar `lighthouse-ci` no preview URL

---

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| Build falha "Could not resolve" | Import path errado | Verifique `../../` vs `../../../` em subdiretórios; use alias `@/` |
| CSS não carrega | `BASE_PATH` incorreto | Confira `BASE_PATH` no env de build = subpath do deploy |
| Imagens 404 | Assets não copiados | Verifique `public/` → `dist/` (Astro copia automaticamente) |
| Tema não persiste | CSP bloqueia inline script | Ajuste `Content-Security-Policy` para permitir `'unsafe-inline'` em `script-src` |
| Sitemap com URLs erradas | `SITE_URL`/`BASE_PATH` | Defina corretamente no env de build |
| Preview PR não funciona | Cloudflare App não instalado | Instale o Cloudflare Pages GitHub App na org/repo |

---

## Referências

- [Cloudflare Pages docs](https://developers.cloudflare.com/pages/)
- [Astro deploy guide](https://docs.astro.build/en/guides/deploy/)
- [GitHub Pages + Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#publishing-with-a-custom-github-actions-workflow)