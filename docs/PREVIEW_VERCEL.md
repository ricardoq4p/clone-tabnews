# Preview Vercel isolado — publicado em 15/10/2026

URL: https://panteralab-homologacao-rao9tm8jy.vercel.app

## Acesso

Primeiro autenticar na Vercel com a conta proprietária do projeto. Depois entrar na aplicação com uma conta fictícia. As três contas e senhas estão exclusivamente no arquivo local `.qa/ACESSOS_PREVIEW.md`, ignorado pelo Git e excluído do upload. Nenhuma senha está neste documento. Usar apenas dados fictícios.

O cadastro também pode ser experimentado com endereço inventado terminado em `@panteralab.test`. A página apresenta um botão para confirmar a conta de teste; não envia email. A confirmação mantém o token de uso único e o login normal. Endereços reais são recusados neste modo. Recuperação e reenvio de email não estão homologados externamente.

## Isolamento confirmado

- Vercel Hobby: novo projeto `panteralab-homologacao`, ID `prj_ZdM6aXzCNoJPZURVCGHj1KTbRIUe`, sem vínculo Git e sem domínio personalizado. Node 22.x. Vercel Authentication cobre todos os previews e URLs de deployment.
- Deployment atual: `dpl_BDiL34U6gjQmwtg7SFTU9CLF5GWj`, READY, Preview (a API representa este target como null). Nenhuma promoção.
- Atlas: novo projeto `6ad1140763ef399af1157ec9`, cluster `panteralab-homologacao`, AWS US_EAST_1, tier M0 gratuito; banco `panteralab_homologacao_vercel`.
- Usuário novo limitado a readWrite neste banco e neste cluster. Senha e segredo NextAuth novos. Gravação real aprovada e acesso a outro banco recusado.
- Nove variáveis exclusivamente no escopo Preview: MONGODB_URI, NEXTAUTH_SECRET, NEXT_PUBLIC_APP_ENV, EMAIL_DELIVERY_DISABLED, PANTERALAB_LOCAL_SMTP, PANTERALAB_PREVIEW_REGISTRATION, PANTERALAB_PREVIEW_MONGODB_HOST, ALLOW_LEGACY_EMAIL_VERIFICATION_FALLBACK e TRUST_PROXY_HEADERS.
- NEXTAUTH_URL é calculada no servidor a partir de VERCEL_URL, somente quando o ID do projeto e o ambiente Preview conferem. Callbacks, cookies HTTPS e links de confirmação usam a URL exata do deployment.
- Brevo, Cloudinary, Pusher e IA sem credenciais e desativados. Não há contratação ou consumo pago desses serviços.
- O projeto Vercel antigo compartilha registros de credenciais entre Production e Preview. Foi apenas inspecionado; nenhum valor foi copiado e nenhuma configuração foi alterada. Sem push, merge, mudança de main, DNS ou panteralab.com.br.

## Rede e prazo

Vercel Hobby usa saída com IP dinâmico. Para conectar sem serviço pago, a lista de acesso SOMENTE do projeto Atlas novo contém `0.0.0.0/0` temporário até **22/10/2026 às 14:48:23 de Brasília** (17:48:23 UTC). Depois disso o banco ficará indisponível para a aplicação até nova configuração autorizada. A expiração não apaga os dados.

Essa abertura permite tentativas externas de autenticação e não elimina risco de indisponibilidade. Mitigações: dados fictícios, TLS, senha aleatória de 48 bytes, papel restrito, projeto independente e prazo automático. Antes de uso contínuo, reavaliar a rede; não ampliar acesso do projeto de produção.

## Ocorrência de publicação

A CLI 64.2.0 classificou o primeiro envio do projeto novo como Production apesar de `--target=preview`. O build `dpl_A4n9YrQRfh3kMi6wenuEKVNbune2` foi imediatamente cancelado, antes de READY, sem receber as variáveis exclusivas de Preview. Nenhum recurso do projeto de produção original foi alterado. O segundo envio foi confirmado por API como Preview e é o endereço entregue. Conferir sempre o target retornado, mesmo com parâmetro explícito.

## Limitações e continuidade

O Rosário, Capelinha, comunidade, autenticação e administração usam o banco real de teste. Upload externo, entrega Brevo, Pusher e IA continuam desligados. O servidor SMTP local/Mailpit não existe na Vercel; o modo local recusa esse ambiente.

Não fazer push enquanto o projeto antigo puder gerar Preview com segredos compartilhados. O deploy atual usa o checkout local e não depende de push. Mudanças posteriores exigem novo deployment Preview e conferência do target, projeto, proteção e escopos; nunca `--prod`.

A chave temporária de automação criada exclusivamente para os testes foi revogada; não existe link de bypass entregue. Acesso com a chave revogada foi recusado após propagação da configuração.

Consultar `docs/RELATORIO_PREVIEW.md` para resultados dos testes e `docs/RELATORIO_HOMOLOGACAO.md` para a revisão dos PRs, conteúdo religioso e políticas de privacidade. A publicação de homologação não autoriza lançamento em produção.
