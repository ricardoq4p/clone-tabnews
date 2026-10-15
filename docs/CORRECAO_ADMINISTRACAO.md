# Correção do acesso administrativo e exclusão — 15/10/2026

## Diagnóstico

Auditoria somente de leitura confirmou uma única conta correspondente ao email informado, role superadmin, verificada, ativa, sessionVersion 0. SUPERADMIN_EMAIL corresponde ao mesmo endereço e está no escopo Production. Nenhum ajuste de conta, senha, papel ou dado pessoal foi necessário.

NextAuth consulta o papel atual no banco em cada avaliação do JWT e o repassa à sessão. Teste explícito comprova que o papel superadmin persistido chega ao cliente; também permanece o teste de revogação de papel. Não se concede privilégio apenas por SUPERADMIN_EMAIL. Não foi lida uma sessão do navegador pessoal do usuário: não afirmar que ela estava desatualizada.

A lacuna era de interface: o painel novo só revisava/ocultava/restaurava e o acesso administrativo ficava no rodapé. O feed já tinha exclusão para autor/superadmin; o painel novo agora também permite exclusão definitiva após revisão, motivo e confirmação. Uma comunidade vazia não tem registros para excluir.

## Correção

- Atalho Administração no cabeçalho (ícone de escudo no celular) e Administrar comunidade no perfil, exclusivamente para superadmin.
- Painel /administracao > Publicações ou Comentários > informar motivo > Revisar conteúdo > Excluir definitivamente. Confirmação explica que excluir publicação também remove seus comentários e é irreversível. Velas/intenções não recebem exclusão definitiva por essa ação.
- Nova DELETE /api/admin/excluir exige sessão superadmin, valida tipo/id/motivo/origem/accountId e limita frequência. A operação revalida a conta e o papel persistidos no banco dentro da transação antes de qualquer remoção.
- Operação compartilhada pelas APIs normais de publicação/comentário: autorização por proprietário ou superadmin, sem confiar em nome de autor ou papel enviado no corpo. Transação remove conteúdo e auxiliares exclusivamente relacionados; falha também reverte a auditoria/remoção. Exclusões administrativas são registradas sem copiar o texto privado.
- Cartões usam a mesma política de autorização da API, com nomes acessíveis Excluir publicação/Excluir comentário. Usuário comum não vê exclusão de conteúdo alheio. Comentários aparecem depois de abrir a conversa.
- Cabeçalho verificado em 320/390/1440px; atalho compacto e controles com nome acessível.

## Validação

153 testes em 26 suítes, ESLint sem avisos, Prettier e build Node22/Next16.4.1 aprovados. Cinco grupos com HTTP/NextAuth/navegador e transações MongoDB reais no Atlas exclusivo de homologação passaram: autorização negativa de visitante/terceiro/papel forjado; exclusão do próprio comentário; UI por papel; cancelamento preserva; confirmação auditada remove fixture e auxiliares; API normal aceita admin no comentário e proprietário na publicação.

Fixtures criadas e removidas exclusivamente no banco panteralab_homologacao_vercel, via APIs autenticadas. Nenhum conteúdo real foi excluído durante os testes. A stack local padrão utiliza MongoDB standalone; operações transacionais de exclusão exigem replica set, por isso a QA adicional rodou em localhost:3117 com Atlas de teste, sem conectar a produção. Não reduzir atomicidade de produção para acomodar standalone.

Evidências privadas: .qa/admin-access-audit.json, .qa/admin-delete-integration-report.json e .qa/admin-delete-ui-\*.png. Inventário de produção antes da correção contém 18 usuários, oito comunidades, zero mensagens/comentários/velas/progresso, 14 registros pessoais e dois logs antigos; hashes sem conteúdo em .qa/admin-fix-production-before.json.

## Publicação e acesso

Correção destinada somente ao projeto oficial clone-tabnews, sem push/merge/main ou mudança de variável/credencial. Construir --target production --skip-domain, verificar sem executar exclusão real e promover somente se aprovado. Rollback desta correção deve apontar para a versão saudável imediatamente anterior, dpl_2i63NjkNdT9ZrdbbCpSHyX9funUX; não voltar ao código legado de antes do lançamento por engano.

A correção não invalida sessões. Atualize a página; se o navegador ainda não reconhecer a conta, sair e entrar novamente obtém uma sessão atual. A rotação de segredo ocorreu no lançamento anterior, não nesta correção. O usuário não precisa alterar a senha.
