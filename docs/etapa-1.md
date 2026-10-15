# Etapa 1: seguranca e preparacao da comunidade de oracao

Branch: `feat/prayer-community-security`. Base: `6403d418d01d100169141cb02705830e2176cf45`.

## Escopo

Esta entrega prepara autenticacao, isolamento de comunidades, eventos e recuperacao de conta. Rosario, Capelinha, reformulacao visual e ampliacao editorial seguem como etapas posteriores. IA e calorias continuam presentes. Nenhuma credencial de producao e necessaria para testes unitarios ou build.

## Autenticacao e administracao

- Cadastro sempre cria usuario comum e nao verificado, independentemente de SUPERADMIN_EMAIL.
- Login verifica senha e conta antes de gravar presenca. Papeis existentes nao sao reescritos pelo email.
- Cada verificacao de sessao consulta conta e papel atuais. Conta removida, desativada, nao verificada ou com sessionVersion diferente perde a sessao.
- Redefinicao de senha consome o token por atualizacao condicional e incrementa sessionVersion.
- Provisionamento de novos administradores e manual: `node scripts/provision-admin.mjs email-verificado --confirm`, com MONGODB_URI do ambiente explicitamente escolhido. Esse script nao foi executado e nao integra a implantacao automatica.
- Contas privilegiadas antigas precisam ser revisadas antes da publicacao: nao ha como comprovar retroativamente a posse do email de contas que o fluxo antigo verificou automaticamente.
- Reenvio em /resend-verification, com resposta generica e limites compartilhados. Links antigos sem validade so sao aceitos com ALLOW_LEGACY_EMAIL_VERIFICATION_FALLBACK=true; prefira reemitir links e manter false.

## Privacidade e eventos

- Comunidades privadas exigem membro ou proprietario. Conhecer um ID nao permite ler comentarios nem se adicionar a comunidade privada.
- Proprietario pode adicionar uma conta pelo endpoint de participacao com action=approve e userId. A pagina da comunidade inclui formulario por email para o responsavel; fluxo completo de convites sera ampliado na etapa da comunidade.
- Comunidades removidas recebem deletedAt. Publicacoes vinculadas nao viram publicas. Nenhum expurgo ou migracao e executado por esta entrega.
- Eventos Pusher transmitem apenas {refresh:true}, em canais privados para comunidades e canais publicos para o feed geral. Clientes buscam novamente o conteudo pela API autorizada.
- Uma conexao que perdeu permissao pode receber invalidacoes sem conteudo, mas nao novos textos privados. Dados recebidos legitimamente por um cliente nao podem ser apagados remotamente com garantia.
- Falha de notificacao nao transforma gravacao bem-sucedida em erro HTTP.
- Mensagens e comentarios usam paginas de 50 e cursor before, com Carregar mais. Consultas administrativas completas serao substituidas na ampliacao do painel.

## Operacao e homologacao

1. Usar Node 22, conforme .nvmrc e package.json, e instalar com npm ci.
2. Usar banco e chaves exclusivos de desenvolvimento. Nao copiar credenciais de producao para previews.
3. Criar .env.local a partir de .env.example apenas no ambiente de teste. Nunca versionar segredos.
4. RateLimitBucket requer indice TTL expiresAt e usa \_id unico para incrementos atomicos. TTL limpa apenas contadores, nunca velas. Janelas fixas limitam operacao, IP e identidade em todas as instancias.
5. Validar o proxy antes de ativar TRUST_PROXY_HEADERS. Com false, usa IP da conexao, que pode representar o proxy inteiro.
6. Conferir configuracoes do mesmo aplicativo Pusher no servidor e navegador, SMTP Brevo e namespace Cloudinary. Restringir arquivos e limites tambem no preset Cloudinary.
7. Executar npm test, npm run lint e npm run build. O build nao conecta ao MongoDB nem envia emails.
8. Em homologacao: cadastro, confirmacao, reenvio, recuperacao, duas contas em comunidade privada, mudanca de privacidade, remocao de membro, Pusher e revogacao de sessao.
9. Antes de producao: backup e plano de retorno; revisar usuarios privilegiados antigos, indices e tempos de resposta. Esta entrega nao publica em producao.

## Proximas etapas

2. Rosario: conteudo revisado/licenciado, sequencia de oracoes, contas acessiveis, Brasilia e progresso visitante/conta.
3. Capelinha: Candle e PrayerSupport; expiresAt=createdAt+168h no servidor; leitura publica exige expiresAt>agora, privacidade e moderacao; indice unico usuario/intencao. Sem TTL em velas.
4. Comunidade: categorias pedido/testemunho/reflexao, denuncias e admissao privada sem ranking.
5. Painel: moderacao auditavel, edicao versionada e estatisticas agregadas.
6. Identidade: arte licenciada, cores suaves, navegacao e acessibilidade.
7. Validacao integrada, retencao/exclusao e preparacao de publicacao.

## Limites da verificacao

Testes de rotas substituem MongoDB, Brevo e Pusher. Validam autorizacao e contratos sem servicos reais. Entrega de email, indices reais, concorrencia MongoDB e comportamento em multiplas abas precisam de homologacao antes da producao.

## Validacao local

Build executado com o runtime disponivel Node 24.19.0; o projeto continua fixado em Node 22. Repetir verificacoes em Node 22 na homologacao. Lint sem erros; avisos existentes de imagens, texto alternativo e dependencia de efeito permanecem para a etapa visual. Nenhum servico externo foi acionado pelos testes.

Resultado: 40 testes aprovados em 9 suites; build aprovado; ESLint sem erros. A verificacao global de formatacao ainda aponta 22 arquivos legados nao alterados nesta entrega; todos os arquivos alterados e novos passam na verificacao incremental do Prettier.
