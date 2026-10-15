# PanteraLab — plano e registro de desenvolvimento

Atualizado em 15/10/2026. Primeira versão integrada e homologação local com MongoDB/SMTP reais concluídas. **Homologação externa e liberação para produção ainda pendentes.**

## Estado atual para retomada

Projeto Vercel de homologação separado já criado e protegido: prj_ZdM6aXzCNoJPZURVCGHj1KTbRIUe. CLI Vercel autenticada; não recriar projeto nem reutilizar o antigo. Atlas ainda não autenticou; códigos anteriores retornaram DEVICE_AUTHORIZATION_EXPIRED. Usuário foi orientado a concluir identidade pelo fluxo oficial no navegador padrão. Falta comprovar banco exclusivo; nenhum deploy/push novo permitido antes disso. Ver os registros mais recentes no fim deste documento e docs/PREVIEW_VERCEL.md. Homologação local segue nas portas 3107/8025.

## Autorização e situação do repositório

O usuário autorizou o desenvolvimento autônomo após a solicitação inicial de análise. Permanecem obrigatórios: preservar contas e recursos existentes, não operar banco de produção, não alterar credenciais, não contratar serviços e não publicar sem autorização expressa.

Branch: `feat/catholic-prayer-platform`, baseada em `feat/prayer-community-security` no commit `312bb08` (PR #15). Entrega registrada no commit `6773239` e no [PR de rascunho #16](https://github.com/ricardoq4p/clone-tabnews/pull/16), sobre essa branch de segurança, mantendo a revisão das duas etapas separada. Não houve merge na main nem deploy manual. A integração Vercel existente criou previews automáticos dos pushes anteriores; seu isolamento não foi comprovado. Nesta etapa não fazer novos pushes: publicação externa exige autorização. A homologação atual usa somente MongoDB e SMTP locais com credenciais próprias.

## Arquitetura escolhida

- Next.js Pages Router e React existentes, NextAuth com CredentialsProvider, MongoDB/Mongoose, emails próprios pela Brevo, Pusher e Cloudinary preservados.
- Conteúdo inicial do Rosário versionado e imutável em `lib/rosary/content-v2026-1.js`, com registro em `BUILT_IN_EDITIONS`. Meditações originais e fontes oficiais da Igreja em `/fontes`; ilustrações SVG originais locais em `public/sacred/`.
- Rosário público sem banco. Progresso local separado por conta e sincronização autenticada por revisão otimista; conflitos explícitos, sem sobrescrever silenciosamente. Não transferir progresso de visitante a uma conta sem escolha do usuário.
- Capelinha: datas UTC determinadas pelo servidor, `expiresAt = createdAt + 604800000 ms`. Consulta pública exige expiração estritamente futura, inclusive após consultas auxiliares. Nenhum cron ou navegador é necessário para expirar a visibilidade. Sem índice TTL em velas; histórico preservado.
- APIs novas centralizam métodos, origem, sessão, autorização, limites e respostas sem cache em `lib/api.js`. Projeções públicas explícitas; anonimato não inclui nome ou identificador do autor. Revisão administrativa de texto reservado exige motivo e auditoria antes da leitura.
- Interface marfim, azul mariano e dourado, fontes locais do sistema, navegação móvel, foco visível, movimento reduzido e CSS delimitado por `.prayer-app`.
- Reutilizar User, Message, Comment e Community. Coleções novas são aditivas: Candle, PrayerSupport, RosaryProgress, RosaryEdition, ModerationLog, AbuseReport e PrivacyRequest. Índices únicos garantem progresso por usuário e intercessão por usuário/alvo.

## Reaproveitamento e compatibilidade

Cadastro, confirmação por email, recuperação de senha, sessões, avatares, perfis, grupos, publicações e comentários permanecem. O painel anterior `/admin`, feed e recursos pessoais/calorias continuam acessíveis. Não há migração destrutiva ou exclusão de funcionalidades.

Publicações recebem categoria e estado de moderação com compatibilidade para documentos antigos sem esses campos. Moderação oculta conteúdo, sem apagá-lo. Exclusão administrativa antiga é bloqueada quando há dependências adicionais, incluindo histórico de oração e calorias; usar suspensão e tratamento documentado de privacidade.

A etapa de segurança anterior corrigiu privilégio por email, sessões revogadas, limites e autorização em grupos privados; histórico em `docs/etapa-1.md`. Revisar a titularidade de administradores antigos antes de produção.

## Etapas concluídas

### 1. Auditoria e arquitetura

Implementada na branch base. Reutilização dos modelos e integrações existentes, autorização administrativa, revisão de sessões e proteção de grupos. Critério local: 40 testes iniciais e build aprovados. Risco restante: configuração real e administradores antigos exigem homologação.

### 2. Santo Rosário Guiado

Implementado em `lib/rosary/`, `components/rosary/`, `pages/rosario.js` e APIs `/api/rosario/conteudo` e `/api/rosario/progresso`. Modelos RosaryProgress e RosaryEdition.

Quatro conjuntos; dia automático por America/Sao_Paulo; seleção manual; cinco ou vinte mistérios; orações completas, jaculatória opcional, meditações, vinte ilustrações, contas interativas, progresso, texto ampliado, recolhimento, conclusão e retomada. Edições novas preservam orações em andamento. Critério local: roteiro, fronteira do dia, validação de posições, revisão concorrente, navegação e isolamento entre contas aprovados. Pendente: revisão pastoral/editorial e sincronização entre dispositivos com MongoDB de teste.

### 3. Capelinha Virtual

Implementada em `lib/candles.js`, `lib/prayer-support.js`, modelos Candle/PrayerSupport, componentes de vela, páginas `/capelinha` e `/minhas-velas`, APIs `/api/velas`, `/minhas`, `/[id]` e `/[id]/oracao`.

Vela animada, intenção pública/anônima/privada, reconhecimento da privacidade, 168h exatas, histórico, retirada, mudança de visibilidade e oração idempotente. A vela é explicitamente um gesto simbólico. Critério local: limite exato, expiração durante consulta, anonimato, acesso privado e duplicidade aprovados. Pendente: concorrência e índices em MongoDB real de homologação.

### 4. Comunidade de oração

Implementada em `/comunidade`, MessageCard, APIs existentes de mensagens/comentários e novas APIs de intercessão/denúncia. Reutiliza grupos, perfis e formulários existentes.

Pedidos, testemunhos, reflexões, comentários sob demanda, intercessão sem ranking, denúncias e atualizações Pusher quando configurado. A IA existente continua em conteúdo público, com orientação religiosa cautelosa; não recebe grupos privados. Critério local: autorização, comentários, renderização escapada e navegação aprovados. Pendente: Pusher e regras editoriais em homologação.

### 5. Administração e privacidade

Implementadas `/administracao`, `components/prayer/RosaryEditor.js`, PrivacyRequests e APIs `/api/admin/*`, `/api/denuncias`, `/api/conta/solicitacoes`.

Estatísticas agregadas, filas, revisão auditada, moderação não destrutiva, suspensão/revogação, edição imutável de textos/imagens e fila de solicitações de dados. Exportação e exclusão não são executadas automaticamente: exigem tratamento humano com registro. Critério local: autorização e fluxos com fixtures aprovados. Pendente: operação real de atendimento, retenção, controlador/contato e revisão das políticas para dados sensíveis e menores.

### 6. Identidade e experiência

Implementadas página inicial, shell, login e telas informativas, CSS de oração, SVGs locais e navegação móvel. Corrigidos perfil público, confirmação de email e avatares padrão externos que transmitiam nomes. Recursos anteriores mantidos e harmonizados. Critério local: teclado, skip link, movimento reduzido e ausência de rolagem horizontal em 320, 390, 768, 1024 e 1440 px. Pendente: teste manual com leitores de tela e aparelhos físicos.

### 7. Testes e preparação

Concluída a verificação local; publicação permanece pendente. Detalhes operacionais em `docs/HOMOLOGACAO.md`; dependências em `docs/SEGURANCA_DEPENDENCIAS.md`.

## Verificações da primeira entrega (antes da homologação integrada)

- Node **22.23.3** oficial, checksum SHA-256 verificado. Runtime portátil ignorado em `.qa/runtime/`; Node global 20.12.1 não serve para esta entrega. Em outra sessão, usar instalação Node 22 e `npm ci`.
- **95 testes em 19 suítes aprovados**: segurança anterior, APIs, schemas/índices, Rosário, privacidade, expiração, concorrência simulada, conflitos, exclusão com dependências, email renderizado sem envio e imagem processada com Sharp real.
- ESLint com `--max-warnings 0`, Prettier e build Next.js **16.4.1** verificados. React 18 preservado; Next avisa sobre futura migração para React 19 antes do Next 17.
- Playwright/Edge isolado: início, oração/retomada, troca de conta na mesma página, teclado, matriz responsiva, Capelinha, comunidade e moderação/editor. Nenhum erro JavaScript nesses fluxos. Autenticação e dados dos fluxos autenticados são fixtures HTTP explícitas; não comprovam integração real.
- Auditoria das dependências **de produção: zero alertas**. Ferramentas de desenvolvimento/build/testes ainda têm **40 alertas (33 altos, 7 moderados)**, registrados com plano de migração separado. Não usar `npm audit fix --force` indiscriminadamente.
- Nenhum envio SMTP, acesso MongoDB real ou publicação. Screenshots e relatórios locais em `.qa/`, não versionados. Esses previews iniciais foram encerrados. A stack de homologação descrita abaixo permanece ligada a pedido do usuário.

## Problemas encontrados e soluções

- Progresso e respostas antigas durante troca de conta: armazenamento separado, escritas vinculadas ao accountId, descarte de resultados antigos e remontagem por identidade/papel.
- Expiração durante consultas auxiliares: nova checagem no servidor antes de serializar e timer visual na página.
- Comentários e perfis antigos: carregar comentários sob demanda, validar username e usar os campos reais do modelo; preservar funcionalidades.
- Intenções e conteúdo reservado no painel: filas sem texto privado; leitura excepcional auditada com motivo.
- Dependências vulneráveis herdadas: atualização compatível e ajuste explícito do peer opcional de email, sem recriar autenticação.
- Regras React mais estritas após atualização: remover estados redundantes em efeitos e executar atualizações nos retornos assíncronos ou ações, sem desativar regras.

## Pendências e próximos passos

1. Revisar o PR de segurança #15 e depois o PR desta branch; não fazer merge/deploy automaticamente.
2. Manter o ambiente local preparado; provisionar serviços externos de teste somente com credenciais próprias e, para preview externo, autorização expressa. Seguir `docs/HOMOLOGACAO.md`.
3. Cadastro, confirmação, SMTP local, reset, índices, concorrência, sessões e duas contas foram validados localmente. Homologar ainda Brevo, uploads Cloudinary e transporte Pusher reais, além de dispositivos físicos.
4. Revisão editorial católica, acessibilidade assistiva e política operacional de dados: controlador/contato, retenção, solicitações, menores e consentimento. Não declarar conformidade LGPD completa antes disso.
5. Migrar a cadeia de ferramentas vulneráveis em mudança isolada; considerar React 19 antes de futuras atualizações principais.
6. Somente após homologação e autorização expressa do usuário, preparar publicação. Não há deploy autorizado nesta entrega.

## Como retomar em outra sessão

Ler este arquivo e os documentos citados, conferir branch/status e PRs, usar Node 22, instalar com `npm ci`. Não usar credenciais de produção. Executar `npm test`, `npm run lint`, `npm run lint:check`, `npm run build`. Browser QA opcional: `npm run test:browser`, com PLAYWRIGHT_MODULE e QA_BROWSER_EXECUTABLE se necessário, QA_BASE_URL local. As fixtures estão explicitamente no script, nunca no produto. Novas edições do conteúdo embutido exigem novo arquivo/versão e preservação das anteriores.

## Homologação local — etapa concluída em 15/10/2026

O usuário informou que ainda não possui serviços exclusivos de teste e escolheu homologação local. Stack preparada em loopback: aplicação http://localhost:3107, Mailpit http://localhost:8025, SMTP 127.0.0.1:1025 e MongoDB autenticado 127.0.0.1:27027/panteralab_homologacao. Segredos próprios, contas e dados fictícios em `.qa/`, ignorado pelo Git. Não copiar para produção.

**104 testes unitários/API em 20 suítes aprovados**, ESLint sem avisos, Prettier e build Next 16.4.1 aprovados. Integração Playwright/Edge + MongoDB/SMTP reais passou em **14 grupos de verificações**, sem erros JavaScript. Relatório local final em `.qa/local-integration-report.json`, de 15/10/2026 às 14:10:50 de Brasília. As primeiras tentativas encontraram problemas corrigidos; o relatório final registra a execução concluída.

Validados: cadastro sem privilégio, confirmação/reenvio por SMTP local, cookies reais, reset de uso único e revogação, suspensão/reativação, Rosário completo de 82 e 292 etapas, progresso e conflito real, velas 168h e privacidade, doze intercessões concorrentes e duas pessoas distintas, expiração sem navegador, histórico e ausência de TTL em velas, moderação auditada, grupos privados e solicitações de dados. Visual com visitante, participante e administrador em 390/1440 px e login pelo formulário real. Matriz adicional da primeira entrega cobriu 320/768/1024 px.

Correções adicionais: resposta JSON segura para sessão revogada (null produzia corpo vazio no NextAuth 4), opções Mongoose atuais, índice `_id` redundante removido apenas do schema, upload sem falso sucesso/configuração ausente, rotas antigas de edição direcionadas ao perfil, respostas antigas do painel descartadas e aviso da última oração concluída. SMTP local exige configuração local exata e não altera autenticação.

Arquivos operacionais: `scripts/install-local-services.ps1`, `scripts/local-homologation.cjs`, `scripts/local-integration-qa.cjs`. Scripts npm homologacao:build/start/stop/status e test:local. Guia de uso em `docs/HOMOLOGACAO_LOCAL.md`; relatório completo e revisão dos PRs em `docs/RELATORIO_HOMOLOGACAO.md`. As contas e senhas estão em `.qa/ACESSOS_LOCAIS.md`; não imprimir ou versionar segredos.

O ambiente permanece ligado para o usuário experimentar. Parar somente se solicitado ou para uma atualização necessária, preservando banco e emails. Após reinício do computador, usar homologacao:start. O launcher recusa portas ocupadas e valida os processos que encerra. Usa limite local de login 50/min e janelas de cadastro/reset/recuperação de um minuto para repetição; produção não foi alterada.

PRs #15 e #16 revisados: ambos rascunhos e sem conflitos informados; #16 depende de #15, confirmado por ancestralidade. Correções desta etapa ficam em commits **locais** da branch de desenvolvimento; nenhum push para evitar disparar Vercel sem autorização. Antes de sincronizar, revisar gatilhos de preview e isolamento das variáveis.

Pendentes: entrega real Brevo, upload Cloudinary, transporte Pusher, acessibilidade assistiva/aparelhos físicos, carga/backup, revisão editorial católica e política operacional/jurídica. Os serviços externos estão desligados aqui. Não declarar homologação completa para lançamento nem conformidade LGPD concluída. Ver lista detalhada no relatório; ainda não publicar.

## Preparação do preview Vercel — 15/10/2026

O usuário autorizou publicação externa somente em Preview isolado, com projeto/banco/segredos próprios, proteção de acesso e sem custo. Não autoriza produção, domínio panteralab.com.br, main ou reutilização de credenciais. A autorização anterior de não fazer pushes foi substituída por permissão **condicionada à verificação do isolamento**, ainda não cumprida.

Não há acesso Vercel autenticado/CLI/token disponível nos pontos verificados. Foram encontradas integrações Vercel e MongoDB Atlas disponíveis, mas não conectadas na última consulta. O usuário informou que vai conectá-las. Não publicar nem fazer push até verificar os acessos, as variáveis e a automação antiga. Nunca solicitar senhas pelo chat. A homologação local segue acessível.

Preparados docs/PREVIEW_VERCEL.md, .env.preview.example sem segredos e .vercelignore excluindo todos os artefatos/credenciais locais. Acrescentado bloqueio explícito de email e falha antes de criar SMTP quando faltam credenciais. Interface permite aviso de homologação Vercel e noindex, que não substitui proteção de acesso. 108 testes aprovados em 21 suítes nesta preparação; ESLint sem avisos, Prettier e build Node 22/Next 16.4.1 aprovados. Stack local recompilada e reiniciada, respondendo 200 nas portas 3107 e 8025. Deploy remoto ainda não executado.

Próxima ação: confirmar conexão real dos serviços; consultar projetos, variáveis/escopos e proteção Vercel sem imprimir segredos. Se houver credenciais misturadas no projeto antigo, interromper essa parte e apresentar configuração segura. Criar projeto Vercel novo sem deploy Production automático e Atlas Free separado, somente após conferir gratuidade/permissões. Verificar todo o roteiro antes de entregar link. Não reutilizar massa local nem inferir isolamento pelo nome da branch.

## Acesso por CLI — continuação em 15/10/2026

O usuário confirmou contas autenticadas no navegador do Codex e autorizou uso das sessões/CLI, criação de recursos gratuitos separados e deploy direto sem push. A conversa não dispõe de ferramenta de automação do navegador autenticado; a sessão visível não concede acesso automático às CLIs. Não extrair cookies ou credenciais do navegador.

Foram instaladas ferramentas somente em `.qa/`, ignorado e excluído do deploy: Vercel CLI 64.2.0 via npm (sem scripts de instalação), e Atlas CLI 1.59.2 portátil, SHA-256 conferido contra release oficial. Não alteradas as dependências do produto.

Login Vercel iniciado com `node .qa/vercel-cli/node_modules/vercel/dist/index.js login --global-config .qa/vercel-auth --no-color`. Perfil OAuth Atlas iniciado com `.qa/runtime/atlas.exe auth login --authType UserAccount --output json --noBrowser --profile panteralab-homologacao`. As confirmações devem ser feitas pelo usuário nos sites oficiais. A primeira confirmação declarada da Vercel ainda não foi observada pela CLI; não tratar como autenticada até whoami/API confirmar. Códigos de dispositivo expiram; não registrar códigos/tokens no repositório nem imprimir arquivos de autenticação.

Para sondar autenticação Vercel, incluir `--non-interactive`, pois alguns comandos iniciam login automaticamente na ausência de sessão. Sessão Vercel fica exclusivamente em `.qa/vercel-auth`. Nenhum projeto/cluster foi criado, nenhum push ou deploy foi realizado nesta tentativa. Retomar verificando autenticação real e só então consultar metadados dos projetos existentes e criar recursos isolados. Não usar o fluxo de deploy temporário sugerido pela CLI quando deslogada.

## Infraestrutura Vercel criada — estado confirmado em 15/10/2026

A CLI Vercel foi autenticada com sucesso. Conta tem papel OWNER na equipe ricardo-alves-dos-santos-projects, plano Hobby. Consulta somente de metadados confirmou que o projeto antigo clone-tabnews usa os mesmos registros de MONGODB_URI, NEXTAUTH_SECRET e credenciais de serviços nos escopos Production/Preview/Development. Não alterar esse projeto nem fazer push na branch vinculada. O usuário autorizou expressamente o fluxo direto em projeto novo, sem push.

Criado por API o novo projeto **panteralab-homologacao**, ID `prj_ZdM6aXzCNoJPZURVCGHj1KTbRIUe`, equipe `team_Vt0Io5oaNuqVHV3JhHFQIoYj`. Confirmados por nova leitura: framework Next.js, Node 22.x, sem vínculo Git, nenhuma variável herdada, publicSource=false e proteção Vercel Authentication com deploymentType=prod_deployment_urls_and_all_previews. autoAssignCustomDomains=false; nenhum domínio oficial foi associado. Não há deployment desse projeto ainda. Não usar --prod, não instalar integrações pagas.

Dry-run real da CLI com --target=preview e ID explícito do projeto: 191 arquivos, 1.289.390 bytes; nenhum .qa, .env, .vercel, node_modules, .next ou cache incluído. Relatórios sem segredos em `.qa/vercel-preview-project.json`, `.qa/vercel-projects-metadata.json` e `.qa/vercel-package-dry.json`. Não inferir que já houve upload: --dry não publica.

**Impedimento atual:** Atlas CLI 1.59.2 ainda não autenticou. O usuário informou sucesso nas páginas de autorização, mas a CLI continuou retornando not logged in/HTTP 401 e os códigos expiraram. Não criar outro recurso ou publicar sem comprovar o banco isolado. Foi solicitado apenas o texto da mensagem do site após a autorização para diagnosticar a discrepância; não repetir geração de códigos indiscriminadamente. Não acessar cookies do navegador. Nenhum projeto, cluster ou usuário Atlas foi criado.

Próximo trabalho: resolver a autenticação Atlas (ou configuração manual exclusiva de homologação com conexão guardada em arquivo local ignorado), conferir organização/permissões e criar projeto/cluster M0 gratuito explícito — a CLI tem FLEX como default, portanto nunca omitir --tier M0. Criar usuário readWrite somente em panteralab_homologacao_vercel, avaliar rede sem alterar produção, testar conexão. Depois configurar somente Preview do projeto novo, segredo novo, URL HTTPS exata, proteção e serviços ausentes desativados. Provisionar contas fictícias novas com acesso guardado localmente; definir fluxo de confirmação de cadastro de teste sem SMTP externo. Só então publicar diretamente com ID do projeto e target Preview, sem push, e executar os testes reais hospedados. Falta o banco, portanto ainda não existe link de aplicação publicado nesta etapa.
