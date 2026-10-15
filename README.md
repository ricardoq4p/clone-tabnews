# PanteraLab · Casa de oração

Comunidade católica em Next.js, com Santo Rosário Guiado, Capelinha Virtual e partilhas de fé. Preserva a autenticação, os usuários, as comunidades, o painel anterior e os recursos pessoais existentes.

## Experiência

- `/`: acolhimento e mistérios do dia em Brasília.
- `/rosario`: quatro conjuntos, 20 ilustrações originais, roteiro de cinco ou vinte mistérios, orações completas, contas, meditações, recolhimento e retomada local/na conta.
- `/capelinha` e `/minhas-velas`: intenções públicas, anônimas ou privadas; 168 horas exatas calculadas no servidor; histórico e intercessões sem duplicidade.
- `/comunidade`: pedidos, testemunhos, reflexões, comentários, relatos à moderação e grupos existentes.
- `/administracao`: filas paginadas, revisão auditada, edição versionada do Rosário, suspensão de acesso e estatísticas agregadas.
- `/privacidade`, `/fontes` e `/sobre`: cuidados com dados, referências religiosas e créditos.

## Desenvolvimento seguro

Use **Node 22** e `npm ci`. Configure `.env.local` a partir de `.env.example`, usando exclusivamente recursos de desenvolvimento/homologação. Execute `npm run dev`.

O início e o Rosário funcionam sem banco configurado. Persistência na conta, Capelinha e comunidade precisam de MongoDB e autenticação configurados; o site apresenta indisponibilidade explicitamente quando esses recursos não estão conectados. Não há dados fictícios de participantes no produto.

```text
npm test
npm run lint
npm run lint:check
npm run build
```

Depois do build, `npm start` inicia o servidor. Isso não publica o site.

## Teste de navegador (opcional)

`npm run test:browser` usa Playwright disponível no ambiente de QA. Sem dependências adicionais no produto: se o ambiente disponibilizar o pacote fora do projeto, defina `PLAYWRIGHT_MODULE`; para um navegador instalado, defina `QA_BROWSER_EXECUTABLE`. `QA_BASE_URL` deve apontar para localhost (padrão: porta 3107). O script recusa servidores remotos.

Fluxos autenticados do navegador usam respostas HTTP explicitamente simuladas. Testes de API e modelos validam separadamente autorização, expiração, índices e conflitos. Resultados e screenshots ficam em `.qa/`, ignorado pelo Git. Eles não substituem homologação com MongoDB, Brevo, Pusher e Cloudinary reais de teste.

## Continuidade e publicação

Leia [PLANO_DESENVOLVIMENTO.md](PLANO_DESENVOLVIMENTO.md) antes de continuar o trabalho e [o roteiro de homologação](docs/HOMOLOGACAO.md) antes de publicar. Consulte também a [revisão das dependências](docs/SEGURANCA_DEPENDENCIAS.md), incluindo os alertas pendentes das ferramentas de desenvolvimento. O [registro da etapa de segurança](docs/etapa-1.md) documenta a base anterior.

Nenhum deploy de produção, expurgo de dados, configuração de credenciais ou contratação de serviço é executado automaticamente. O script manual de provisionamento administrativo só deve ser usado em ambiente explicitamente escolhido e autorizado.
