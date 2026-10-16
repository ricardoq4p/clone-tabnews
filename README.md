# PanteraLab · Casa de Oração

Plataforma católica com identidade Retro Digital, Santo Rosário guiado, Capelinha Virtual e comunidades. A branch `main` é a referência oficial de desenvolvimento e produção. O redesign aprovado tem origem no commit `77da536`; a consolidação preserva também o histórico original do gerenciamento de comunidades.

## Arquitetura

- Next.js 16 com Pages Router, React 18 e Node.js 22. `pages/` contém telas e APIs; `components/prayer/` reúne a interface devocional.
- NextAuth mantém autenticação e sessões; MongoDB/Mongoose mantém usuários, comunidades, publicações, comentários, velas, progresso e auditoria.
- O Rosário usa conteúdo versionado em `lib/rosary/`, retomada local ou na conta, quatro conjuntos e 20 mistérios.
- A Capelinha preserva a imagem original, o cenário em 3:2, as posições relativas das velas e o dimensionamento pela janela. Intenções públicas, anônimas e privadas mantêm as regras de acesso; a expiração visual ocorre após 168 horas e conserva o histórico conforme a política existente.
- Administração em `/administracao`, exclusiva de superadmin, com indicadores, gerenciamento de comunidades, revisão auditada, moderação, privacidade e edição do Rosário. Os recursos pessoais e o painel anterior continuam disponíveis conforme suas permissões.
- Estilos: Tailwind e `styles/globals.css` para a base existente; `prayer.css`, `design-system.css` e `retro.css` para a apresentação compartilhada; `Chapel.module.css` para o santuário. Fontes WOFF2 locais, com licenças em `public/fonts/`.
- Email, uploads, IA e eventos em tempo real dependem das configurações e dos controles de habilitação existentes. Credenciais nunca pertencem ao repositório.

## Desenvolvimento

Use Node **22** (ver `.nvmrc` e `package.json`).

```sh
npm ci
```

Copie `.env.example` para `.env.local` e configure exclusivamente serviços de desenvolvimento. Nunca use o banco ou credenciais de produção em testes. Configure `NEXTAUTH_URL` para o endereço local e um segredo local próprio.

```sh
npm run dev
```

A home e o Rosário têm conteúdo local. Conta, velas e comunidades dependem do MongoDB e das configurações correspondentes. Serviços indisponíveis são informados pela interface; não há participantes ou registros fictícios no produto.

## Validação

```sh
npm test
npm run lint
npm run lint:check
npm run build
npm start
```

O workflow `CI`, em `.github/workflows/ci.yml`, repete instalação, testes, ESLint, Prettier e build em Node 22, sem segredos de produção. O job é `validate`.

Para QA visual, disponibilize Playwright e um navegador no ambiente de testes; use `PLAYWRIGHT_MODULE` e `QA_BROWSER_EXECUTABLE` quando estiverem fora das dependências do projeto. Defina `QA_BASE_URL` para o servidor **local** escolhido e execute:

```sh
node scripts/browser-qa.cjs
node scripts/chapel-viewport-qa.cjs
node scripts/communities-browser-qa.cjs
node scripts/retro-browser-qa.cjs
```

O último roteiro também requer `@axe-core/playwright`, configurável por `AXE_MODULE`. A matriz contempla 1920×1080, 1440×900, 1366×768, 1280×720, 768×1024, 390×844 e 320×568. APIs autenticadas usam fixtures locais; capturas e relatórios ficam em `.qa/`, ignorado pelo Git e excluído dos uploads. Esses testes não substituem validação de serviços externos ou persistência real em homologação.

Para MongoDB e SMTP locais reais, veja [HOMOLOGACAO_LOCAL.md](docs/HOMOLOGACAO_LOCAL.md). Os comandos `homologacao:*` e `test:local` são próprios desse ambiente; não devem apontar para produção.

## Publicação e rollback

Projeto oficial Vercel: `clone-tabnews`, vinculado a este repositório, branch de produção `main`, Node 22, domínio [panteralab.com.br](https://panteralab.com.br). Não vincule o checkout ao projeto de homologação para publicar no domínio oficial.

1. Integre mudanças por histórico Git normal, sem force push. Valide testes, lint, formatação e build antes de promover uma versão.
2. Confira projeto, branch, commit, variáveis e domínio na Vercel. Preserve os valores e o escopo dos segredos existentes. Não copie variáveis de produção para previews.
3. Mantenha o deployment anterior e uma tag de rollback. Quando disponível, gere uma implantação de produção com atribuição de domínio adiada, valide READY e o SHA e só então promova.
4. Após promover, valide home, Rosário, Capelinha, comunidades, conta e administração, erros de execução e regras de acesso. Testes na produção devem ser somente de leitura, sem criar contas, velas ou publicações de teste.
5. Havendo regressão crítica, promova novamente o deployment anterior. Rollback de apresentação não restaura nem apaga banco.
6. Exclua branches temporárias somente após produção validada, PRs tratados e confirmação de ancestralidade/ausência de trabalho exclusivo. Preserve tags e deployments de recuperação.

O projeto contém a rotina existente `/api/internal/retention`, protegida por segredo, projeto, ambiente e flag explícita. Não a execute como teste de disponibilidade e não altere a política de retenção em uma entrega visual. Não executar migrações destrutivas, `syncIndexes`, `dropIndexes`, expurgos ou provisionamento administrativo durante publicação.

## Histórico e segurança

Os documentos de entregas anteriores descrevem o estado na data de cada execução; não são instruções para retornar a branches antigas. Consulte a [consolidação Retro Digital](docs/CONSOLIDACAO_RETRO_DIGITAL.md), o [redesign](docs/REDESIGN_RETRO_DIGITAL.md), a [Capelinha responsiva](docs/CAPELINHA_RESPONSIVA.md), o [gerenciamento de comunidades](COMMUNITIES-ADMIN.md), a [homologação](docs/HOMOLOGACAO.md) e a [avaliação de dependências](docs/SEGURANCA_DEPENDENCIAS.md).

Não versionar `.env*` com valores, tokens, capturas autenticadas, backups ou arquivos de conexão da Vercel. O script manual de provisionamento administrativo exige ambiente e autorização específicos. Alterações de política, privacidade ou negócio precisam de revisão própria.
