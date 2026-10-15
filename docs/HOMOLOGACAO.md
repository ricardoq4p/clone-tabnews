# Homologação antes da publicação

## Ambiente

1. Separar banco, chaves, domínios e SMTP de desenvolvimento dos recursos de produção. Não reutilizar variáveis de produção em previews.
2. Node 22, `npm ci`, `npm test`, `npm run lint`, `npm run lint:check` e `npm run build`.
3. Revisar contas administrativas criadas pelo fluxo anterior. O cadastro atual nunca concede superadmin por email; administradores existentes são preservados. Não executar provisionamento contra um banco desconhecido.
4. Conferir índices das novas coleções. Candle não pode ter TTL; PrayerSupport exige índice único `(userId, targetType, targetId)`; RosaryProgress exige usuário único; RateLimitBucket usa TTL somente para contadores.
5. Confirmar o namespace Cloudinary e restringir tamanho/tipo de upload no preset. Imagens editoriais remotas são limitadas ao Cloudinary configurado.
6. Configurar Pusher público/servidor para o mesmo aplicativo e validar a confiança no proxy antes de ativar TRUST_PROXY_HEADERS.

## Jornada de conta

- Cadastro, email Brevo, reenvio, confirmação, login, recuperação e redefinição de senha.
- Erro de SMTP permite reenvio sem perder a conta. Nenhum erro público contém credenciais ou detalhes internos.
- Conta suspensa/deletada, mudança de papel e redefinição de senha invalidam sessões antigas.
- Trocar de conta ou encerrar sessão não mostra histórico privado ou progresso de outra conta. Telas legadas são remontadas por conta; módulos novos isolam os escopos.

## Rosário

- Conferir os sete dias, incluindo 02:59:59Z/03:00:00Z em Brasília.
- Conferir cinco dezenas e 53 Ave-Marias no terço; 20 mistérios e 203 Ave-Marias no roteiro completo. Pai-Nosso, Glória e encerramento presentes.
- Revisar linguagem devocional com responsável editorial católico. Meditações são originais e referências não pretendem ser citações literais da Bíblia.
- Retomar como visitante e usuário, fechar/reabrir navegador, alternar dispositivos e produzir conflito de revisão. Nunca sobrescrever silenciosamente.
- Editar conteúdo no painel; iniciar uma nova oração com a edição atual e retomar uma antiga na edição arquivada.
- Imagens, crédito, tamanho de texto, teclado, leitor de tela, recolhimento e movimento reduzido.

## Capelinha

- Criar velas públicas, anônimas e privadas com duas contas diferentes.
- Respostas públicas de velas anônimas não podem conter nome, email, avatar ou identificador do autor.
- Contas diferentes não acessam intenções privadas por ID, histórico ou endpoints de intercessão.
- Expiração: antes, no instante e após `createdAt + 604800000 ms`; repetir com aba fechada e ao retornar ao navegador.
- Velas expiradas continuam no histórico e somem da área pública sem cron e sem TTL.
- Enviar muitas requisições paralelas de oração com o mesmo usuário/alvo; apenas um registro deve existir no MongoDB real.
- Privacidade e retirada não renovam o prazo; restaurar moderação não altera expiresAt.
- Repetir indisponibilidade de rede e conexão lenta; nenhuma mensagem deve afirmar uma gravação que não aconteceu.

## Comunidade e administração

- Publicações legadas continuam visíveis conforme as permissões; categorias novas não exigem migração destrutiva.
- Comentários em publicação privada/oculta precisam da permissão atual. Nome de apresentação nunca prova propriedade.
- Canais Pusher privados exigem autorização. Eventos contêm somente invalidação; clientes refazem a leitura autorizada.
- Falha do Pusher não duplica uma gravação. Comentários são carregados sob demanda.
- Revisão administrativa precisa de motivo e registro antes de retornar o texto. Falha de auditoria impede o acesso.
- Moderação esconde/restaura sem apagar. Vela retirada pelo autor não é reativada pela moderação.
- Solicitações de privacidade exigem atendimento humano. Marcar uma solicitação como atendida não exclui dados nem entrega um arquivo automaticamente.

## Privacidade e operação

Antes do lançamento, o responsável deve definir controlador e canal de contato, base legal para dados sensíveis, retenção de velas e backups, atendimento de direitos e tratamento de menores. O texto público atual explica a funcionalidade, mas não substitui essa definição operacional/jurídica.

Não configurar descarte automático sem política aprovada. Planejar backup/retorno e revisão das migrações antes de qualquer operação de produção. Esta entrega não realizou nenhuma dessas operações contra produção.

## Limites da validação automatizada

A suíte unitária/API usa substitutos dos serviços, e o script browser-qa usa fixtures nos fluxos autenticados. A etapa posterior acrescentou local-integration-qa com MongoDB e SMTP locais reais, sem substituir respostas da aplicação. Essa rodada foi aprovada; veja RELATORIO_HOMOLOGACAO.md e HOMOLOGACAO_LOCAL.md. Brevo, Cloudinary e Pusher externos de teste permanecem pendentes, assim como as revisões operacionais acima.
