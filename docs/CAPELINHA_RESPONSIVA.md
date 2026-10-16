# Capelinha: dimensionamento pela janela

Base: `c658b61`, que inclui o código publicado `eef33a3`. Pré-verificação pela
API da Vercel confirmou o projeto oficial `clone-tabnews` e o domínio
`panteralab.com.br` no deployment `dpl_4Xxk5EoNqsyTjCepE9Fb3ZdiAcAx`.
As branches remotas ainda não contêm todo esse histórico; não usar `main` como
base para esta publicação. Branch de trabalho: `fix/chapel-viewport-fit`.

## Alteração visual

- `styles/Chapel.module.css`: em larguras a partir de 1024px, introdução mais
  compacta, controles ao lado do cenário e largura limitada simultaneamente pela
  coluna e pela altura restante em `100dvh`. A imagem e o contêiner mantêm 3:2.
- `components/prayer/ChapelScene.js`: `ResizeObserver` mede a posição real do
  cenário após cabeçalho, introdução e abas. Atualiza somente a variável CSS
  `--chapel-top`; não altera estado, dados, seleção ou lógica das velas.
- `scripts/chapel-viewport-qa.cjs`: verificação local com APIs interceptadas e 13
  registros sintéticos, seis velas por página. Não consulta banco nem serviços
  reais. Usa `PLAYWRIGHT_MODULE`, `QA_BROWSER_EXECUTABLE` e `QA_BASE_URL` opcionais.

A altura mínima proporcional mantém a composição utilizável em janelas curtas;
nessas condições, rolagem natural é permitida. Nos celulares permanece a
apresentação vertical e os controles equivalentes com alvo mínimo de 44px.
O conteúdo inferior, formulário, histórico e detalhes selecionados continuam
acessíveis por rolagem. Não existe corte ou ocultação para forçar encaixe.

Imagem original preservada byte a byte, SHA-256
`076db5e69b372bc45e7ff4b88b9ca60cffc388f38e0a0d8a93392b50fd0b1ffd`.
Posições, proporções e alturas das velas em `CHAPEL_SLOTS` não foram alteradas.
Sem mudanças em APIs, autenticação, banco, expiração, privacidade, dependências
ou funcionalidades de outras páginas.

## Verificações

- 158 testes em 27 suítes passaram, com Node 22.23.3.
- ESLint nos 159 arquivos JavaScript versionados mais o novo roteiro passou;
  a seleção explícita evita percorrer ferramentas e artefatos privados em `.qa`.
- Prettier global passou. Build de produção passou com o aviso preexistente de
  futura descontinuação de React 18 no Next.js.
- Matriz: 1920×1080, 1440×900, 1366×768, 1280×720, 768×1024, 390×844, 320×568.
- Imagem inteira em 3:2, seis velas dentro dos limites e coordenadas relativas
  conferidas. Em desktops, imagem e atualização/paginação cabem na janela.
- Seleção por mouse, toque e teclado, detalhes, paginação e atualização passaram
  com fixtures; sem transbordamento horizontal ou erros JavaScript.
- Capturas e medições privadas em `.qa/viewport-*.png` e
  `.qa/viewport-results.json`. Não são incluídas na publicação.

## Publicação

Preparar deployment no projeto oficial, sem promover domínio automaticamente.
Confirmar READY e metadado do commit testado antes da promoção. Validar domínio,
imagem e geometria publicadas depois. Sem alterações de DNS, variáveis ou contas.
Rollback visual: `dpl_4Xxk5EoNqsyTjCepE9Fb3ZdiAcAx`, sem restaurar banco.
