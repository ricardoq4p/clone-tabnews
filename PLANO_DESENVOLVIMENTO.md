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

## Estado atual — Preview externo isolado, 15/10/2026

Esta seção substitui os impedimentos históricos de autenticação acima: ambas as CLIs autenticaram. Projeto Atlas novo com cluster M0 e usuário readWrite restrito criado; conexão, gravação e recusa de outro banco confirmadas. Projeto Vercel separado, sem Git, protegido por Vercel Authentication, com nove variáveis apenas Preview e segredos novos. Três contas fictícias provisionadas somente no banco novo. Nenhum push ou merge.

Preview READY: https://panteralab-homologacao-jyr9y4lm3.vercel.app . IDs, isolamento, prazo de rede e incidente de primeiro build cancelado estão em `docs/PREVIEW_VERCEL.md`. Abertura de rede temporária exclusiva deste Atlas expira em 22/10/2026 às 14:48 de Brasília. Credenciais e instruções privadas em `.qa/ACESSOS_PREVIEW.md`; nunca versionar ou imprimir.

Novos módulos: `lib/preview-origin.js` calcula a origem exata do deployment somente no projeto dedicado; `lib/preview-registration.js` exige ID/Preview, email fictício, SMTP desligado, URI/TLS e banco/host corretos antes de disponibilizar confirmação inline. Fluxos normais preservados. Cadastro de homologação recusa email real e falha fechado se configuração divergir. 125 testes unitários/API aprovados em 23 suítes.

Brevo/Cloudinary/Pusher/IA externos permanecem desligados. Conteúdo religioso e política operacional/jurídica aguardam revisão humana. Homologação hospedada e evidências: `docs/RELATORIO_PREVIEW.md`. Para continuar, ler esse relatório e conferir proteção/target por API; o projeto antigo continua inadequado para push automático com isolamento. Produção permanece sem autorização.

## Cartões dos mistérios — 15/10/2026

Acrescentados dias tradicionais abaixo das descrições, com ícone de calendário e selo “Mistérios de hoje” independente da seleção. Os dias são derivados do calendário já existente no conteúdo, sem alterar edições arquivadas, progresso ou cálculo America/Sao_Paulo. A explicação informa que se trata de tradição devocional e permite qualquer conjunto.

Arquivos do produto: `pages/rosario.js`, `components/prayer/Icon.js`, `styles/prayer.css`. Testes: 125/125 em 23 suítes; ESLint sem avisos; Prettier; build Node 22/Next aprovado. Navegador real: sete dias, meia-noite de Brasília com fuso Asia/Tokyo, seleção manual preservada na troca do dia, retomada local e larguras 320/390/768/1440 sem transbordamento. Capturas `.qa/mystery-cards-*.png` revisadas. Banco Atlas M0 isolado e nove variáveis apenas Preview reconferidos; nenhuma variável alterada. Publicar diretamente no projeto de homologação e registrar URL/resultado após validação remota; sem push.

Deploy desta melhoria concluído: https://panteralab-homologacao-rao9tm8jy.vercel.app/rosario . Deployment `dpl_BDiL34U6gjQmwtg7SFTU9CLF5GWj`, projeto exclusivo de homologação, Preview READY, código do commit `8e9ba31`. Repetido o roteiro de sete dias/virada/seleção/retomada/responsividade na URL hospedada, aprovado. A chave temporária de automação foi revogada e acesso com ela passou a redirecionar para autenticação na página e nas APIs. Nenhuma variável existente alterada, nenhum push ou mudança de produção. Instruções privadas locais atualizadas para a nova URL. O prazo de rede Atlas continua 22/10/2026 às 14:48 de Brasília.

## Auditoria para produção — 15/10/2026, publicação interrompida

O usuário autorizou produção de forma condicionada à segurança, backup, compatibilidade e políticas; revogou a proibição geral anterior de publicar produção, mas determinou interrupção se houver risco importante. Nenhum deploy/alteração de configuração ou dado de produção foi feito. Relatório atual: `docs/AVALIACAO_PRODUCAO.md`.

Projeto oficial clone-tabnews (`prj_FRcbozdufCmWfO6FNmFLtyYwKT1S`) e deployment READY `dpl_79kS5op2dxw4hqeknq3v5iEthgAj` identificados. URL oficial responde 200. Banco real `tabnews`, seis coleções/79 documentos/18 usuários; auditoria somente de leitura. Backup lógico AES-256-GCM criado em `.qa/backups/`, com hash e round-trip BSON de todos os documentos verificados; sem snapshot PIT ou restore. Manifesto `.qa/production-backup-manifest.json`; arquivos/credenciais nunca versionados ou publicados.

Impedimentos: segredo de autenticação e URI do banco compartilhados com previews legados no projeto oficial; 2 comentários sem messageId e outros 2 com publicações inexistentes, preservados; responsável/contato/retenção da política ainda indefinidos; integrações reais exigem validação ou desligamento seguro. Parar a publicação até resolver os requisitos. Não “corrigir” vínculos por suposição nem alterar credenciais silenciosamente: rotação afeta sessões/deployments antigos e precisa de rollback compatível. Nenhuma conta de homologação foi copiada. PR #16 continua sobre #15; ambos rascunhos sem merge, remoto não contém os seis commits locais recentes. Candidato auditado 429424f inclui os cartões do Rosário.

125/125 testes em 23 suítes aprovados novamente. Procedimento de rollback e limites do backup registrados no relatório. Segredos consultados para conexão ficaram somente em `.qa/production-audit-secrets.json`; não imprimir ou copiar para homologação. Para retomar, resolver configuração exclusiva, compatibilidade/preservação dos comentários, política operacional e disponibilidade das integrações; então novo backup e testes finais antes de deploy direto no projeto oficial.

## Limpeza autorizada e preparação de produção — 15/10/2026

O responsável autorizou expressamente excluir publicações/comentários antigos e auxiliares exclusivos, sem novo backup para isso. Executado em transação somente por IDs conferidos: 17 messages e 20 comments. Zero órfãos. Contas (18), comunidades (8), dados pessoais (14) e logs (2) conferidos por hash, sem alteração. Backup anterior preservado. Evidências privadas em `.qa/production-cleanup-result.json`.

Nome/contato fornecidos: Ricardo A Santos, ricardo.q4p@gmail.com. Retenção aprovada para novas intenções: 90 dias após expirar, solicitação de exclusão antes. Política ampliada e consentimento 2026-2. Rotina diária protegida de retenção preparada, sem executar exclusão de velas existentes; ativa somente no projeto correto com flag e segredo próprios.

Integrações de produção agora desligadas por padrão mesmo com chaves antigas: email, IA, upload e Pusher exigem flags específicas. Cadastro/recovery/resend bloqueados antes de qualquer alteração quando email indisponível; páginas correspondentes explicam; login de contas existentes preservado. Contas fictícias @panteralab.test bloqueadas em produção. Novos módulos integration-policy e candle-retention e testes de segurança. 143 testes e 14 grupos integrados reais locais aprovados, build aprovado.

Três previews antigos foram removidos após autorização específica do usuário. O usuário declarou que a credencial MongoDB antiga é exclusiva deste aplicativo. Novo usuário restrito ao banco tabnews criado e verificado; antigo atlasAdmin reduzido a readWrite no mesmo banco/cluster, mantido apenas para o deployment anterior/rollback. Sem mudança nos dados. Segredo NextAuth novo gerado privadamente e escopos Production-only em preparação. Segredos em `.qa/production-release-secrets.json`, nunca imprimir/versionar. Relatório atual: `docs/LIMPEZA_E_PREPARACAO_PRODUCAO.md`; detalhes históricos em AVALIACAO_PRODUCAO.md.

Próximo: confirmar escopos isolados, commit, deployment --skip-domain no projeto oficial, validação sem mover domínio e somente então promover se aprovado. Preservar rollback anterior e seu usuário restrito; não reconstruir fontes antigas sem retirar arquivos .env/cache. Não fazer push/merge. A homologação deve continuar no projeto separado.

## Produção publicada — 15/10/2026

**Estado mais recente:** https://panteralab.com.br está na nova plataforma, commit de código `8db6bcb`, deployment `dpl_2i63NjkNdT9ZrdbbCpSHyX9funUX`, projeto oficial clone-tabnews. Nenhum push/merge/main/DNS alterado. Projeto de homologação e banco próprio preservados. Produção construída --skip-domain e promovida só depois de sete grupos de teste do estágio protegido; outros sete passaram no domínio oficial. 143 testes unitários/API, 14 integrações locais reais, lint/formatação e build aprovados. Rosário completo no navegador, 390/1440px, APIs e integridade dos dados validados sem criar conta, vela ou post fictício de produção.

Credenciais novas exclusivas Production: NEXTAUTH_SECRET e MongoDB readWrite somente tabnews/tabnews-cluster. Todas as 28 variáveis deste projeto restritas a Production. Antigo atlasAdmin reduzido a readWrite no mesmo banco/cluster e mantido apenas para rollback histórico, não usado pela nova plataforma; acesso a outro banco negado para ambos. Três previews antigos excluídos após autorização específica. Chave temporária de QA revogada; URLs imutáveis seguem protegidas e o domínio oficial é público.

Cadastro/recuperação/reenvio de email, upload Cloudinary, Pusher e IA desligados por flags; páginas informam indisponibilidade, contas existentes podem entrar com sua senha. Nova chave de sessão exige novo login. Responsável Ricardo A Santos, contato público ricardo.q4p@gmail.com; retenção aprovada de novas intenções 90 dias após expirar, rotina diária policyVersion 2026-2, com CRON_SECRET e ID/ambiente fixados. Configuração cron confirmada ativa; chamada autorizada teve zero elegíveis e zero exclusões. Nenhuma vela, progresso ou registro protegido apagado nesta mudança. Backup prévio preservado; limpeza exclusiva autorizada removeu 17 posts e 20 comentários, zero órfãos, 18 contas/8 comunidades/14 dados pessoais/2 logs idênticos por hash.

Rollback: deployment `dpl_79kS5op2dxw4hqeknq3v5iEthgAj`, credencial histórica agora restrita e conexão verificada. Não reconstruir fontes antigas (.vercel.production.env/cache no inventário); usar rollback do deployment preservado, desabilitar cron e verificar saúde. Não restaurar banco nem conteúdo cuja exclusão foi autorizada. Código legado tem riscos conhecidos, então rollback deve ser temporário. Credencial legada só deve ser revogada quando não for mais necessária à janela de retorno.

Relatório completo atual e procedimento: `docs/LIMPEZA_E_PREPARACAO_PRODUCAO.md`. Pendências operacionais: primeira execução cron, capacidade de lote/monitoramento, políticas/retencão de outras categorias e atendimento humano real, serviços externos de email/upload/tempo real/IA, acessibilidade física e revisão editorial. Não declarar certificação LGPD/eclesiástica. Main remota continua antiga; não realizar novos deploys por ela inadvertidamente. Guardar relatórios/segredos exclusivamente em .qa; nunca imprimir/versionar arquivos de credenciais. Esta seção supera os bloqueios e estados de não publicação registrados nas seções históricas anteriores.

## Correção de administração e exclusão — 15/10/2026

Conta do responsável conferida por leitura: superadmin, verificada, ativa e SUPERADMIN_EMAIL correto, sem alterar nenhum usuário/senha. Lacuna no painel novo: só oferecia ocultar/restaurar, com acesso pouco visível. Adicionados atalho no cabeçalho/perfil e exclusão definitiva auditada com motivo e confirmação para publicações/comentários. Nova DELETE /api/admin/excluir e serviço community-deletion: validação no endpoint e conta/papel atuais dentro da transação; autores apenas em seus registros, superadmin nos demais; limpeza de auxiliares exclusivos. Nenhuma exclusão nova para velas/intenções. Cartões compartilham a política e nomes acessíveis.

153 testes/26 suítes, lint, Prettier, build e cinco grupos reais de UI/HTTP/NextAuth/Atlas de teste passaram, incluindo negativas, confirmação cancelada, auditoria, cascata e 320/390/1440px. Não excluir conteúdo real nos testes de produção. Estado/diagnóstico em docs/CORRECAO_ADMINISTRACAO.md. Evidências privadas em .qa/admin-delete-integration-report.json; servidor temporário de QA em 3117 usa apenas Atlas de homologação, porque MongoDB standalone local não oferece transações.

Publicar diretamente no projeto oficial com --skip-domain e promover após smoke sem deleções reais. Rollback desta mudança: deployment anterior dpl_2i63NjkNdT9ZrdbbCpSHyX9funUX, já com credenciais isoladas. Não alterar variáveis, contas, senhas, main, domínio ou serviços. Conferir hashes antes/depois (.qa/admin-fix-production-before.json) e registrar versão/URL após publicação.

## Administração corrigida e publicada — 15/10/2026

Estado mais recente: produção em `2b7b6ba`, deployment `dpl_4NJnkkRWyVY5m3hsrkqqPzKFLNdv`, URL https://panteralab.com.br/administracao . Publicação --skip-domain seguida de validação e promoção; alias conferido. 153 testes/26 suítes, cinco grupos com transações reais em Atlas isolado e verificações protegida/pública aprovados. Headers compactos em 320/390/1440px. Papel da conta já era superadmin; nenhuma alteração de conta/senha/credencial. Atalho no cabeçalho/perfil; painel permite excluir publicações/comentários após motivo, revisão e confirmação. APIs normal/admin mantêm autorização e transação auditada, auxiliares exclusivos removidos sem tocar velas.

Nenhuma exclusão autenticada foi testada em produção. Conteúdos e contagens preservados; atividade de login do usuário ocorreu durante o teste, e comparação granular confirmou que apenas horários de acesso/default sessionVersion mudaram, mantendo senha/perfis/papéis. Evidências em .qa/admin-fix-public-qa.json e docs/CORRECAO_ADMINISTRACAO.md. Chave temporária revogada; servidor QA3117 encerrado; stack3107 mantida. Sem push/merge/main. Rollback desta correção: deployment `dpl_2i63NjkNdT9ZrdbbCpSHyX9funUX`, sem restauração de banco.

## Capelinha imersiva — 15/10/2026

Base confirmada: 2b7b6ba é ancestral da branch feat/catholic-prayer-platform. Administração, exclusão auditada, autenticação e APIs preservadas. Nova cena em components/prayer/ChapelScene.js e CSS Module exclusivo styles/Chapel.module.css. Original anexado copiado integralmente para public/sacred/capelinha-076db5e69b37.png; SHA-256 076db5e69b372bc45e7ff4b88b9ca60cffc388f38e0a0d8a93392b50fd0b1ffd. PNG sem transformação, corte ou distorção; reserva de proporção 3:2 evita deslocamento durante carregamento. Peso original: 2.249.060 bytes, uma escolha consciente para preservar exatamente a imagem solicitada.

Velas CSS individuais nas laterais dos degraus, seis por página com navegação para todas as carregadas. Sem velas fictícias no cenário. A cena usa exclusivamente DTOs já autorizados pelo servidor; filtro adicional exclui privadas da vista pública, retiradas, ocultas e expiradas. Histórico pode exibir as velas privadas do próprio usuário. Seleção é limpa na mudança de conta/visibilidade; expiração usa o relógio ajustado pelo servidor já existente. Acendimento privado abre automaticamente o espaço do proprietário. Recarregamento manual e após criação; novas intenções de outras pessoas aparecem ao atualizar ou retornar à aba. Sem Pusher ou dependências novas.

Interação diretamente nas velas e controles equivalentes de pelo menos 44px abaixo da imagem; foco visível, rótulos acessíveis, área de detalhes e preferência por movimento reduzido. Layout verificado em 320/390/768/1440px, sem transbordamento e sem cobrir Nossa Senhora ou o altar. Conteúdo e formulário anteriores permanecem abaixo, com paleta marfim/bronze/azul e tipografia existente.

Validação: 158 testes em 27 suítes; ESLint, Prettier e build aprovados. Seis grupos de integração/UI iniciais: três visibilidades em Atlas isolado, negativas de privacidade, expiração backend sem navegador, cenários 0/1/13 velas em quatro tamanhos, mouse/teclado/toque, movimento reduzido e SHA do recurso servido. Nova rodada de quatro grupos visuais após ajuste da posição dos controles. Registros sintéticos criados e removidos exclusivamente no banco panteralab_homologacao_vercel. Nenhuma escrita de teste no banco real.

Publicação autorizada pelo usuário no projeto oficial clone-tabnews. Pré-verificação confirmou domínio/deployment anterior dpl*4NJnkkRWyVY5m3hsrkqqPzKFLNdv e 28 variáveis restritas a Production. Nenhuma alteração de credenciais, DNS, MongoDB ou serviços prevista. Deploy inicialmente sem promover domínio; validar recurso original, páginas, proteção e integridade antes de promover. Rollback: vercel rollback dpl_4NJnkkRWyVY5m3hsrkqqPzKFLNdv no mesmo projeto/escopo, sem restauração ou alteração de banco. Evidências privadas em .qa/chapel-*.json e capturas .qa/chapel-\_.png, nunca publicadas.

## Capelinha publicada e validada — 15/10/2026

Versão implantada: 752472643961bba8fbeda0e0d034e823779bf0a9. Deployment oficial dpl_4uRVQpZ4NT8AdzYb5zd7oxBJ5Ucf; https://panteralab.com.br/capelinha . Publicação no clone-tabnews com --skip-domain, revisão protegida, promoção e verificação do alias oficial. Imagem original conferida novamente por SHA-256 no domínio público. Quatro grupos de smoke protegidos e quatro públicos aprovados, incluindo quatro larguras, páginas essenciais, bloqueio de administração para visitantes, ausência de erros JS e comparação de integridade. A rota administrativa legada overview retorna corretamente 403 a visitantes; o teste foi ajustado a esse contrato existente, sem mudar código de autorização.

158 testes/27 suítes aprovados. ESLint aprovado para todos os 159 arquivos JavaScript/configuração/testes versionados (git ls-files; arquivos privados e ferramentas em .qa ficam fora da análise). Prettier e build aprovados. Acendimento privado pela interface em Atlas isolado também aprovado: após consentimento, abre a própria cena; ao mudar para a comunidade, remove a seleção e o texto privado. Todos os registros sintéticos foram removidos exclusivamente do banco de teste.

Dados anteriores das 12 coleções conferidas preservados; nenhuma escrita de teste ou migração em produção. Durante a preparação, surgiu um progresso legítimo do Rosário após o snapshot inicial, vinculado a usuário existente; preservado e validado, sem forçar igualdade artificial de contagem. Hash estável de contas mantém senha, papel e perfil, ignorando somente horários normais de acesso/defaults já existentes. Evidências privadas: .qa/chapel-staged-qa.json, .qa/chapel-public-qa.json, .qa/chapel-legitimate-activity.json, .qa/chapel-private-ui-qa.json e .qa/chapel-official-alias-verification.json.

A chave temporária de QA foi revogada e sua rejeição confirmada (302 na URL imutável protegida). Proteção Vercel e rotina de retenção existentes permanecem; nenhuma variável, credencial, DNS, recurso MongoDB ou serviço pago alterado. Sem push, merge ou alterações na main. Homologação local retomada em localhost:3107. Rollback disponível para dpl_4NJnkkRWyVY5m3hsrkqqPzKFLNdv, mantendo o banco atual e os registros novos.

Limitações conscientes: seis velas por página do cenário, API em lotes de vinte com carregamento adicional; PNG original de 2,25 MB sem recompressão; novas velas de outros navegadores aparecem por atualização manual/retorno à aba, sem Pusher. Nenhum impedimento crítico restante para esta atualização visual.

## Redesign UX/UI — em validação, 15/10/2026

Missão autorizada para produção, restrita a UX/UI/CSS. Referências 7524726 e 2b7b6ba preservadas. Nova camada styles/design-system.css com tokens reutilizáveis, tipografia existente sem downloads, container1280/leitura740, cabeçalho72/64, controles48, contraste e foco. Importação em \_app; Layout só recebe indicação visual aria-current para seção/conta/administração; feed e grupo só recebem nomes acessíveis de campos. Chapel.module.css altera somente tipografia. Nenhum arquivo funcional protegido modificado. Arquitetura e auditoria em docs/AUDITORIA_UX_UI.md.

Resultados parciais: 158 testes/27 suítes, lint/Prettier/build, 110 combinações de páginas/larguras e axe em 11 páginas/perfis aprovados. Rosário completo82 passos e retomada, foco/teclado/zoom200%, navegação e acesso admin passaram. Capturas privadas antes/depois e relatórios em .qa/ux-\*. Ajustes posteriores apenas ampliaram botões auxiliares de11para14px; rodada final completa em curso com servidor3117 de Atlas isolado, sem credenciais reais de usuários.

Publicação planejada no projeto oficial, sem novas chaves de QA, mudanças de credenciais/variáveis/DNS ou serviços. Deploy --skip-domain, checar READY/metadados/commit e preservar rollback dpl_4uRVQpZ4NT8AdzYb5zd7oxBJ5Ucf. Repetir smoke público e conferir integridade somente por leitura. Main sem alterações; nenhum push ou merge.

## Redesign UX/UI — testes finais aprovados, 15/10/2026

Rodada final: 110 combinações de rota/largura sem overflow/erros JS; comunidade positiva com edição aberta em mais cinco larguras; axe sem violações em 12 escopos de página/perfil; cinco grupos de interações (teclado, Rosário82 etapas/retomada, fonte, zoom200%, navegação e administração); cinco grupos reais de exclusão com transação e auditoria, apenas conteúdo fictício no Atlas separado; quatro grupos visuais da Capelinha e acendimento privado com troca de escopo. Imagem original mantida por SHA. Todos os arquivos de lógica protegidos conferidos por git diff e permanecem idênticos à referência.

Relatórios privados em .qa/ux-\*.json, .qa/admin-delete-integration-report.json e capturas. Auditoria pública local em docs/AUDITORIA_UX_UI.md. Comparação somente de leitura dos 12 conjuntos de dados de produção aprovada em .qa/ux-production-integrity-predeploy.json; snapshot de hashes em .qa/ux-production-before.json. Uma vela/progresso reais em uso, preservados. Não restaurar dados para forçar contagens iniciais se houver atividade legítima. Nenhum token de proteção adicional foi criado para esta entrega; manter credenciais e configurações atuais.

## Redesign publicado e validado — 15/10/2026

Estado atual de produção: código eef33a30fa8324427da236b0c963c847b3a2150b, deployment dpl_4Xxk5EoNqsyTjCepE9Fb3ZdiAcAx, https://panteralab.com.br . Domínio/projeto oficial conferidos; --skip-domain, READY com metadados do commit testado e promoção. Nenhuma chave temporária de acesso criada ou configuração alterada nesta entrega. Referências7524726/2b7b6ba preservadas.

Validação final aprovada:158 testes/27 suítes, ESLint159 arquivos, Prettier/build;110 combinações de22rotas/cinco larguras, comunidade real de teste em cinco larguras com edição aberta;axe zero nas12combinações originais e em cena com vela selecionada;Rosário82etapas/retomada/zoom/teclado/administração;cinco grupos de exclusão transacional real apenas em Atlas separado;quatro grupos da cena e criação privada por UI. Em produção:45combinações de nove páginas/cinco larguras, novo CSS confirmado por tokens/dimensões,axe nas três páginas principais,PNG original eprivacidade/negação administrativa preservados. Relatórios/capturas em .qa/ux-\* e relatório legível em docs/AUDITORIA_UX_UI.md.

Preservação: comparação individual dos registros das12coleções aprovada, sem escritas de teste em produção;senhas/perfis/papéis estáveis, presença normal separada. Sem mudanças de APIs/modelos/autenticação/mistérios/textos/progresso/velas/permissões/integrações/variáveis/credenciais/DNS;sem novo serviço ou custo,sem push/merge/main. Servidor QA3117 encerrado e homologação3107 retomada.

Rollback desta entrega: dpl_4uRVQpZ4NT8AdzYb5zd7oxBJ5Ucf (a Capelinha da versão7524726),sem restauração de banco. Próximas evoluções opcionais: validação física/leitor de tela e atualização futura de dependências em missão separada. Nenhum impedimento crítico restante para o redesign publicado.
