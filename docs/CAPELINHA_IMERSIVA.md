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

Projeto oficial: clone-tabnews. Não há push, merge, mudança de DNS, credenciais ou serviços. Rollback da alteração visual: deployment dpl_4NJnkkRWyVY5m3hsrkqqPzKFLNdv, sem restauração de banco. Publicação e verificação final serão registradas após promoção.
