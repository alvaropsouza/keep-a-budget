---
applyTo: "**"
---

# Diretrizes do Projeto — road-of-life

Este arquivo centraliza as regras que o agente deve seguir ao trabalhar neste projeto.
Adicione novas diretrizes nas seções correspondentes conforme necessário.

---

## Geral

1. Evite criar arquivos markdown para documentar alterações que você fez.
2. Sempre alimente o CHANGELOG seguindo o padrão do [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
3. Sempre aumente a versão do projeto no `package.json` quando fizer uma grande alteração.

---

## Gerenciador de Pacotes

- Use sempre `pnpm` — nunca `npm` ou `yarn`.
- **Nunca rode `pnpm install` automaticamente.** O usuário sempre executa manualmente.

---

## Stack e Arquitetura

- **Nunca use `any` em TypeScript.** Sempre extraia o tipo correto da biblioteca utilizada (ex.: tipos do Prisma, NestJS, Fastify) ou crie interfaces/types internos. O uso de `any` como escape hatch é proibido — prefira `unknown` com type guard, ou modele o tipo adequado.

---

## Banco de Dados / Prisma

- Sempre que houver alteração em `prisma/schema.prisma` ou em tipos usados de Prisma, valide localmente com `pnpm prisma:generate` antes de concluir a tarefa.
- Não misture fontes de tipo do Prisma: neste projeto, imports de `Prisma`, `PrismaClient` e tipos de model devem vir de `src/generated/prisma/client` (output do generator), não de `@prisma/client`.
- O build de validação deve considerar a geração do client Prisma. Em CI/deploy, o comando de build precisa executar `prisma generate` antes do `tsc`.

---

## Testes

- Antes de abrir PR ou fazer deploy do backend, execute obrigatoriamente `pnpm run build` para validar type-check completo do projeto.
- Não considerar apenas `pnpm run dev`/`tsx watch` como validação de qualidade: o modo dev não garante checagem de tipos de todos os arquivos.
- Qualquer novo import de biblioteca (ex.: Swagger/Nest plugins) deve ser acompanhado da entrada correspondente em `dependencies`/`devDependencies` no `package.json`.

---

## Segurança

<!-- Adicione aqui regras de segurança específicas do projeto -->

