# Preview Vercel isolado — preparação e critérios de publicação

Atualizado em 15/10/2026. O usuário autorizou um preview externo isolado, sem custos, sem produção e sem alterar panteralab.com.br. **Nenhum novo deploy ou push foi realizado nesta etapa.**

## Situação verificada

- Branch local: feat/catholic-prayer-platform. A homologação local funciona com MongoDB autenticado e SMTP próprios; não transportar suas credenciais para a nuvem.
- O projeto Vercel antigo tem automação de previews nos PRs. Suas variáveis e a proteção de acesso ainda não foram inspecionadas, portanto seu isolamento não está comprovado.
- Não há CLI autenticada nem token Vercel disponível no processo ou nos locais padrão de sessão consultados. Não há chave Atlas no processo.
- Vercel e MongoDB Atlas foram encontrados como integrações disponíveis, mas a instalação/conexão ainda não foi confirmada. O usuário informou que vai conectar ambos. Retomar a verificação quando isso ocorrer; não solicitar segredos pelo chat.

## Configuração proposta

### Projeto e publicação

Criar um **novo projeto Vercel**, com nome sugerido panteralab-homologacao (sujeito à disponibilidade), na conta autorizada. Não importar/copiar variáveis do projeto antigo e conferir também variáveis compartilhadas da equipe e integrações herdadas. Não associar domínio personalizado.

Criar o projeto sem um fluxo de importação que publique automaticamente no target Production. Usar somente deploy com target **Preview**; nunca --prod, promoção ou alias de produção. Somente o domínio .vercel.app efetivamente atribuído será informado ao usuário. Não inventar um endereço antes de criá-lo.

Um novo projeto não impede que um push nesta branch dispare o projeto antigo. Antes de qualquer push, inspecionar esse caminho também. Se o projeto antigo mistura segredos entre Production e Preview, interromper publicação/push e apresentar o problema; não alterar silenciosamente suas configurações de produção. Quando permitido e verificado, um deploy por CLI a partir do checkout local no projeto novo pode evitar o gatilho Git antigo, sem exigir push.

### Proteção de acesso

Habilitar e verificar Vercel Authentication para previews antes de disponibilizar a aplicação. Confirmar a cobertura de todas as URLs e aliases do preview e quem pode acessá-los. Utilizar somente opções já incluídas no plano da conta; se houver cobrança ou upgrade obrigatório, parar. A proteção do ambiente é separada do login dos participantes da aplicação.

Não criar bypass permanente, link público de acesso compartilhado ou variável de automação que contorne essa proteção sem necessidade e autorização específicas. Testar acesso sem sessão Vercel e comprovar que o conteúdo/API não ficam públicos. Noindex é apenas indicação aos buscadores, não controle de acesso.

### MongoDB

Criar um projeto Atlas e um cluster **Free** exclusivos de homologação, se disponíveis sem cobrança. Não usar o cluster de produção, mesmo com outro nome de database. Banco sugerido: panteralab_homologacao_vercel. Criar usuário novo com senha aleatória e readWrite somente nesse banco, sem privilégios administrativos ou readWriteAnyDatabase.

Verificar plano gratuito, projeto/cluster reais, TLS e conectividade com a Vercel antes de disponibilizar a aplicação. Não ampliar a allowlist de rede de um projeto existente de produção. Caso a conectividade exija abertura de rede adicional, documentar as opções e os limites do plano antes de aplicar; não fingir que uma conexão não validada está pronta.

Criar somente dados fictícios e usuários exclusivos. Não enviar o banco, emails ou senhas da stack local ao repositório ou à Vercel. Não executar migração ou carga de produção.

### Variáveis do novo projeto

Configurar exclusivamente no escopo Preview, após conferir o ID do projeto destino. Modelo sem segredos: `.env.preview.example`.

| Variável                                 | Valor/procedência                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------- |
| MONGODB_URI                              | Novo cluster e usuário exclusivos, banco panteralab_homologacao_vercel          |
| NEXTAUTH_SECRET                          | Gerado novamente para este preview; não reutilizar segredo local ou de produção |
| NEXTAUTH_URL                             | URL HTTPS exata e estável do preview, conferida na Vercel                       |
| NEXT_PUBLIC_APP_ENV                      | homologacao-vercel                                                              |
| EMAIL_DELIVERY_DISABLED                  | true enquanto não existir SMTP de teste                                         |
| PANTERALAB_LOCAL_SMTP                    | false; localhost SMTP não existe na função Vercel                               |
| ALLOW_LEGACY_EMAIL_VERIFICATION_FALLBACK | false                                                                           |
| TRUST_PROXY_HEADERS                      | false inicialmente; alterar só após validar o proxy e suas implicações          |
| BREVO\_\*, EMAIL_FROM                    | Ausentes enquanto não houver serviço próprio de teste                           |
| PUSHER*\* e NEXT_PUBLIC_PUSHER*\*        | Ausentes enquanto não houver aplicativo próprio de teste                        |
| NEXT*PUBLIC_CLOUDINARY*\*                | Ausentes enquanto não houver cloud/preset próprios de teste                     |
| OPENAI_API_KEY                           | Ausente; IA desligada e sem consumo pago                                        |
| SUPERADMIN_EMAIL                         | Ausente; email não concede papel administrativo                                 |

Conferir nomes, escopos, referências compartilhadas e origem de cada valor, sem imprimir os segredos. Na proteção adicional do código, EMAIL_DELIVERY_DISABLED=true impede criar qualquer transporte SMTP; credenciais ausentes também falham antes de abrir conexão. O modo SMTP local recusa ambiente Vercel.

Se o hostname estável só for atribuído ao criar o primeiro deployment protegido, conferir e ajustar NEXTAUTH_URL no projeto novo e repetir o Preview antes de criar contas ou entregar o link. Validar callback, cookies HTTPS, csrf/origem e links absolutos. Não usar panteralab.com.br, localhost ou a URL do projeto antigo.

### Contas e emails de teste

Sem SMTP de teste, confirmação/reenvio e recuperação por email ficam indisponíveis. O cadastro mantém a exigência de verificação; não acrescentar um bypass de autenticação.

Para permitir testar a Capelinha, após confirmar o cluster e o isolamento, provisionar contas fictícias verificadas por rotina administrativa controlada no banco exclusivo. Criar senhas novas para o preview e apresentar os acessos em arquivo local ignorado ou canal apropriado, nunca no Git/PR/logs. A rotina e os registros devem deixar claro que se trata de massa de teste. O administrador também recebe papel explicitamente, sem confiar no email.

## Proteção do pacote

`.vercelignore` exclui `.qa/`, bancos, emails capturados, runtimes, node_modules, .next, .vercel, logs e arquivos .env. Não publicar artefatos de build local com configuração de localhost. Compilar novamente com as variáveis do projeto novo. Confirmar o conjunto de arquivos enviado pela CLI antes do deploy. Não versionar segredos, arquivos de acesso nem exportações de ambientes.

## Verificação após deploy

1. Acesso bloqueado sem autenticação Vercel; todos os aliases/URLs protegidos.
2. IDs do projeto/cluster e target Preview conferidos; domínio de produção e main intactos.
3. Página inicial, quatro conjuntos do Rosário, roteiro completo, imagens locais e retomada como visitante.
4. Login real de dois participantes, cookies HTTPS, logout e isolamento de progresso/histórico.
5. Três visibilidades de vela, 168h determinadas no servidor, intercessão única concorrente e histórico.
6. Expiração de vela sintética criada especificamente para a fronteira do teste; nenhuma alteração em dados existentes de produção.
7. Papel administrativo, auditoria antes de ler texto privado e moderação sem renovação de prazo.
8. Mobile e teclado; ausência de erros no cliente e nos logs do novo projeto.
9. Falhas previstas de email/upload/tempo real informadas como indisponibilidade, sem tentativas externas indevidas.
10. Entregar URL real, proteção/acessos, serviços verificados, limitações e relatório atualizado.

Só registrar os itens como aprovados depois de executá-los no preview real. Os testes locais não comprovam a configuração de um projeto Vercel remoto.

## Referências oficiais consultadas

- [Variáveis de ambiente da Vercel](https://vercel.com/docs/environment-variables)
- [Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication)
- [Atlas Free Cluster](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster/)
- [Usuários e privilégios de banco no Atlas](https://www.mongodb.com/docs/atlas/security-add-mongodb-users/)

Essas opções dependem do plano, da conta e das permissões efetivamente disponíveis, que ainda precisam ser verificadas.
