# Segurança das dependências — 15/10/2026

A auditoria inicial das dependências de produção encontrou 11 alertas herdados: 2 críticos, 6 altos e 3 moderados. Após atualizações, `npm audit --omit=dev` retornou **zero alertas** no lockfile desta entrega. É uma fotografia da base de advisories consultada, não garantia de ausência de vulnerabilidades.

## Atualizações relevantes

- Next.js e eslint-config-next 16.4.1.
- NextAuth 4.24.15.
- Mongoose 9.11.2.
- Nodemailer 10.1.1.
- Sharp 0.35.5.
- PostCSS 8.5.23 e atualizações transitivas compatíveis no package-lock.json.

NextAuth 4 declara Nodemailer 7 como peer opcional para EmailProvider. Este projeto utiliza CredentialsProvider; os emails Brevo são enviados pelo próprio módulo de mailer. O override `next-auth.nodemailer: $nodemailer` resolve explicitamente para o Nodemailer corrigido já utilizado no projeto. Não foi instalado o peer vulnerável nem usado `--force`. `npm ls` validou a árvore sem conflitos. Caso se adote EmailProvider futuramente, sua integração precisa de validação específica.

O teste de smoke usa o transporte de stream real do Nodemailer para gerar uma mensagem sem rede e o Sharp real para processar um SVG local. O envio SMTP pela Brevo ainda exige homologação com credenciais de teste.

## Ferramentas de desenvolvimento

A auditoria completa ainda retorna **40 alertas: 33 altos e 7 moderados**, concentrados na cadeia de desenvolvimento, testes e build, incluindo Jest 29, Tailwind 3, ESLint e dependências transitivas. Estão fora de `npm audit --omit=dev`, mas continuam relevantes para quem instala e compila o projeto.

As correções automáticas sugerem mudanças principais ou substituições incompatíveis, incluindo Jest 30 e Tailwind 4. Não executar `npm audit fix --force` como solução genérica. Abrir etapa isolada para atualizar a cadeia, revisar diferenças de CSS/configuração e repetir testes, lint, build e regressão visual. Até essa revisão, executar ferramentas apenas sobre código e arquivos de origem confiáveis em ambiente de desenvolvimento separado.

## Runtime e validação

Node 22.23.3 oficial, conferido contra SHA-256 publicado pelo nodejs.org. O projeto exige Node 22. O build passou com Next 16.4.1; React 18 está preservado, com aviso de depreciação para o futuro Next 17. Planejar React 19 em uma mudança dedicada.

Não houve alteração de credenciais, envio de email, gravação em banco real ou publicação durante esta revisão. Relatórios brutos locais ficam em `.qa/`, ignorados pelo Git. Reexecutar auditoria e homologação antes do lançamento.
