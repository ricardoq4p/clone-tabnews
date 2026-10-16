# Consolidação Retro Digital — 16/10/2026

## Integridade da base

- Candidato aprovado: `77da5369efba0a9c240a60b7ad644c1ade6d3bdf` na branch local `design/retro-digital`.
- Produção identificada pela API da Vercel e pelo alias oficial: `ac6d8fe5a7b4ae131046086173ea3cf26fc727d0`, deployment `dpl_5P5Se3jgd1v4mYjDrXsejVBEd6QU` (READY). Deve ser preservado para rollback.
- Projeto: `prj_FRcbozdufCmWfO6FNmFLtyYwKT1S`, equipe `team_Vt0Io5oaNuqVHV3JhHFQIoYj`. Branch de produção já configurada como `main`; Node 22.x; domínio oficial ligado ao projeto correto.
- `main` antiga (`6403d41`) é ancestral do candidato. A atualização local foi fast-forward, sem sobrescrever conteúdo antigo sobre o atual.
- `5435264` era o único commit remoto fora da ancestralidade do candidato; suas alterações já estavam reaplicadas em `69eb4bc`. O merge `ab2a00e` incorpora também o commit original. O único conflito, em `prayer.css`, foi resolvido conservando o arquivo do candidato, que já continha as regras de comunidades. A árvore desse merge é idêntica à de `77da536`.
- Todas as demais branches remotas são ancestrais da versão consolidada. Não há funcionalidade exclusiva restante identificada.

## Alterações de organização

README atualizado com arquitetura, desenvolvimento, testes, publicação e rollback. `.nvmrc` alinhado a Node 22, já exigido pelo pacote e pela Vercel. Workflow GitHub Actions sem segredos, com job `validate` para instalação, testes, ESLint, Prettier e build. Avisos de formatação por CRLF no checkout foram eliminados; o conteúdo versionado dos cinco arquivos preexistentes não foi alterado.

Autenticação, autorização, APIs, modelos, regras de negócio e dependências do candidato permanecem intactos. Comparando com a produção anterior, as únicas alterações de API são as já existentes em `5435264`: listagem administrativa de comunidades e preservação de campos omitidos no PATCH de comunidades. Não há migração de banco. Imagem da Capelinha preservada com SHA-256 `076db5e69b372bc45e7ff4b88b9ca60cffc388f38e0a0d8a93392b50fd0b1ffd`.

## Critérios de publicação e limpeza

As verificações locais precisam ser repetidas após a consolidação. Nenhuma branch será excluída antes de validar o deployment promovido no domínio. Preservar a tag `rollback/pre-retro-2026-10-16` e o deployment anterior. A versão oficial será identificada pela tag `release/retro-digital-2026-10-16`.

PRs antigos identificados: #15 (segurança), #16 (plataforma) e #17 (gerenciamento de comunidades). Seus commits serão conferidos por ancestralidade e seus estados atualizados após validação em produção. A branch `main` deve continuar padrão e receber proteção contra force push e exclusão, com checagem de CI quando disponível. Não há workflows nem hooks GitHub preexistentes. O projeto oficial não tem deploy hooks e já usa main; o projeto separado `panteralab-homologacao` não tem repositório Git ligado na consulta feita.

## Dados e limites

Foram feitas somente leituras públicas em produção antes da alteração, registrando IDs e hashes privados das respostas, sem conteúdo pessoal no Git. Controles de conta e administração sem sessão são verificados sem gravar dados. MongoDB e segredo de sessão são variáveis sensíveis na Vercel: estão configurados, mas não são exportáveis pela API consultada. Não se deve enfraquecer essa proteção para obter um inventário. Assim, a preservação de todos os registros privados se baseia na manutenção de banco/segredos/modelos, ausência de migração ou escrita desta entrega e verificação dos registros públicos; não será declarada auditoria integral do banco privado.

A retenção existente está habilitada no projeto publicado. Sua configuração e seu cron são preservados; o endpoint não é chamado como teste. Login real com credenciais de usuário e persistência externa precisam de conta de homologação própria; a suíte local cobre os contratos com fixtures e mocks. Nenhum teste destrutivo será feito em produção.

Evidências de execução, IDs de implantação, resultados e inventários de branches ficam no relatório final desta operação em `.qa/`, excluído do Git. O estado remoto definitivo deve ser confirmado depois das operações, sem inferi-lo deste plano versionado.

## Verificação local da versão consolidada

Reexecução aprovada com Node 22.23.2: 178 testes em 28 suítes, ESLint global, Prettier global e build de produção. Os três roteiros funcionais de navegador passaram (Rosário/velas/administração, geometria da Capelinha e gerenciamento de comunidades). A matriz Retro Digital gerou 98 capturas nas sete resoluções; sem rolagem horizontal ou erros JavaScript, com zero violações em 28 análises axe. Os testes autenticados usam somente fixtures locais. O aviso de depreciação futura de React 18 no Next 16 permanece, sem mudança de dependências nesta entrega.
