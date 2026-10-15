# Relatório do Preview PanteraLab — 15/10/2026

## Resultado e acesso

Preview protegido e pronto para avaliação: https://panteralab-homologacao-jyr9y4lm3.vercel.app

Autenticar primeiro na Vercel como proprietário do projeto. Na aplicação, usar as contas fictícias de participante ou administrador guardadas em `.qa/ACESSOS_PREVIEW.md`. Não há senha em arquivos versionados. Pode cadastrar uma nova conta com email fictício `@panteralab.test` e confirmar pelo botão apresentado na página. Usar somente dados fictícios.

## Verificações executadas

- 125 testes unitários/API, 23 suítes, aprovados; ESLint sem avisos e Prettier aprovados.
- Build remoto Next.js/Node 22 concluído; deployment READY e target Preview verificados por API.
- 12 grupos de integração hospedada aprovados, com HTTP, navegador Edge/Playwright e MongoDB Atlas reais, sem simular respostas da aplicação.
- Login e sessão das três contas: Ana, José e administrador; visitante e participante recusados nas APIs administrativas.
- Cadastro de email fictício, confirmação de token e login; email real recusado, sem transporte SMTP externo.
- Velas públicas/anônimas/privadas, autoria anônima omitida e acesso privado recusado a terceiros. Datas enviadas pelo cliente ignoradas; duração exata de 604.800.000 ms.
- Doze intercessões concorrentes do mesmo usuário contabilizadas uma vez; dois usuários contabilizados como duas pessoas.
- Vela fictícia atravessou a expiração: desapareceu da consulta pública e permaneceu no histórico, sem exclusão por TTL.
- Revisão de intenção privada exige motivo e registra auditoria; ocultar/restaurar preserva data original de expiração.
- Publicação e comentário de comunidade; grupo privado não permite leitura nem entrada indevida.
- Solicitação de dados disponível apenas ao titular e à fila administrativa; nenhuma exclusão executada.
- Rosário inteiro de 82 etapas e roteiro completo de 292 etapas, conclusão, persistência no Atlas, recarregamento e conflito de revisão entre dispositivos.
- Páginas inicial, Rosário, Capelinha e comunidade verificadas em 390 px, sem transbordamento horizontal; capturas inspecionadas visualmente. A homologação local anterior cobre também desktop e outros tamanhos; não equivale a teste em aparelho físico.
- Sem sessão Vercel, o ambiente recusou acesso. Chave temporária exclusiva de automação usada nos testes foi revogada; acesso com a chave revogada redireciona para autenticação em `/`, `/api/velas` e `/api/auth/session`. A proteção do projeto permanece ativa.

Evidências locais não publicadas: `.qa/preview-integration-report.json`, `.qa/preview-deployment-status.json`, `.qa/preview-final-protection.json` e capturas `.qa/preview-mobile-*.png`. Os roteiros operacionais desta sessão estão em `.qa/preview-integration.cjs` e `.qa/preview-status.cjs`; não imprimir os arquivos de segredos usados por eles. Chave de teste revogada não pode ser reutilizada.

## Integrações disponíveis

| Integração                  | Estado                                                                  |
| --------------------------- | ----------------------------------------------------------------------- |
| MongoDB Atlas M0            | Real, isolado, leitura/escrita e restrição de privilégios verificadas   |
| NextAuth                    | Real, cookies HTTPS, login e sessões verificados                        |
| Confirmação de cadastro     | Token real, link na própria página para contas fictícias; sem email     |
| Brevo/recuperação por email | Desligados no Preview; fluxo SMTP real validado apenas no Mailpit local |
| Cloudinary                  | Desligado; upload externo indisponível                                  |
| Pusher                      | Desligado; transporte em tempo real não homologado externamente         |
| IA                          | Desligada, sem chave nem consumo pago                                   |

## Pendências e limites

A lista de acesso do Atlas novo expira em **22/10/2026 às 14:48 de Brasília**. Até lá usa abertura temporária `0.0.0.0/0`, necessária para a saída dinâmica do plano Hobby, com TLS/senha forte/usuário restrito e dados fictícios. Depois o banco ficará inacessível até reavaliação da rede; não ampliar acesso de produção. Detalhes, IDs e incidente do primeiro build cancelado em `docs/PREVIEW_VERCEL.md`.

Antes de lançamento: credenciais de teste e testes reais de Brevo, Cloudinary e Pusher; dispositivos físicos, leitor de tela, carga/backup; tratamento dos alertas da cadeia de ferramentas descritos em `SEGURANCA_DEPENDENCIAS.md`.

Revisão humana religiosa: textos e variantes das orações, vinte meditações/referências, Assunção/Coroação como tradição de fé, linguagem sobre indulgências e vela simbólica; calendário semanal de Brasília não implementa adaptações litúrgicas sazonais. Não há declaração de aprovação eclesiástica.

Revisão humana de privacidade/operação: controlador e contato, dados sensíveis e de terceiros, menores, retenção de velas/logs/backups, atendimento real de exportação/exclusão, acesso excepcional de moderadores, contratos/transferências e resposta a incidentes. Anônimo significa autoria oculta publicamente; o sistema mantém o vínculo interno. Não há declaração de conformidade LGPD completa. Lista detalhada em `docs/RELATORIO_HOMOLOGACAO.md`.

PR #16 depende do PR #15. Ambos foram revisados na etapa local; não houve merge, alteração de main ou push nesta etapa. O projeto antigo usa escopos de credenciais compartilhados e permanece intocado. O Preview foi publicado diretamente do checkout da branch de desenvolvimento no projeto novo. Nenhum domínio oficial ou configuração de produção foi alterado.
