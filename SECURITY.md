# Política de Segurança do #BananaDev

## Versões suportadas

Como o #BananaDev é uma aplicação estática sem back-end, banco de dados ou autenticação, não há versões com suporte de segurança prolongado. A versão publicada no `main` é a que recebe correções.

## Reportar uma vulnerabilidade

**Não abra issues públicas para vulnerabilidades de segurança.**

Envie um e-mail para **security@bananadev.local** (ou abra uma [Security Advisory privada](https://github.com/XjonathandebritoX/bananadev/security/advisories/new) no GitHub) com:

- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Sugestão de correção (se tiver)

Responderemos em até 7 dias úteis. Se confirmada, publicaremos a correção e creditaremos o relator (salvo pedido de anonimato).

## Escopo

Esta política cobre:

- O código-fonte da plataforma (`src/`, `scripts/`, `astro.config.mjs`, etc.)
- O processo de build e deploy (GitHub Actions, Cloudflare Pages)
- Dependências declaradas em `package.json`

**Não cobre:**

- Sites de terceiros linkados no currículo (YouTube, GitHub, documentações oficiais)
- Conteúdo gerado por usuários (não há — a plataforma não aceita input de usuários)
- O repositório como um todo (issues de segurança do GitHub são gerenciadas pelo GitHub)

## Práticas de segurança do projeto

- **Sem back-end**: não há API, banco de dados, autenticação ou sessões.
- **Sem cookies de rastreamento**: apenas `localStorage` para progresso e preferência de tema.
- **CSP**: headers de segurança configurados no deploy (ver `docs/DEPLOY.md`).
- **Dependências**: `npm audit` no CI; atualizações de segurança via Dependabot.
- **Conteúdo importado**: backups de progresso (JSON) são validados e sanitizados antes de aplicar.
- **Links externos**: abrem em nova aba com `rel="noopener noreferrer"`.

## Divulgação responsável

Agradecemos a pesquisadores que seguem divulgação responsável. Não oferecemos programa de bug bounty financeiro, mas creditamos publicamente (Hall of Fame no README) quem reportar vulnerabilidades válidas.

## Contato

- Security Advisory: https://github.com/XjonathandebritoX/bananadev/security/advisories
- E-mail: security@bananadev.local (redireciona para o mantenedor)