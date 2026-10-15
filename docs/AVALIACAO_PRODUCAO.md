# Avaliação de lançamento em produção — 15/10/2026

## Decisão

**NÃO PUBLICADO.** A autorização de produção é condicionada à segurança/integridade. A auditoria encontrou segredo e banco compartilhados com previews antigos, referências inconsistentes em comentários e política operacional incompleta. Nenhum deployment, alteração de variável, domínio, papel, índice ou documento de produção foi executado. Nenhum push/merge. O domínio mantém a versão anterior.

## Ambiente identificado

- URL oficial: https://panteralab.com.br . Página inicial, login e cadastro responderam HTTP 200; `/api/auth/session` respondeu 200 com sessão vazia para visitante. Isso comprova disponibilidade HTTP, não login/cadastro/email de usuários reais.
- Projeto responsável: `clone-tabnews`, ID `prj_FRcbozdufCmWfO6FNmFLtyYwKT1S`, equipe `team_Vt0Io5oaNuqVHV3JhHFQIoYj`. Domínio verificado e associado; não criar segunda associação. Node 22.x, plano Hobby.
- Deployment atual READY: `dpl_79kS5op2dxw4hqeknq3v5iEthgAj`, URL `clone-tabnews-k34leh2hh-ricardo-alves-dos-santos-projects.vercel.app`.
- Metadados do deployment apontam `27ce847324820119062c1499e70f09773b50eadc`, branch `sync-push`, e **gitDirty=1**. O hash é referência do código-base, não prova de árvore exata. Preservar o deployment para rollback; não presumir reprodução idêntica somente por esse commit.
- Banco configurado: `tabnews`, cluster Atlas `tabnews-cluster`, M0, MongoDB 8.0.34, projeto `69ba2a22271430286647e59f`. Conexão SRV com TLS padrão, sem override tls=false. Host diferente da homologação; URI não aparece neste documento.

## Inventário e backup

Auditoria feita com MongoClient, sem carregar modelos conectados ou criar índices, somente consultas. Não há autorização inferida para apagar dados. Foram encontrados:

| Coleção        | Documentos |
| -------------- | ---------: |
| users          |         18 |
| communities    |          8 |
| messages       |         17 |
| comments       |         20 |
| calorieentries |         14 |
| auditlogs      |          2 |
| **Total**      |     **79** |

Todos os 18 usuários estão verificados. Nenhum email terminado em `@panteralab.test` encontrado. Há 1 superadmin, 11 papéis user explícitos e 6 sem papel persistido; todos sem sessionVersion antigo. Os defaults do novo modelo permitem hidratar esses registros. Não atribuímos papéis nem resetamos senhas. O administrador existente requer validação de titularidade, considerando o antigo cadastro por email descrito no PR #15; não foi assumido que ele é indevido.

Backup lógico completo dos documentos, opções de coleções e índices existentes: AES-256-GCM, BSON serializado sem perda de tipos, gzip antes da criptografia. Arquivo e chave somente em `.qa/backups/`, ignorado e excluído dos deploys. Manifesto privado em `.qa/production-backup-manifest.json`.

Verificações: hash do arquivo, leitura do disco, autenticação/descriptografia GCM, descompressão, igualdade byte a byte do payload e desserialização de 79 documentos; duas passagens de leitura permaneceram iguais durante a operação. Nenhum documento foi copiado para homologação e nenhuma restauração foi executada. **Não é snapshot transacional/PIT nem ensaio de restauração em servidor.** A chave permanece no mesmo computador, portanto ainda não existe cópia independente contra perda desse dispositivo. Fazer nova cópia imediatamente antes de um lançamento futuro, pois produção continua recebendo alterações.

SHA-256 do arquivo criptografado: `c7e42f2893383e99b58af2354dcd1c145311d795713e2a9736fa3a8d75febfb8`.

## Compatibilidade encontrada

Validação em memória, com os schemas atuais, a partir do backup descriptografado somente em RAM: 18/18 usuários, 8/8 comunidades, 17/17 publicações e 14/14 registros de calorias passaram. Auditlogs foram preservados, mas não têm modelo correspondente na nova árvore; não afirmar que esses registros foram validados pelo schema novo.

Comentários: 18/20 passam na validação do schema; **2 não possuem messageId**. Outros **2 referenciam publicações inexistentes**. Não é seguro inventar vínculo, excluir ou migrar esses quatro registros. Trata-se de inconsistência legada identificada, sem evidência de ter sido criada pela nova versão. Preservar os registros; preparar tratamento de leitura/administrativo e, caso seja desejada correção dos vínculos, revisar um plano com identificação privada antes de escrever.

A nova versão adiciona índices e coleções. O inventário foi feito com o driver para não disparar autoIndex. Uma futura inicialização Mongoose poderá criar índices declarados; revisar conflitos/carga e registrar a etapa antes de publicar. Não usar syncIndexes/dropIndexes ou migração destrutiva.

## Código candidato e PRs

Consulta atual do GitHub e fetch:

- PR #15 aberto, rascunho, mergeable; `feat/prayer-community-security` em `312bb08`, base main `6403d41`.
- PR #16 aberto, rascunho, mergeable; base #15, head remoto `593af03`.
- Branch local `feat/catholic-prayer-platform`, candidato auditado `429424f`. Contém #15 e #16 por ancestralidade e seis commits locais posteriores ao head remoto, incluindo a melhoria dos cartões (`8e9ba31`). Não publicar apenas o head remoto do PR #16: faltariam correções de homologação e os dias/selo do Rosário.

Confirmação fictícia: `lib/preview-registration.js` exige simultaneamente ID fixo do projeto de homologação, VERCEL_ENV=preview, email `@panteralab.test`, URI/banco/host exclusivos, TLS e SMTP desligado. Não se habilita no projeto de produção. `configurePreviewOrigin` também é restrito ao projeto de homologação e não deve substituir NEXTAUTH_URL oficial. As variáveis de produção consultadas não contêm PANTERALAB_PREVIEW_REGISTRATION ou NEXT_PUBLIC_APP_ENV de teste. Os testes de guardas incluem recusa em produção.

A produção precisa manter o cadastro normal com token entregue por email, ou desativar cadastro/recuperação se a entrega não for homologada. Não configurar confirmação inline para usuários reais. Nenhuma conta/senha de homologação será importada.

## Impedimentos e plano de correção

1. **Credenciais compartilhadas:** NEXTAUTH_SECRET, MONGODB_URI e credenciais de serviços constam nos mesmos registros de env para Production/Preview/Development do projeto antigo. O segredo é diferente do projeto de homologação novo, mas não é exclusivo de produção. Planejar segredo novo exclusivo de produção e credencial de banco restrita; retirar acesso dos novos previews e invalidar/restringir os deployments antigos que já receberam segredos. Alterar somente o escopo não apaga segredos embutidos nos deployments existentes. Rotação invalida sessões e pode afetar a versão anterior; preparar rollback compatível antes de aplicar. Nada disso foi aplicado nesta auditoria.
2. **Dados legados:** preservar quatro comentários com vínculos incompletos e validar tratamento/plano sem adivinhar publicação ou excluir registro. Definir se a primeira versão poderá mantê-los indisponíveis na interface, com preservação integral e acesso administrativo auditado, ou aguardar reconciliação.
3. **Privacidade operacional:** a página descreve visibilidade, histórico e revisão auditada, mas faltam identificação do responsável/controlador, contato real e prazos/processo de retenção, pedidos e backups; menores e dados de terceiros também exigem definição. Não inventar esses dados nem declarar política aprovada. Receber informações do responsável e fazer revisão humana antes de aceitar intenções religiosas de usuários reais. Revisões editoriais católicas permanecem descritas em `RELATORIO_HOMOLOGACAO.md`.
4. **Serviços externos:** há registros de Brevo, Cloudinary, Pusher e OpenAI no ambiente atual. Presença de chave não comprova validade ou configuração segura. Nenhum email foi enviado, upload/evento/IA consumido nesta auditoria. Antes de lançar, homologar Brevo ou desativar cadastro/recuperação com mensagem coerente; validar restrições do preset Cloudinary ou desligar upload; validar Pusher ou desligar tempo real; manter IA desativada até decisão explícita sobre custo e transferência do conteúdo. O funcionamento atual desses serviços não foi alterado.

## Testes e limites desta etapa

125 testes automatizados em 23 suítes aprovados novamente. Incluem autenticação, progresso, privacidade, moderação, idempotência, expiração e guardas de homologação. ESLint sem avisos, Prettier e build local Node 22/Next 16.4.1 aprovados nesta etapa. Build com ambiente local isolado, sem credenciais de produção; stack local reiniciada. Permanece o aviso já conhecido de migração futura do React 18. Rosário com 82/292 etapas, comunidade, administração e responsividade foram validados em homologação nas etapas anteriores; a melhoria recente foi testada de 320 a 1440 px e na virada de Brasília, com seleção manual preservada. Não foram efetuados cadastros, logins com senha de usuário existente, gravações de progresso ou velas em produção.

Não declarar lançamento aprovado com base apenas nos testes substitutos ou de homologação. Os fluxos finais da versão candidata em produção permanecem pendentes porque a publicação foi interrompida.

## Rollback preparado, não executado

O deployment anterior foi identificado e deve permanecer disponível. Uma futura publicação deverá registrar o novo ID e validar domínio/saúde imediatamente. Em falha, usar o rollback da Vercel para `dpl_79kS5op2dxw4hqeknq3v5iEthgAj`, na equipe correta, sem mudar DNS ou importar banco. Exemplo operacional a executar apenas quando houver um deployment novo a reverter:

```powershell
.qa/runtime/node.exe .qa/vercel-cli/node_modules/vercel/dist/index.js rollback dpl_79kS5op2dxw4hqeknq3v5iEthgAj --scope ricardo-alves-dos-santos-projects --global-config .qa/vercel-auth --non-interactive --no-color --yes
```

O comando identifica o projeto pelo deployment; o checkout local segue vinculado à homologação e não deve ser usado para deploy de produção por inferência. Rollback de código não desfaz alterações de dados ou variáveis do projeto. Após rotação de credenciais, validar um rollback que funcione com a nova configuração; o deployment antigo guarda valores da sua época e não deve exigir reativar credencial comprometida.

Recuperação de dados é procedimento separado: conferir manifesto/chave/hash, planejar manutenção e restauração controlada sem sobrescrever gravações novas. Não restaurar automaticamente a coleção inteira nem executar deleção. Nesta etapa nenhum rollback ou restore foi necessário.

## Retomada

Ler este relatório e PLANO_DESENVOLVIMENTO.md. Resolver os quatro itens de impedimento, preparar configurações seguras e plano revisável, renovar backup antes do lançamento e repetir validação. Publicar diretamente no projeto de produção existente somente após todos os requisitos estarem aprovados. Não fazer push/merge como efeito colateral. A homologação continua no projeto separado e o prazo de rede dela permanece 22/10/2026 às 14:48 de Brasília.
