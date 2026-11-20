# Como contribuir com o BananaDev

Obrigado por querer contribuir! O BananaDev é um projeto educacional open source mantido pela comunidade. Toda ajuda é bem-vinda: correções de links, melhorias de acessibilidade, novos materiais verificados, traduções, ajustes na plataforma, revisão de pull requests.

## Antes de começar

- Leia o [Código de Conduta](CODE_OF_CONDUCT.md).
- Verifique se já existe uma [issue](https://github.com/XjonathandebritoX/bananadev/issues) ou [pull request](https://github.com/XjonathandebritoX/bananadev/pulls) relacionada.
- Para mudanças maiores, abra uma issue primeiro para discutir a abordagem.

## Tipos de contribuição

### 1. Correções no currículo (README.md)

O README.md é a **fonte de verdade** do currículo. Qualquer alteração em disciplinas, ementas, carga horária, links ou projetos deve ser feita lá.

- Não altere a estrutura das tabelas/seções sem discutir.
- Mantenha os 6 semestres, 45 disciplinas, 2.400h e 6 projetos integradores.
- Novos links devem apontar para recursos públicos, gratuitos e em português quando possível.
- Execute `npm run curriculum:generate` após editar o README para validar a extração.

### 2. Correções de links

- Links quebrados: abra uma issue com o link, a disciplina e o erro observado.
- Não substitua links válidos sem verificar o conteúdo correspondente.
- Para cada link substituído, registre no PR: link anterior, motivo, link novo, identificação do conteúdo.

### 3. Melhorias na plataforma (código)

- Acesse o código em `src/`.
- Siga o estilo existente (TypeScript estrito, CSS com design tokens, componentes Astro).
- Execute `npm run check` e `npm run test` antes de enviar.
- Teste responsividade (320px a 1920px) e tema escuro/claro.

### 4. Acessibilidade

- WCAG 2.2 AA é o padrão mínimo.
- Teste com leitor de tela (NVDA, VoiceOver) e navegação por teclado.
- Respeite `prefers-reduced-motion`.

### 5. Traduções

- O projeto é em PT-BR. Traduções para outros idiomas são bem-vindas como issues/PRs separados.

## Fluxo de trabalho

1. **Issue** → descreva o problema ou a melhoria.
2. **Branch** → `git checkout -b tipo/descricao-curta` (ex: `fix/link-quebrado-python`, `feat/busca-avancada`).
3. **Commit** → use [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/):
   - `fix:` correções
   - `feat:` novas funcionalidades
   - `docs:` documentação
   - `refactor:` refatoração sem mudança de comportamento
   - `chore:` manutenção
4. **Testes** → `npm run test:all` (ou `npm run build && npm run test`).
5. **Pull Request** → preencha o template, referencie a issue (`Closes #123`).
6. **Revisão** → pelo menos uma aprovação.
7. **Merge** → squash and merge na `main`.

## Padrões de código

- **TypeScript strict**: `noUnusedLocals`, `noUnusedParameters` ativos.
- **CSS**: use design tokens (`var(--token)`), evite valores hardcoded.
- **Componentes Astro**: um por arquivo, props tipadas, sem lógica de negócio no frontmatter.
- **Scripts**: módulos ES, funções puras quando possível, sem dependências globais.
- **Acessibilidade**: HTML semântico, `aria-*` quando necessário, foco visível.

## Validação local

```bash
npm install          # instala dependências (cache isolado fora do repo)
npm run curriculum:check   # valida se README e dados gerados estão sincronizados
npm run check        # typecheck + astro check
npm run test         # testes unitários (vitest)
npm run build        # build de produção
```

## Dúvidas?

Abra uma issue com a label `question` ou inicie uma [Discussion](https://github.com/XjonathandebritoX/bananadev/discussions).