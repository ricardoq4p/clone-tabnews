# Experimentar o PanteraLab neste computador

Ambiente exclusivo de homologação local, preparado em 15/10/2026. Não utiliza o banco nem as credenciais de produção. Nenhuma publicação externa é necessária.

## Abrir agora

- Plataforma: http://localhost:3107/
- Caixa de emails: http://localhost:8025/
- Contas de teste e senhas: `.qa/ACESSOS_LOCAIS.md`, arquivo local ignorado pelo Git. Há Ana, José e um administrador. Os emails terminam em `@panteralab.test`; não são pessoas ou caixas externas reais.

O aviso no topo identifica a homologação. Use apenas dados fictícios. Quem tiver acesso ao computador pode consultar o banco e a caixa local; este ambiente não é destinado a informações reais de terceiros.

## Roteiro para sua avaliação

1. Sem entrar, abra o Rosário. Escolha um conjunto, confira imagens e meditações, amplie o texto e experimente o recolhimento. Avance, feche a página e retome. O dia é calculado em Brasília.
2. Entre como Ana. Acesse a Capelinha e confira as velas públicas, anônimas e privadas, além de Minhas velas. Os dados que já aparecem foram criados pelos testes reais neste banco local.
3. Use outra janela anônima para José. A intenção privada de Ana não deve aparecer; o autor da anônima deve permanecer oculto. Clique em Rezei por esta intenção. Repetir a ação não aumenta o número de pessoas.
4. Na comunidade, publique e comente. O formulário de grupos existente continua no feed. A atualização automática entre navegadores depende do Pusher, que está desligado aqui; recarregar lê os dados atuais.
5. Entre como administrador e abra `/administracao`. Explore estatísticas, participantes, denúncias e editor. Para ler uma intenção reservada, informe um motivo; a leitura fica auditada. Moderação oculta conteúdo sem excluir.
6. Crie uma conta fictícia nova pelo formulário. Abra a caixa local, encontre a confirmação e clique no link. Recuperação e reenvio também chegam a essa caixa. Nenhum email sai para a internet.
7. Veja `/privacidade` e registre uma solicitação de teste; ela aparece para seu autor e na fila administrativa. Marcar atendimento não exporta ou apaga dados automaticamente.

Imagens enviadas por usuários estão desabilitadas porque não há Cloudinary de teste configurado. As ilustrações do Rosário são locais e funcionam. IA e Pusher externos também estão desligados.

## Recursos utilizados

| Serviço                     | Endereço                            | Isolamento                                                   |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------ |
| Next.js com build otimizado | localhost:3107                      | Escuta somente 127.0.0.1                                     |
| MongoDB Community 8.0.34    | 127.0.0.1:27027                     | Autenticação, usuário próprio e banco panteralab_homologacao |
| Mailpit 1.31.5              | localhost:8025; SMTP 127.0.0.1:1025 | Captura local, sem relay externo                             |

Banco, emails, segredos aleatórios e relatórios ficam em `.qa/`, ignorado pelo Git. Nada foi instalado como serviço do Windows. Os binários portáteis vieram das distribuições oficiais e foram verificados por SHA-256. Fontes: [MongoDB Community](https://www.mongodb.com/try/download/community) e [Mailpit](https://github.com/axllent/mailpit/releases/tag/v1.31.5).

Para permitir testes repetidos com três contas no mesmo IP, o limite local de login é 50 tentativas por minuto. As janelas locais de cadastro, recuperação e redefinição de senha são de um minuto, preservando seus limites de tentativas. Isso evita bloqueios de 15 minutos durante repetições da homologação; os limites de produção não foram alterados. Os demais limites continuam ativos.

O usuário do aplicativo tem acesso apenas ao banco local. Uma credencial administrativa de bootstrap separada permite criar esse usuário no servidor novo. Ambas permanecem em `.qa/local-stack.json`, nunca no código ou nos PRs.

## Parar e reiniciar

No diretório do repositório, com Node 22:

```text
npm run homologacao:status
npm run homologacao:stop
npm run homologacao:start
```

O runtime portátil já disponível também pode ser usado no PowerShell:

```powershell
& .qa/runtime/node.exe scripts/local-homologation.cjs status
& .qa/runtime/node.exe scripts/local-homologation.cjs stop
& .qa/runtime/node.exe scripts/local-homologation.cjs start
```

Parar preserva banco e emails. Não apague `.qa/` se quiser continuar usando as mesmas contas. A inicialização recusa portas ocupadas, em vez de aproveitar outro banco ou aplicação.

Se o computador for reiniciado, execute start para voltar a abrir os endereços. O serviço só funciona enquanto este computador estiver ligado. Para avaliar responsividade use a emulação de dispositivo do navegador; localhost em um celular físico se refere ao próprio celular, portanto esta configuração não expõe o site na rede.

## Preparar em outra máquina Windows

1. Node 22 e `npm ci`.
2. Executar `scripts/install-local-services.ps1`: baixa somente MongoDB e Mailpit portáteis para `.qa/runtime`, com verificação de hash. O pacote MongoDB é grande; não há contratação de serviço.
3. `npm run homologacao:build` gera segredos locais novos e compila a configuração de homologação. O launcher não usa credenciais de produção e deixa integrações externas vazias, mesmo que existam variáveis no shell.
4. `npm run homologacao:start` inicia o banco autenticado, SMTP e aplicação exclusivamente em loopback.
5. Para criar as contas e executar a verificação real, instalar/disponibilizar Playwright no ambiente de QA, apontar PLAYWRIGHT_MODULE e QA_BROWSER_EXECUTABLE se necessário e rodar `npm run test:local`. Nenhuma dependência extra é exigida no produto.

Não executar esses scripts em um servidor público. Não copiar o banco local ou suas senhas para produção. A inicialização não executa testes nem muda usuários automaticamente; o script test:local é a ação explícita que cadastra e confirma os usuários fictícios, provisiona o administrador local e exerce as APIs.

Após alterações de código, parar, executar homologacao:build e iniciar novamente. Builds comuns sem a configuração local não representam a mesma configuração de homologação.

## Limites

Esta é homologação integrada real de MongoDB, sessões e SMTP local. Não é validação de entrega Brevo, upload Cloudinary ou transporte Pusher externos. Esses serviços exigem contas/chaves de teste e uma nova rodada. Veja `RELATORIO_HOMOLOGACAO.md` e `HOMOLOGACAO.md`.

A integração GitHub/Vercel já gerou previews automáticos dos PRs. Seu isolamento não foi comprovado. Não usar esses previews com dados reais nem fazer novos pushes até revisar os gatilhos de publicação e separar suas variáveis. Qualquer novo preview externo depende de autorização do usuário.
