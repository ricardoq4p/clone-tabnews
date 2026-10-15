# Auditoria UX/UI e design system — 15/10/2026

## Escopo e preservação

Referências 7524726 e 2b7b6ba confirmadas como ancestrais da branch feat/catholic-prayer-platform. Esta entrega trata exclusivamente de apresentação, atributos de acessibilidade e documentação. Nenhum arquivo de API, modelo, autenticação, permissão, conteúdo religioso, motor/progresso do Rosário, lógica/paginação das velas ou ações administrativas foi modificado. A imagem original permanece byte a byte idêntica.

## Problemas encontrados

- O CSS especializado usava fontes de 8–11px em avisos, legendas, ações e informações administrativas. A auditoria inicial encontrou 22 elementos menores que 12px na Capelinha móvel e 11 na administração.
- Cabeçalho de 98px no desktop e 76px no celular consumia espaço; o menu tinha pouco destaque para a seção atual e não reconhecia páginas associadas, como histórico de velas e feed.
- Campos, botões secundários, abas, ações de moderação e cartões tinham dimensões diferentes entre páginas modernas e ferramentas de perfil/comunidades existentes.
- O perfil mantinha um rótulo ciano claro com contraste insuficiente, e um botão podia quebrar a palavra em duas linhas no celular.
- Alguns campos de criação/edição de comunidade e publicação nas ferramentas existentes dependiam apenas de placeholder para identificação acessível.
- Textos longos, controles e espaços podiam ser melhor aproveitados em telas grandes e ampliados em telas pequenas. Não foi identificada rolagem horizontal na linha de base dos oito caminhos principais.

## Padrões adotados

O novo styles/design-system.css é uma camada compartilhada, restrita a .prayer-app, carregada após os estilos existentes. Estilos específicos e a paleta própria do santuário permanecem em Chapel.module.css. Não há novas dependências, imagens ou fontes externas.

| Elemento    | Padrão                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Títulos     | Georgia/Times New Roman, fontes já existentes; escala principal de 30–44px                     |
| Texto       | Arial/Helvetica, 16px de base; textos explicativos de 16–17px                                  |
| Metadados   | Geralmente 14px; pequenas etiquetas decorativas de 11–12px                                     |
| Cores       | Marfim #f6f3ec, branco quente #fffefb, azul #253e48, dourado #765b2d, texto secundário #56625c |
| Estados     | Sucesso #365c42, erro #963c34, foco #203d59                                                    |
| Container   | Máximo 1280px; leitura até 740px; margens móveis de 16px                                       |
| Cabeçalho   | 72px desktop e 64px nas telas menores                                                          |
| Controles   | Botões principais e campos com pelo menos 48px; atalhos e ações auxiliares de 44px             |
| Superfícies | Bordas suaves, raio de 12px em cartões e 7px em controles, sombras discretas                   |
| Espaços     | Escala em rem e seções fluidas, evitando alturas artificiais                                   |

Contrastes calculados: texto principal/branco quente 11,19:1; texto secundário/marfim 5,75:1; dourado/marfim 5,73:1; borda funcional/branco quente 3,40:1; erro/branco quente 6,96:1.

## Páginas e componentes

Todas as páginas usam o layout compartilhado ou seus componentes de autenticação. Foram inspecionados os 22 caminhos, incluindo perfil público, edição/atalho de perfil, upload/atalho, comunidade individual e estados sem conteúdo/erro. A página individual de comunidade também foi verificada com registro fictício positivo exclusivamente em Atlas de teste, nas cinco larguras e com formulário de edição aberto.

- Início: títulos proporcionais, descrições e cartões mais legíveis, ações consistentes e espaçamento fluido.
- Navegação: indicação da seção atual também em feed, grupos e histórico; menu inferior com área de toque confortável até tablet; atalhos administrativos mantidos sob as condições originais.
- Rosário: cartões dos mistérios legíveis, uma coluna nos celulares estreitos, controles de texto/foco/navegação maiores e área de leitura preservada.
- Capelinha: imagem intacta, textos e controles ajustados. Nenhuma mudança na cena, seis velas por página, criação, privacidade, duração ou expiração.
- Comunidade, feed e grupos: cartões, comentários, campos e ações com a mesma escala; nomes acessíveis nos campos antes dependentes de placeholder.
- Perfil e administração: tema claro coerente, contraste corrigido, formulários legíveis, abas e ações que se reorganizam. Exclusão definitiva continua com revisão, motivo, confirmação e autorização originais.
- Sobre, fontes e privacidade: coluna de leitura de 740px, corpo de 17px e maior altura de linha.
- Login, cadastro, recuperação, redefinição e confirmação: componentes de formulário compartilhados. Estados de integrações indisponíveis são preservados.

As confirmações nativas de exclusão não foram substituídas; o sistema mantém o comportamento existente. Tokens de superfície também definem uma apresentação consistente para diálogos HTML existentes ou futuros, sem introduzir lógica de modal.

## Validação e limites

A linha de base possui capturas antes/depois dos oito caminhos principais em 390/1440px, além de capturas públicas anteriores do Rosário carregado e do santuário. Varredura após alterações: 110 combinações (22 rotas × 320/390/768/1024/1440px), sem transbordamento horizontal ou erros JavaScript; campos visíveis com nomes acessíveis. A análise espera os controles do Rosário aparecerem, evitando validar apenas a tela de carregamento.

158 testes em 27 suítes, ESLint de todos os arquivos JavaScript versionados, Prettier e build aprovados. Axe nos escopos WCAG 2 A/AA, 2.1 AA e 2.2 AA: zero violações em 11 combinações de página/perfil. Isso não representa certificação WCAG nem substitui avaliação humana com leitores de tela e dispositivos físicos.

Interações verificadas: atalho de teclado para o conteúdo, foco, seleção manual dos mistérios, ajuste de fonte, 82 etapas do Rosário, retomada após recarregar, controles nas cinco larguras, ampliação CSS de 200%, indicação de navegação e login/administração com usuários reais de Atlas de teste. A navegação equivalente do Rosário é mantida para as contas visuais densas, cuja geometria não foi modificada.

Regressões finais aprovadas: comunidade positiva nas cinco larguras e axe sem violações; cinco grupos de exclusão administrativa com transações reais em Atlas isolado, incluindo negativas, cancelamento, confirmação e auditoria; quatro grupos de cena da Capelinha (0/1/13 velas, paginação, expiração, mouse/teclado/toque e movimento reduzido); acendimento privado pela interface e limpeza da seleção ao alternar a visibilidade. Os registros sintéticos foram removidos somente do banco de teste. Ao todo, axe não encontrou violações em 12 combinações de página/perfil, incluindo o formulário de edição da comunidade. Nenhum teste destrutivo é executado em produção. Credenciais, variáveis, integrações, DNS e serviços permanecem como estavam; nenhum custo novo.

## Publicação e rollback

Publicar somente no projeto oficial clone-tabnews, com o domínio existente. A base anterior é dpl_4uRVQpZ4NT8AdzYb5zd7oxBJ5Ucf (código 7524726). O deploy será enviado sem promoção automática, conferido por estado/metadados do build e promovido após os testes locais. As URLs imutáveis continuarão protegidas; esta entrega não cria novas chaves de acesso nem altera credenciais. Conferir o domínio público após promover e usar rollback para a versão anterior caso haja regressão crítica, sem restaurar ou migrar o banco.

## Estado aprovado para publicação

Rodada final concluída sem falhas de aplicação. A captura de conteúdo espera as áreas relevantes ficarem prontas; esperar ausência global de tráfego não foi usado como critério porque há presença e pré-carregamento em segundo plano. Comparações privadas em .qa/ux-before-_.png e .qa/ux-after-_.png; capturas do Rosário em oração em .qa/ux-praying-\*.png. Auditoria .qa/ux-after-audit.json, axe .qa/ux-axe-report.json, comunidade .qa/ux-group-qa.json, interações .qa/ux-functional-report.json, velas .qa/ux-chapel-browser-qa.json e .qa/ux-private-candle-qa.json, administração .qa/admin-delete-integration-report.json. Esses arquivos não são enviados ao Git ou à Vercel.

Conferência somente de leitura do banco oficial: 12 coleções, incluindo 18 usuários, uma vela e um progresso em uso. Os registros são comparados individualmente por hash; horários normais de presença/login são tratados separadamente, sem alterar dados. Nenhuma conta fictícia foi copiada para produção. Pré-verificação confirmou o projeto oficial e 28 variáveis restritas a Production, sem mudar seus valores ou criar tokens.

## Publicação concluída — 15/10/2026

- URL oficial: https://panteralab.com.br .
- Commit publicado e identificado nos metadados: eef33a30fa8324427da236b0c963c847b3a2150b.
- Deployment: dpl_4Xxk5EoNqsyTjCepE9Fb3ZdiAcAx, projeto oficial clone-tabnews.
- Vercel build READY; publicação inicialmente sem trocar o domínio, seguida de promoção. Alias e alvo Production confirmados por API.
- Smoke público: 45 combinações (nove páginas × cinco larguras), tokens/container1280/body16 e cabeçalho72/64 efetivamente carregados, sem rolagem horizontal, erros JavaScript ou respostas de recursos >=500.
- Axe sem violações nas páginas públicas início/Rosário/Capelinha; checagem adicional local com vela ativa selecionada também aprovada, com controles equivalentes acessíveis.
- Imagem original novamente conferida por hash no domínio público; privacidade da API de intenções e bloqueio administrativo de visitantes preservados.
- Todos os registros originais das 12 coleções preservados por comparação individual; contas/senhas/perfis/papéis sem mudanças. Nenhuma escrita de teste em produção.
- Nenhuma alteração de DNS, credenciais, variáveis, integrações, modelos, APIs ou serviços. URLs imutáveis continuam protegidas; nenhuma chave de QA foi criada. Sem push/merge/main.
- Servidor temporário com Atlas de teste encerrado; homologação local retomada em localhost:3107.

Evidências privadas: .qa/ux-public-qa.json, .qa/ux-production-integrity-after.json, .qa/ux-official-alias.json, .qa/ux-deployment-status.json e capturas .qa/ux-public-\*.png. Elas não são publicadas com o código.

Rollback: Vercel CLI rollback para dpl_4uRVQpZ4NT8AdzYb5zd7oxBJ5Ucf no mesmo projeto/escopo. Conferir o alias panteralab.com.br após concluir. Não restaurar backup nem reverter registros para desfazer este redesign.

Pendências de evolução: avaliação humana com leitores de tela e aparelhos físicos; otimização futura do PNG original de 2,25MB somente se houver autorização para gerar derivados; atualização do React 18, cujo aviso de descontinuação futura no Next já existia. Nenhuma dessas frentes altera ou bloqueia a presente atualização de apresentação. Integrações desativadas antes desta entrega continuam com o mesmo estado.
