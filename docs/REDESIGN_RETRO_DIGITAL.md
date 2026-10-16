# PanteraLab — candidato Retro Digital

## Base e auditoria — 16/10/2026

Checkout: `C:/Users/Ricardo/panteralab`. Branch isolada: `design/retro-digital`.

A `main` (`6403d41`) não contém a plataforma publicada. O registro `docs/CAPELINHA_RESPONSIVA.md`, em `64b8345`, identifica o código publicado `ac6d8fe`, na branch `fix/chapel-viewport-fit`. Uma leitura HTTP do domínio confirmou resposta 200 e o uso da imagem `capelinha-076db5e69b37.png`. Essa evidência pública confirma o recurso e a disponibilidade, mas não expõe o SHA completo do deployment; a identificação do commit provém do registro versionado da entrega.

A auditoria do grafo revelou que `5435264` (gerenciamento de comunidades) NÃO era ancestral de `fix/chapel-viewport-fit`. A base foi composta de `64b8345` com a reaplicação integral de `5435264`, registrada localmente como `69eb4bc`. O único conflito era no final de `styles/prayer.css`; os dois conjuntos de regras foram conservados. Nenhum merge destrutivo, force push, exclusão de branches ou acesso de escrita à produção foi executado.

Esta distinção é essencial para a revisão: os arquivos de API e os testes administrativos provenientes de `5435264` são preservação de trabalho já existente, não mudanças de negócio introduzidas pelo redesign. O diff visual deve ser revisado contra `69eb4bc`.

A imagem de referência mencionada no pedido não estava anexada à conversa. O candidato segue a composição textual, a paleta e as funcionalidades existentes. Fidelidade à imagem ainda depende de recebê-la e compará-la.

### Achados

- A identidade anterior usava marfim, títulos serifados, curvas e superfícies claras, incompatíveis com a direção Retro Digital.
- Já existia um design system em `styles/design-system.css`, sobre `styles/prayer.css`, além de CSS Modules para o santuário. A arquitetura foi mantida.
- Comunidade e ferramentas de conta usam classes Tailwind antigas; havia cores literais e regras `!important` que exigiam tratamento localizado para preservar contraste.
- A home não consultava publicações nem histórico de velas. Evitou-se introduzir requisições, permissões ou conteúdo fictício nessa página.
- A cena da Capelinha tinha coordenadas relativas, paginação e ajuste à altura via `ResizeObserver`; esses contratos foram mantidos.

## Implementação

| Arquivo                        | Alteração visual                                                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `styles/design-system.css`     | Tokens reutilizáveis para fundo, superfícies, texto, linhas, foco, erros, raios e tipografia. Mantém escala de espaçamento e container de 1280px.                                                                    |
| `styles/retro.css`             | Apresentação retrô, home em janelas, botões, formulários, estados vazios, navegação, Rosário, comunidade, perfil, tabelas e administração. Escopo do tema em `.prayer-app`; classes novas da home usam prefixo `r-`. |
| `styles/prayer.css`            | Regras antigas passam a usar tokens: fundo de badges/comentários, raios de artigos/botões sociais e títulos de autenticação. Conservadas as regras provenientes das duas branches.                                   |
| `styles/Chapel.module.css`     | Somente entorno: cores, tipografia, painéis e controles. Geometria do cenário e das velas preservada.                                                                                                                |
| `components/prayer/Layout.js`  | Fontes locais via `next/font/local`, metadado de cor, rótulo Comunidades e acesso Criar conta. Condições existentes de sessão e superadmin preservadas.                                                              |
| `pages/_app.js`                | Importação da camada visual Retro Digital após os estilos compartilhados.                                                                                                                                            |
| `pages/index.js`               | Hero em duas colunas, imagem original, mensagem solicitada, ações Começar a rezar/Conhecer a comunidade, três cards com imagens e painéis inferiores.                                                                |
| `public/fonts/`                | Pixelify Sans variável e IBM Plex Mono em WOFF2, com licenças OFL.                                                                                                                                                   |
| `scripts/browser-qa.cjs`       | Seletores adaptados ao novo CTA e ao nome acessível já existente da conta; sessão de visitante interceptada no teste local.                                                                                          |
| `scripts/retro-browser-qa.cjs` | Matriz visual, axe, teclado, ampliação de texto e capturas com APIs locais interceptadas.                                                                                                                            |

As páginas de Rosário, Capelinha, comunidades, autenticação, perfil e administração recebem o tema compartilhado. Seus manipuladores, requisições, regras, persistência e conteúdo devocional não foram reescritos.

A oração do dia conserva o cálculo existente dos mistérios e o horário de Brasília. O painel pessoal é um acesso ao histórico real de velas, sem prévia inventada. Últimas publicações não foram acrescentadas à home; permanecem na comunidade, com seu carregamento e suas permissões existentes.

### Tipografia e acessibilidade

Pixelify Sans apenas em títulos; IBM Plex Mono em navegação e controles; Arial/Helvetica em textos e orações. Os subconjuntos Latin incluem os caracteres portugueses compostos (acentos e cedilha). As duas fontes totalizam 26.724 bytes, servidos localmente com `display: swap`, fallback e carregamento do Next, sem conexão ao Google durante a visita.

Fontes e licenças: [Pixelify Sans no Google Fonts](https://github.com/google/fonts/tree/main/ofl/pixelifysans), [IBM Plex Mono no Google Fonts](https://github.com/google/fonts/tree/main/ofl/ibmplexmono).

| Combinação                                    | Contraste calculado |
| --------------------------------------------- | ------------------- |
| Texto `#F2EAD5` / fundo `#080B0A`             | 16,47:1             |
| Texto secundário `#A7C4BC` / painel `#101613` | 9,83:1              |
| Verde `#00E85A` / fundo `#080B0A`             | 11,94:1             |
| Âmbar `#FFB84D` / painel `#101613`            | 10,66:1             |
| Erro claro `#FF8E86` / superfície de erro     | 7,71:1              |
| Borda funcional / painel                      | 4,17:1              |

O vermelho-base `#E94A42` é um token de identidade; texto de erro usa tom mais claro para leitura. Bordas estruturais escuras não são a única forma de identificar controles. Foco âmbar visível, alvos principais de 48px, controles auxiliares de 44px, reflow e preferência de movimento reduzido mantidos. Nenhum efeito CRT animado ou sobreposição sobre imagens/orações foi adicionado.

### Preservação da Capelinha

SHA-256 do PNG original: `076db5e69b372bc45e7ff4b88b9ca60cffc388f38e0a0d8a93392b50fd0b1ffd`.

Sem alteração em `components/prayer/ChapelScene.js`, `lib/chapel-scene.js`, slots, handlers, paginação, privacidade, duração ou expiração. A cena continua em 3:2; as seis velas continuam posicionadas relativamente à mesma imagem. O ajuste pela altura da janela publicado em `ac6d8fe` permanece no CSS Module.

## Validação

Execução com Node 22.23.2 e Microsoft Edge headless. Ferramentas Playwright e axe instaladas somente em `.qa/tools`, ignorado pelo Git; nenhum pacote do aplicativo ou lockfile foi alterado.

- 178 testes em 28 suítes: aprovados.
- ESLint nos arquivos JavaScript versionados: aprovado. A seleção explícita evita auditar dependências privadas de QA.
- Build de produção: aprovado; mantém o aviso já existente de depreciação do React 18 no Next 16.
- Prettier nos arquivos alterados: aprovado.
- Prettier global: cinco avisos preexistentes por diferenças de formatação/fim de linha em `lib/models/CalorieEntry.js`, `tests/calculadora.test.js`, `jsconfig.json`, `postcss.config.js` e `tailwind.config.js`. Conteúdo desses arquivos confirmado idêntico à base, normalizando CRLF. Não foram reformatados neste trabalho visual.
- Capelinha: sete resoluções, imagem completa em desktops, seis velas alinhadas, seleção por mouse/toque/teclado, detalhes, paginação e atualização aprovados.
- Gerenciamento de comunidades: acesso, filtros, URL, edição, cancelamento/Escape, falha/sucesso de exclusão simulada e troca de aba aprovados em 320/768/1280px.
- Fluxos do navegador: seleção e retomada do Rosário, recolhimento, isolamento entre contas, criação anônima e expiração de velas, histórico, revisão auditada, moderação e edição de Rosário aprovados com fixtures.

Matriz solicitada: 1920×1080, 1440×900, 1366×768, 1280×720, 768×1024, 390×844 e 320×568.

Matriz visual: 98 capturas (14 páginas/estados × sete resoluções), sem rolagem horizontal ou erros JavaScript. Axe em 28 combinações (1440px e 320px), sem violações nos escopos WCAG A/AA, 2.1 AA e 2.2 AA. Teclado, atalho ao conteúdo, foco visível, ampliação CSS de texto a 200% e movimento reduzido aprovados. Após o ajuste final do backdrop e da hierarquia do botão Cancelar, os dois estados administrativos afetados foram novamente capturados nas sete resoluções (14 capturas), com axe repetido e aprovado. Nenhum código do aplicativo foi modificado depois desse build.

As capturas e os relatórios de axe ficam em `.qa/retro/`: `report.json` (matriz completa) e `modal-report.json` (revisão final dos estados administrativos). Galeria: `.qa/retro/index.html`. Os registros mostrados nas áreas autenticadas são sintéticos e existem somente nas respostas interceptadas pelo navegador. Não representam dados reais. Verificações automatizadas não equivalem a certificação WCAG; leitores de tela e dispositivos físicos não foram avaliados nesta rodada. Integrações externas e persistência real não foram revalidadas, pois a entrega é visual e não usa credenciais de produção.

## Revisão e publicação

Candidato local, sem push e sem publicação. Conferir capturas e a imagem de referência ainda pendente antes de aprovar produção. Para revisar somente o redesign: `git diff 69eb4bc..HEAD`. Para inspecionar a preservação prévia de comunidades: `git show 69eb4bc`.

Nenhuma alteração de banco, dados de produção, credenciais, DNS ou serviços foi executada. A aprovação do usuário continua necessária antes de qualquer publicação.
