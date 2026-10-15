# Capelinha Virtual imersiva

A imagem fornecida permanece integral e byte a byte idêntica ao original. A cena usa largura disponível e proporção 3:2; não há recorte, geração de nova imagem ou modificação do arquivo original. CSS Module contém a identidade própria da página, sem alterar outras páginas.

Cada vela é vinculada a um registro autorizado e ativo. Seis posições nos degraus respeitam perspectiva; navegação permite selecionar as demais. Controles equivalentes de 44px permitem toque e teclado em telas pequenas. A intenção selecionada usa o mesmo cartão e as mesmas ações já existentes. Público/anônimo/privado, consentimento e expiração de 168 horas continuam sob controle do servidor. Nenhuma migração ou alteração de dados.

A visualização privada fica apenas no histórico do proprietário; alternar a vista limpa a seleção. Novas velas atualizam a cena após acendimento. Atualização manual ou retorno à aba consulta o backend; não há atualização em tempo real entre navegadores.

## Validação

- 158 testes automatizados / 27 suítes, incluindo novos testes de cena e regressões de administração, privacidade e expiração.
- ESLint, Prettier e build de produção.
- Atlas de teste separado: três tipos de intenção, duração exata, privacidade entre contas e convidados, expiração sem navegador e interação autenticada.
- Cenários 0, 1 e 13 velas em 320, 390, 768 e 1440px: sem transbordamento, imagem inteira, posições nos degraus e navegação.
- Mouse, teclado, toque, foco e movimento reduzido; ausência de erros JavaScript.
- Imagem servida com SHA-256 076db5e69b372bc45e7ff4b88b9ca60cffc388f38e0a0d8a93392b50fd0b1ffd.

## Limitações e operação

O PNG original pesa aproximadamente 2,25 MB; não foi recomprimido para respeitar a preservação exata solicitada. Há prioridade de carregamento e espaço reservado para evitar saltos. Em celulares, os botões abaixo da imagem oferecem áreas de toque maiores que as próprias velas.

A API fornece vinte intenções por lote; “Ver mais intenções” continua carregando lotes adicionais. O cenário permite navegar por todas as velas ativas carregadas, seis por página, preservando a organização do santuário.

Projeto oficial: clone-tabnews. Não há push, merge, mudança de DNS, credenciais ou serviços. Rollback da alteração visual: deployment dpl_4NJnkkRWyVY5m3hsrkqqPzKFLNdv, sem restauração de banco. Publicação e verificação final concluídas em 15/10/2026.

## Publicação concluída

- URL oficial: https://panteralab.com.br/capelinha
- Commit de código: `752472643961bba8fbeda0e0d034e823779bf0a9`.
- Deployment: `dpl_4uRVQpZ4NT8AdzYb5zd7oxBJ5Ucf`.
- Base administrativa `2b7b6ba` preservada como ancestral.
- Quatro grupos de smoke protegidos e quatro públicos aprovados: imagem byte a byte idêntica, quatro resoluções, páginas essenciais e autorização administrativa para visitantes.
- Dados originais das 12 coleções preservados por conferência de conteúdo; um novo progresso do Rosário salvo durante a preparação foi validado e preservado como atividade legítima. Nenhuma escrita de teste em produção.
- Chave temporária de QA revogada; URLs imutáveis continuam protegidas. Sem mudanças de DNS, variáveis, credenciais ou serviços.
- ESLint aprovado nos 159 arquivos versionados, Prettier aprovado e build concluído. Aviso preexistente do framework: React 18 será descontinuado na próxima versão principal do Next; atualização de dependências fica fora desta entrega visual.

Rollback operacional: usar Vercel CLI `rollback dpl_4NJnkkRWyVY5m3hsrkqqPzKFLNdv` no escopo/projeto oficial existente. Confirmar o alias panteralab.com.br após concluir. Não restaurar backup nem reverter dados para desfazer uma alteração visual.

Arquivos: pages/capelinha.js; components/prayer/ChapelScene.js; lib/chapel-scene.js; styles/Chapel.module.css; public/sacred/capelinha-076db5e69b37.png; tests/chapel-scene.test.js; este relatório; PLANO_DESENVOLVIMENTO.md.
