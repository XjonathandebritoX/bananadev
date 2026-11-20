# NOTICE — Créditos e licenças de terceiros

Este arquivo documenta os materiais de terceiros utilizados no projeto #BananaDev, suas licenças e os devidos créditos. O #BananaDev não reivindica direitos sobre esses materiais.

## Código-fonte e dependências diretas

| Pacote | Licença | Uso |
|--------|---------|-----|
| Astro | MIT | Framework do site |
| @astrojs/check | MIT | Typecheck no build |
| @astrojs/sitemap | MIT | Geração de sitemap |
| TypeScript | Apache-2.0 | Linguagem |
| Vitest | MIT | Testes unitários |
| Playwright | Apache-2.0 | Testes E2E |
| tsx | MIT | Execução de scripts TS |
| Unified / Remark | MIT | Processamento Markdown (parser curricular) |

## Fontes (SIL Open Font License 1.1)

| Fonte | Autor | Licença | Arquivo |
|-------|-------|---------|---------|
| Fraunces | The Fraunces Project Authors | SIL OFL 1.1 | `src/assets/fonts/fraunces-latin-var.woff2`, `fraunces-latin-var-italic.woff2` |
| Inter | The Inter Project Authors (Rasmus Andersson) | SIL OFL 1.1 | `src/assets/fonts/inter-latin-var.woff2` |

Textos das licenças: `licenses/OFL-Fraunces.txt`, `licenses/OFL-Inter.txt`.

## Ícones

Ícones SVG originais criados para o projeto (arquivo `src/components/Icon.astro`), inspirados no estilo [Lucide](https://lucide.dev/) (ISC License). Não são cópias diretas.

## Logo do #BananaDev

Arquivo: `public/brand/original/bananadev-logo.png`

Fornecido pelo responsável pelo projeto. Incluído conforme autorização e direitos sobre o arquivo original. Não coberto pela licença MIT/CC BY do projeto — direitos reservados ao autor da logo.

## Materiais curriculares (links externos)

O currículo referencia centenas de recursos públicos (playlists YouTube, documentações oficiais, repositórios GitHub, artigos). Cada link pertence ao seu autor/plataforma:

- **YouTube / Curso em Vídeo**: © Gustavo Guanabara / Curso em Vídeo
- **YouTube / Bóson Treinamentos**: © Bóson Treinamentos
- **YouTube / Programador Lhama**: © Programador Lhama
- **YouTube / UNIVESP / IFBA / USP**: © respectivas universidades
- **Documentações oficiais**: © respectivas fundações/projetos (Mozilla/MDN, PostgreSQL, React, FastAPI, Docker, Kubernetes, etc.)
- **GitHub / Microsoft Learn / AWS / Google**: © respectivas empresas
- **Refactoring Guru**: © Alexander Shvets
- **scikit-learn / pandas / NumPy**: © respectivos projetos (BSD-3)
- **Choose a License**: © GitHub (CC BY 4.0)

A lista completa de URLs está no `README.md` (bloco de referências) e em `src/data/curriculum.generated.json` (campo `references`).

**O #BananaDev não hospeda cópias desses materiais** — apenas organiza links públicos. Respeitamos os termos de cada plataforma.

## Ferramenta de benchmarking

- **Website-Downloader (Asimov Academy)**: https://github.com/asimov-academy/Website-Downloader
  - Usado localmente para captura de referências visuais
  - Licença: "Uso pessoal e educacional" (ver repositório)
  - Não incluído no build nem no deploy — permanece em `.bananadev-work-#BananaDev/tools/`

## Capturas de tela de referência

Armazenadas em `.bananadev-work-#BananaDev/screenshots/` e `.bananadev-work-#BananaDev/references/`. Uso exclusivo para pesquisa visual durante o desenvolvimento. Não distribuídas com o projeto.

---

**Dúvidas sobre licenciamento?** Abra uma issue no repositório ou consulte `SECURITY.md` para contato privado.