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

NEXTAUTH_SECRET novo e credencial MongoDB nova são exclusivos dos novos deployments de produção. As variáveis do projeto antigo serão limitadas a Production antes de construir a candidata, sem valores publicados neste documento. A homologação mantém projeto, banco e segredos próprios.

Rollback: deployment anterior `dpl_79kS5op2dxw4hqeknq3v5iEthgAj`, com seus valores históricos e usuário agora restrito, permanece preservado. Não reconstruir cegamente esse deployment: seu inventário de fontes contém arquivo antigo `.vercel.production.env` e cache. Novos uploads excluem também `*.env`. Voltar ao deployment não restaura dados nem comentários intencionalmente excluídos. A rotina cron precisa ser desativada em rollback porque a plataforma pode manter o agendamento.

## Fontes e limites

[ANPD: perguntas frequentes](https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes) e [direitos dos titulares](https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados/direito-dos-titulares) consultados para a revisão. Informações religiosas podem ser sensíveis; consentimento não substitui a operação real de atendimento. Não foi emitida certificação de conformidade jurídica ou aprovação eclesiástica.

[Vercel: gestão de cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs) consultada: rotina diária incluída no Hobby, sem contratação; precisão dentro da hora e rollback não atualiza automaticamente o agendamento. É necessário confirmar execução/monitoramento depois da publicação; não declarar que um cron preparado já rodou.

## Estado da publicação

A candidata será publicada com --target production --skip-domain no projeto oficial. Conferir proteção, configuração, endpoints e integridade antes da promoção; manter domínio na versão anterior se houver falha. O registro final desta seção será atualizado após essa validação.
