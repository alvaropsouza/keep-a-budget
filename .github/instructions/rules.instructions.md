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

<!-- Adicione aqui regras sobre migrações, schema e uso do Prisma -->

---

## Testes

<!-- Adicione aqui regras sobre cobertura, organização e execução de testes -->

---

## Segurança

<!-- Adicione aqui regras de segurança específicas do projeto -->

