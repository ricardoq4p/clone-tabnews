# Limpeza e preparação final — 15/10/2026

## Limpeza autorizada executada

Antes da execução foram identificados 17 documentos em `messages` e 20 em `comments`, pelos IDs do inventário previamente auditado. As coleções auxiliares `prayersupports` e `abusereports` não existiam. Nenhuma coleção foi apagada.

A exclusão ocorreu em transação com readConcern snapshot e writeConcern majority, conferindo contagem e hash dos documentos contra o plano antes de deletar. Resultado: 17 publicações e 20 comentários removidos, zero publicações/comentários restantes, zero comentários órfãos. Foram preservados por comparação de contagem e hash: 18 usuários, oito comunidades, 14 registros pessoais/calorias e dois logs administrativos. Não havia progresso, vela ou intenção de oração no inventário de produção; nenhuma dessas funcionalidades foi alvo da operação.

O backup criptografado anterior e sua chave permanecem intactos. SHA-256 reconferido. Nenhum novo backup foi criado para a limpeza e nenhuma recuperação foi realizada. Evidências privadas, sem texto de publicações: `.qa/production-cleanup-plan.json` e `.qa/production-cleanup-result.json`.

## Decisões recebidas do responsável

- Responsável público: Ricardo A Santos.
- Contato público: ricardo.q4p@gmail.com.
- Novas velas/intenções: retenção de 90 dias após expiração, com exclusão mediante solicitação antes disso. Rotina diária após o prazo; somente policyVersion 2026-2. Nenhuma vela existente foi excluída nesta etapa.
- Credencial MongoDB antiga usada somente pelo PanteraLab, conforme confirmação do responsável.
- Exclusão dos três deployments Preview antigos do projeto oficial autorizada separadamente e executada; o deployment atual de produção e a homologação nova foram preservados.

## Código preparado e verificado

- Integrações de produção exigem habilitação explícita; ter credenciais antigas não liga email, IA, Pusher ou upload. SMTP exige STARTTLS.
- Cadastro, recuperação e reenvio recusam a operação antes de gravar usuário/token quando email está desligado. As páginas informam indisponibilidade; contas existentes continuam com login normal. Não há confirmação fictícia em produção; identidade @panteralab.test é recusada no cadastro e login.
- Frontends de perfil e páginas legadas bloqueiam upload/tempo real quando desligados; conteúdo e avatares já existentes não são removidos.
- Página de privacidade ampliada com responsável/contato/finalidades/sensibilidade religiosa/consentimento/cookies/fornecedores/solicitações. Consentimento da intenção explícito e versionado; versões anteriores não são reescritas.
- Rotina `/api/internal/retention`, em lote de 100 por chamada e transação: somente novas velas da versão 2026-2 cujo prazo já venceu há 90 dias; remove auxiliares exclusivos delas. Não toca contas, progresso, comunidades ou logs. Exige projeto de produção exato, habilitação explícita e bearer CRON_SECRET de pelo menos 32 caracteres. Sem isso, não abre conexão. Horário diário preparado em vercel.json, compatível com Hobby; não executado contra produção nesta etapa de limpeza. Monitorar remaining/backlog e falhas; ampliar processamento antes de atingir mais de 100 vencimentos por dia.

143 testes automatizados em 25 suítes e 14 grupos de integração com MongoDB/SMTP local e navegador reais passaram. Build Node 22/Next 16.4.1 aprovado; lint e formatação verificados. Rosário 82/292 etapas, sessões, reset, suspensão, privacidade, expiração, moderação e comunidade incluídos. Nenhum dado real foi copiado para homologação.

## Credenciais e rollback

Novo usuário MongoDB de produção com readWrite somente em tabnews e escopo tabnews-cluster; conexão validada com 18 usuários e comunidade vazia, acesso a outro banco negado. O usuário antigo perdeu atlasAdmin e ficou readWrite no mesmo banco/cluster, exclusivo do deployment anterior e de seu rollback protegido. A senha antiga não foi trocada para preservar o rollback; não usar esse usuário em novos deploys. Previews antigos removidos e novos escopos não o recebem. Avaliar revogação após encerrar a janela de rollback.

NEXTAUTH_SECRET novo e credencial MongoDB nova são exclusivos dos novos deployments de produção. As 28 variáveis do projeto oficial foram conferidas como exclusivamente Production, sem valores publicados neste documento. Novo segredo NextAuth, conexão MongoDB e segredo cron são distintos dos ambientes de teste. A homologação mantém projeto, banco e segredos próprios.

Rollback: deployment anterior `dpl_79kS5op2dxw4hqeknq3v5iEthgAj`, com seus valores históricos e usuário agora restrito, permanece preservado. Não reconstruir cegamente esse deployment: seu inventário de fontes contém arquivo antigo `.vercel.production.env` e cache. Novos uploads excluem também `*.env`. Voltar ao deployment não restaura dados nem comentários intencionalmente excluídos. A rotina cron precisa ser desativada em rollback porque a plataforma pode manter o agendamento.

## Fontes e limites

[ANPD: perguntas frequentes](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes) e [direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares) consultados para a revisão. Informações religiosas podem ser sensíveis; consentimento não substitui a operação real de atendimento. Não foi emitida certificação de conformidade jurídica ou aprovação eclesiástica.

[Vercel: gestão de cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs) consultada: rotina diária incluída no Hobby, sem contratação; precisão dentro da hora e rollback não atualiza automaticamente o agendamento. É necessário confirmar execução/monitoramento depois da publicação; não declarar que um cron preparado já rodou.

## Estado da publicação

**Publicado com sucesso:** https://panteralab.com.br . Código implantado: `8db6bcb`, deployment `dpl_2i63NjkNdT9ZrdbbCpSHyX9funUX`, projeto oficial existente `clone-tabnews`. Branch de desenvolvimento; nenhum push, merge ou alteração da main. Nenhuma alteração de DNS ou nova associação conflitante.

Construído em target Production com --skip-domain. API confirmou autoAssignCustomDomains=false e domínio ainda na versão anterior durante toda a validação. Sete grupos no deployment protegido passaram, incluindo 82 etapas do Rosário, páginas 390/1440px, APIs, registro/recuperação/reenvio desligados antes de alterações, contas fictícias recusadas, administração negada ao visitante, privacidade e igualdade byte a byte dos registros protegidos. O administrador existente foi confirmado como a conta verificada do contato fornecido pelo responsável; não foi pedido nem utilizado seu password.

Depois dos resultados aprovados, o deployment foi promovido. A API do alias confirmou panteralab.com.br apontando exatamente para esse ID. Outros sete grupos passaram no domínio oficial, sem bypass, com zero erros JavaScript e registros protegidos novamente idênticos. Não foram criadas contas fictícias nem publicações/velas de teste em produção. Login/cadastro/reset positivos e permissões de três perfis foram exercitados na etapa local segura; não simular autenticação de usuário real em produção nem alegar que sua senha foi testada.

A chave temporária de QA foi revogada; o domínio oficial é público e a URL imutável da Vercel continua exigindo autenticação, inclusive quando enviada a chave revogada. A configuração de cron foi confirmada ativa no deployment correto, schedule 0 6 \* \* \* (diariamente, por volta de 03h de Brasília). Uma invocação autorizada no estágio protegido encontrou zero elegíveis e removeu zero velas. A primeira execução agendada ainda deve ser acompanhada. Sem upgrade ou contratação.

### Recursos e limitações ao entrar no ar

Disponíveis: Rosário visitante/cadastrado, retomada local/na conta, contas antigas e login, Capelinha, privacidade pública/anônima/privada, 168 horas, histórico, intercessões, comunidade vazia para novos conteúdos, comentários, moderação, administração e solicitações de dados.

Desligados: cadastro de novas contas, recuperação e reenvio de email, novos uploads Cloudinary, avisos Pusher e assistente IA. Credenciais existentes não são ativação. Para habilitar, validar cada serviço e somente então alterar a flag correspondente. Dados de perfil e imagens já existentes permanecem. A troca do segredo NextAuth exige entrar novamente; não há alteração de senha das contas.

Rollback disponível para o deployment anterior preservado, com usuário antigo agora readWrite restrito e conexão verificada. Segredos do deployment anterior não são substituídos automaticamente quando variáveis do projeto mudam. Não restaurar variáveis antigas em Preview/Development nem reconstruir fonte antiga com .env. A configuração atual mantém os novos deploys isolados.

```powershell
.qa/runtime/node.exe .qa/vercel-cli/node_modules/vercel/dist/index.js rollback dpl_79kS5op2dxw4hqeknq3v5iEthgAj --scope ricardo-alves-dos-santos-projects --global-config .qa/vercel-auth --non-interactive --no-color --yes
```

Em rollback, desabilitar a rotina em Vercel > clone-tabnews > Settings > Cron Jobs; conferir o alias e as páginas. Não apagar nem importar o banco; as exclusões autorizadas não devem ser revertidas como parte de rollback de código. O código legado tem limitações de segurança/integracões já diagnosticadas, portanto o retorno deve ser temporário e acompanhado. O rollback não foi executado, para não desfazer uma publicação saudável.

### Operação e próximos passos

- Acompanhar erros/login e o primeiro cron agendado; verificar remaining=0 e falhas da rotina. Lote atual de 100: revisar capacidade/monitoramento antes de volume superior a 100 intenções vencidas por dia. Nenhuma intenção anterior à versão 2026-2 é alvo dessa rotina.
- Pedidos de exclusão/exportação/correção continuam com atendimento humano pelo responsável. Retirar exposição pública imediatamente quando cabível, conferir identidade e escopo, planejar a operação, registrar o atendimento sem reproduzir intenção sensível nos logs. Marcar um pedido como atendido não apaga os dados sozinho.
- A regra de 90 dias aprovada aplica-se às novas intenções; contas/comunidade/progresso/logs/backups não recebem descarte automático nesta mudança. O backup prévio foi preservado por decisão expressa. Definir retenção dessas outras categorias e revisão jurídica operacional, inclusive menores/transferências, sem alegar certificação geral LGPD. Nova necessidade de descarte deve ter escopo próprio aprovado.
- Manter os PRs #15/#16 e commits posteriores coordenados antes de qualquer futuro push/merge. main ainda contém a versão antiga; um deploy Git dessa branch poderá reverter a nova plataforma. Não fazer push incidentalmente. Não mudar produção para o projeto de homologação.
- Reavaliar a janela de rollback e então revogar a credencial legada; ela não é usada pelo código novo, mas é necessária ao deployment antigo preservado. Não devolver permissão atlasAdmin.
- Brevo, Cloudinary, Pusher e IA precisam de validação própria antes da habilitação. Revisões editoriais católicas e acessibilidade em dispositivos físicos continuam indicadas; recursos de oração não foram apresentados como aprovação eclesiástica.

Evidências privadas: `.qa/production-env-after-change-metadata.json`, `.qa/production-admin-and-rollback-verification.json`, `.qa/production-stage-qa-report.json`, `.qa/production-public-qa-report.json`, `.qa/production-final-project-status.json`, `.qa/production-official-alias-verification.json`. Não imprimir os arquivos de segredos ou credenciais.
