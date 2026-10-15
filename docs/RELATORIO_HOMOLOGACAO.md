> Atualização de 15/10/2026: o Preview externo isolado foi publicado e testado. Consulte [RELATORIO_PREVIEW.md](RELATORIO_PREVIEW.md) para o estado atual. O restante deste documento registra a etapa local e as revisões humanas pendentes.

# Relatório de homologação — PanteraLab

Data: 15/10/2026. Ambiente: exclusivamente local, separado de produção. Resultado atual: **plataforma disponível para avaliação visual; homologação externa ainda pendente**.

## Como visualizar

Abrir http://localhost:3107/. Caixa de emails: http://localhost:8025/. Contas fictícias de participante e administrador em `.qa/ACESSOS_LOCAIS.md`, arquivo local ignorado pelo Git. Não copiar essas senhas para outros ambientes. Instruções de navegação, inicialização e encerramento em `HOMOLOGACAO_LOCAL.md`.

## Revisão dos PRs e integração

| PR                                                         | Base                                    | Head revisado                           | Situação consultada                                  |
| ---------------------------------------------------------- | --------------------------------------- | --------------------------------------- | ---------------------------------------------------- |
| [#15](https://github.com/ricardoq4p/clone-tabnews/pull/15) | main, 6403d41                           | feat/prayer-community-security, 312bb08 | Aberto, rascunho, sem conflito informado pelo GitHub |
| [#16](https://github.com/ricardoq4p/clone-tabnews/pull/16) | feat/prayer-community-security, 312bb08 | feat/catholic-prayer-platform, 593af03  | Aberto, rascunho, sem conflito informado pelo GitHub |

A árvore Git confirma que a branch de segurança é ancestral da transformação; main não tem commits ausentes nessa base na consulta realizada. A ordem de revisão é #15 seguido de #16. Depois de eventual integração do #15, será necessário conferir a base do #16 e repetir os checks. **Não publicar a etapa #15 isoladamente**: atualizações de dependências e correções adicionais da entrega posterior também são necessárias.

A revisão foi concentrada em autenticação/revogação, permissões de grupos e intenções, moderação, isolamento de contas, dependências e integrações. O teste com MongoDB real encontrou ajustes que não apareciam nos substitutos unitários; foram corrigidos na branch de desenvolvimento local.

Os comentários do bot Vercel nos dois PRs registram previews automáticos já criados pela integração GitHub/Vercel. Não foi possível comprovar o isolamento de banco/chaves desses previews; eles não foram usados para testes. **Não houve novo push, merge ou publicação nesta etapa**, para evitar outro preview externo sem autorização. As correções e a preparação local ficam em commits locais até revisar os gatilhos e obter autorização para eventual publicação externa. A declaração anterior de ausência de deploy deve ser entendida como ausência de comando manual de deploy; a automação existente do repositório criou previews ao receber os pushes anteriores.

## Ambiente preparado

- Next.js 16.4.1, Node 22.23.3; build otimizado com aviso de homologação local.
- MongoDB Community 8.0.34 portátil, autenticado, banco `panteralab_homologacao`, porta 27027 e usuário próprio sem acesso a outros bancos.
- Mailpit 1.31.5 portátil: SMTP na porta 1025 e caixa web na 8025. Captura mensagens reais do mailer sem encaminhá-las a destinatários externos.
- Todos os serviços escutam somente em 127.0.0.1. Binários oficiais conferidos por SHA-256; dados, logs e segredos ficam em `.qa/`.
- Nenhuma credencial de produção foi consultada ou copiada. Launcher define explicitamente o banco e segredo locais, limpa variáveis externas de serviço e mantém Cloudinary, Pusher e IA desligados.
- Não há alteração destrutiva, migração de produção, contratação ou instalação de serviço Windows. Os testes criam somente dados fictícios no banco local e exercem moderação/recuperação nas próprias contas de teste.

## Resultado da rodada final

Execução final aprovada em **15/10/2026 às 14:10:50, horário de Brasília**: 14 grupos de verificações integradas, nenhum erro JavaScript. **104 testes em 20 suítes**, lint sem avisos, formatação e build aprovados com Node 22.23.3. A primeira execução com serviços reais revelou correções descritas abaixo; os resultados se referem à última rodada concluída.

## Funcionalidades e evidências

| Área                   | Verificação local                                                                                                                                   | Limite                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Cadastro e confirmação | API real, bloqueio de conta não verificada, reenvio e link aberto no navegador; token usado não é aceito novamente; cadastro não concede superadmin | Entrega Brevo externa não testada                                                                                       |
| Autenticação           | Cookies reais, papéis consultados no banco, administrador e duas contas comuns                                                                      | Não usa usuários existentes de produção                                                                                 |
| Recuperação/suspensão  | Redefinição real por token entregue ao SMTP local, uso único e sessões antigas revogadas; reativação exige novo login                               | Sem entrega externa                                                                                                     |
| MongoDB                | Leitura/gravação, índices, suporte concorrente, progresso com revisão e histórico                                                                   | Instância local; Atlas/replicação, latência remota e backup operacional pendentes                                       |
| Rosário                | Percurso no navegador de 82 etapas e de 292 etapas, persistência real e conflito de revisão entre gravações                                         | Simula avanço rápido; não mede uma sessão devocional de duração humana                                                  |
| Capelinha              | 168h calculadas no servidor, datas enviadas pelo cliente ignoradas, três privacidades, histórico e expiração durante leitura posterior              | Não aguardamos sete dias: verificamos a duração criada e uma vela de teste com data de criação correspondente ao limite |
| Intercessão            | Doze requisições concorrentes do mesmo usuário e duas pessoas distintas; unicidade conferida no MongoDB                                             | Carga de produção não medida                                                                                            |
| Administração          | Usuário comum/visitante negados, revisão privada com motivo e auditoria, ocultar/restaurar sem renovar prazo                                        | Processo humano de moderação ainda precisa de responsáveis definidos                                                    |
| Comunidade             | Publicações/comentários reais; grupo privado não admite ingresso nem leitura indevida                                                               | Atualização Pusher externa pendente                                                                                     |
| Solicitações de dados  | Histórico somente do titular e fila administrativa; nenhuma exclusão/exportação automática                                                          | Atendimento operacional e políticas precisam ser definidos                                                              |
| Visual                 | Avaliação desktop/móvel com dados reais locais, visitante, participante e administrador                                                             | Leitor de tela e aparelho físico ainda exigem revisão manual                                                            |
| Cloudinary             | Ausência de configuração é informada; upload não tenta um cloud indefinido; URLs seguem validação restrita                                          | Upload real ainda não testado                                                                                           |
| Pusher                 | Ausência é tratada sem falhar publicações; APIs continuam fonte da verdade                                                                          | Transporte e autorização com aplicativo de teste ainda não testados                                                     |

Relatório detalhado de execução em `.qa/local-integration-report.json`; screenshots em `.qa/local-*.png`. Esses artefatos locais não são versionados, e sua data deve corresponder à última execução. Os testes locais usam MongoDB e SMTP de verdade; a interceptação do navegador só bloqueia destinos externos, sem fornecer respostas fictícias do aplicativo.

## Correções desta etapa

1. Resposta de sessão revogada: o callback do NextAuth retornava null e gerava corpo HTTP vazio; agora retorna objeto JSON vazio, tratado como ausência de sessão pelo cliente e pelo getServerSession. Não inclui dados pessoais e mantém a revogação.
2. Opções Mongoose atualizadas de `new: true` para `returnDocument: after`; removida definição redundante de índice customizado sobre `_id` no schema editorial, sem remover índices de bancos existentes.
3. Upload de avatar valida envio e gravação antes de mostrar sucesso, informa falhas e fica desabilitado quando Cloudinary não está configurado.
4. Rotas legadas `/upload` e `/user/edit` encaminham o usuário ao perfil funcional, em vez de chamar endpoint inexistente ou exibir um placeholder.
5. Painel descarta respostas de revisão/moderação de uma aba anterior. Rosário mostra a conclusão preservada ao reabrir a página.
6. SMTP local é opt-in e exige URL, porta e banco locais exatos; recusa configuração remota e ambiente Vercel. Nenhum bypass de autenticação foi acrescentado.
7. Scripts de inicialização validam portas livres, guardam processos próprios e conferem executável/caminho antes de encerrá-los. Banco e caixa de emails são preservados ao parar.
8. As primeiras repetições atingiram os limites reais de login/reset, confirmando sua aplicação. A stack local agora usa janelas de um minuto para permitir repetição de testes, mantendo limites; produção não foi alterada.

## Revisões humanas necessárias

### Conteúdo religioso

Revisão por responsável editorial católico, preferencialmente com acompanhamento pastoral: texto de cada oração e variante brasileira adotada, sequência das dezenas e encerramento, vinte meditações/referências, representação simbólica das imagens e adequação da linguagem.

Conferir particularmente as referências da Assunção e Coroação de Maria (contexto de fé/tradição, não narração bíblica direta), a formulação do oferecimento sobre indulgências e como informar suas condições sem prometer concessão automática. Confirmar a explicação da vela como gesto simbólico que não substitui oração pessoal, sacramentos ou assistência pastoral. A indicação diária segue o calendário semanal civil de Brasília; adaptações pastorais de tempos litúrgicos não estão automatizadas.

Revisar também as regras da comunidade, relatos delicados de saúde/luto, atuação de moderadores e limites da IA antes de habilitá-la externamente. O material original e as fontes estão em `/fontes`; não foi concedida aprovação eclesiástica por esta entrega.

### Privacidade e operação

Definir quem é o controlador/responsável, canal de contato, finalidades e fundamentos do tratamento, consentimento/informação adequada para intenções com religião/saúde e dados de terceiros, tratamento de menores e direitos dos titulares.

Definir prazos de retenção para velas expiradas, histórico, intercessões, logs, solicitações e backups; procedimento real de exportação/correção/exclusão; acesso excepcional de administradores e prestação de contas; contratos, localização e transferência de dados dos fornecedores; resposta a incidentes. A anonimização pública esconde a autoria dos visitantes, mas não torna o registro anônimo dentro do sistema.

O texto atual em `/privacidade` explica a funcionalidade; não substitui uma política operacional/jurídica aprovada. A caixa local é compartilhada por quem usa o computador e deve conter apenas dados fictícios.

## Pendências antes do lançamento

1. Conta/aplicativo exclusivo de teste na Brevo, Cloudinary e Pusher, sem copiar chaves de produção. Homologar entrega de email, uploads restritos e eventos/autorização em dois navegadores. O usuário informou que esses recursos ainda não existem; não foram criados serviços pagos.
2. Revisar configuração GitHub/Vercel, variáveis de Preview e isolamento dos previews já existentes antes de qualquer novo push ou publicação externa. Não basta nomear uma branch como teste para isolar credenciais.
3. Revisão religiosa, privacidade, retenção e operação; leitores de tela e dispositivos físicos; desempenho/carga, backup e plano de retorno em ambiente adequado.
4. Migrar os 40 alertas de ferramentas de desenvolvimento/build/testes já documentados em `SEGURANCA_DEPENDENCIAS.md`. A auditoria anterior das dependências de produção zerou alertas; repetir antes do lançamento.
5. Revisar PRs em conjunto, atualizar base quando apropriado e integrar somente após decisão do usuário. Não houve merge na main.

Conclusão: a experiência pode ser avaliada localmente com contas e persistência reais. A homologação completa dos fornecedores externos e a liberação para produção continuam pendentes.
