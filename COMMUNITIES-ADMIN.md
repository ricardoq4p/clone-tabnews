# Gerenciamento administrativo de comunidades

Base: branch `feat/catholic-prayer-platform`, commit
`593af03f8be6f1225214b9005b1867ff272610df`. O HTML público de
`https://panteralab.com.br/administracao` foi comparado ao código dessa branch:
PrayerLayout, título, descrição, cabeçalho e rodapé correspondem. Isso identifica
a implementação visual; não comprova o SHA exato do deployment. A `main` ainda
contém o painel anterior. Não integrar esta alteração na main sem o fluxo de
integração da plataforma de oração.

Os registros públicos consultados em 16/10/2026 mostram Preview para `593af03`
e Production para `6403d41` (21/04/2026). O domínio público exibe a interface de
oração; essa divergência exige confirmar o mapeamento de domínio/deployment antes
de promover uma versão. Não há projeto Vercel vinculado neste checkout.

## Rotas e componentes

- `pages/administracao.js`: adiciona a aba, preservando as demais áreas.
- `components/prayer/CommunityManager.js`: listagem, filtros, indicadores,
  paginação de 20 registros, edição e confirmação de exclusão em dialog nativo.
- `GET /api/admin/comunidades`: usa `withApi` com `admin: true`, NextAuth,
  validação de filtros, projeção de campos e contagens globais. Não retorna IDs
  dos membros nem e-mails do criador.
- `PATCH /api/communities/:id`: endpoint existente, autorização de proprietário
  ou superadmin, proteção de origem, validação de ID, nome, descrição e imagem.
  Campos omitidos agora mantêm os valores atuais; privacidade inválida é rejeitada.
- A edição de imagem reutiliza o fluxo Cloudinary e a compressão existentes na
  página da comunidade, com as mesmas variáveis públicas e validação no servidor.
- `DELETE /api/communities/:id`: endpoint existente de exclusão lógica.
- Reutiliza PrayerLayout, classes `p-*`, requestJson, jsonRequest,
  formatPrayerDate, modelos e política de autorização existentes.

## Exclusão e integridade

Não há exclusão física, migração, limpeza de dados ou cascata. O endpoint existente
define exclusivamente `Community.deletedAt`. Mantém o documento da comunidade,
`ownerId`, `members`, `Message.communityId`, publicações e comentários
(`Comment.messageId`). Demais registros de usuários, intercessões, denúncias e
auditoria não são removidos. Não transforma conteúdo privado em publicações
públicas, nem remove referências para colocá-lo no feed geral.

As consultas de comunidades e de mensagens ignoram comunidades arquivadas.
`canReadCommunity`, `canReadMessage` e `readableMessage` bloqueiam leitura e
comentários nos fluxos regulares depois da exclusão. As permissões administrativas
de moderação existentes continuam válidas. Não há restauração pelo painel;
qualquer recuperação posterior exige um procedimento operacional específico.

Visualizar abre `/comunidades/:id` em nova aba, preservando o contexto administrativo.
Privacidade não recebe bypass: administradores que não sejam membros de uma
comunidade privada continuam sujeitos à política atual de leitura. Proprietários
mantêm as permissões existentes de edição e exclusão da própria comunidade.

## Validação segura

`tests/admin-communities.test.js` simula banco, sessão e notificações. Cobre
autorização, busca literal, filtros, paginação, projeção, IDs inválidos,
edição parcial e preservação de relacionamentos na exclusão lógica.
`scripts/communities-browser-qa.cjs` usa somente localhost e intercepta APIs com
fixtures: acesso, pesquisa, filtro, edição, cancelamento/Escape, falha e sucesso
da exclusão, link de visualização e larguras 320/768/1280.

Executar `npm test`, `npm run lint`, `npm run lint:check`, `npm run build` e,
com servidor local em 3107 e Playwright disponível,
`node scripts/communities-browser-qa.cjs`. Nenhum teste precisa de banco real.

Não publicar caso as verificações falhem. Não foi criado mecanismo de implantação,
alterada configuração de autenticação ou provisionada conta administrativa.

## Resultados desta entrega

- 115 testes em 20 suítes passaram, incluindo 20 casos de comunidades.
- ESLint global passou, sem avisos.
- Build Next.js passou sem conexão a banco ou serviços reais. Mantém o aviso
  preexistente de descontinuação futura de React 18.
- QA local de comunidades passou: acesso, filtros, link de visualização, edição,
  cancelamento/botão e Escape, falha e sucesso de exclusão e larguras 320/768/1280.
- O roteiro existente `scripts/browser-qa.cjs` passou, incluindo moderação,
  revisão auditada, Rosário, capelinha, comunidade e navegação por teclado.
- Capturas desktop/mobile inspecionadas em `.qa/communities-*.png` (ignoradas por Git).
- Prettier dos arquivos alterados passou. O comando global `lint:check` falha
  em nove arquivos preexistentes, não alterados: `lib/auth.js`, `lib/mailer.js`,
  `lib/models/CalorieEntry.js`, `pages/upload.js`, `pages/user/edit.js`,
  `tests/calculadora.test.js`, `jsconfig.json`, `postcss.config.js`,
  `tailwind.config.js`.
- `npm ci --ignore-scripts` concluiu; informou 40 vulnerabilidades preexistentes
  (7 moderadas, 33 altas). O lockfile e as versões não foram modificados.
- Verificação executada com Node 24.19.0 e Chrome headless local; o projeto
  declara Node 22.x. Homologação com o runtime de implantação continua recomendada.
- Não houve testes destrutivos, acesso ao banco de produção ou publicação.
  Integração autenticada com serviços reais não foi exercitada: sessões, banco,
  notificações e gravações foram simulados nos testes.
