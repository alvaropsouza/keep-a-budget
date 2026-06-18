# keep-a-budget (backend)

## Memory System

**Memória vive em `../vault/Memory/` — vault Obsidian na raiz do monorepo.**

IMPORTANT: Toda operação de memória usa `vault/Memory/` como raiz, NÃO `~/.claude/projects/*/memory/`.

### Escrever memórias

1. Criar `.md` na subpasta correta:
   - `vault/Memory/user/` — perfil, preferências, expertise do usuário
   - `vault/Memory/project/` — decisões, status, metas, contexto de arquitetura
   - `vault/Memory/feedback/` — regras do/don't de comportamento do agente
   - `vault/Memory/reference/` — ponteiros para recursos externos

2. Frontmatter obrigatório:
   ```yaml
   ---
   name: kebab-case-slug
   type: user | project | feedback | reference
   area: backend | frontend | shared
   description: "resumo de uma linha"
   tags:
     - memory
     - <type>
   created: YYYY-MM-DD
   ---
   ```

3. Atualizar índice `vault/Memory/MEMORY.md` (uma linha por memória, sob a seção correta).

### Ler memórias

Ler `vault/Memory/MEMORY.md` para índice. Seguir links para arquivos individuais.

## Comunicação

Usar **caveman mode (full)** em todas sessões. Ativo por padrão.

## Estrutura do projeto

Monorepo em `keep-a-budget-system/`:
- `keep-a-budget/` — backend NestJS/Fastify + Prisma + PostgreSQL (este repo)
- `keep-a-budget-frontend/` — frontend React + Vite
- `vault/` — Obsidian vault (memória do agente + docs do projeto)

## Stack

- NestJS 11 + Fastify (`@nestjs/platform-fastify`)
- Prisma 7 + PostgreSQL (`@prisma/adapter-pg`, `pg`)
- Validação: `class-validator` + `class-transformer`
- IA: `@anthropic-ai/sdk` (parsing de despesa/comprovante — ver `src/services/ai.service.ts`)
- Storage: AWS S3 (`@aws-sdk/client-s3`, pre-signed URLs)
- Email: Resend
- Jobs: `node-cron`
- Logs: `pino`
- Docs: Swagger (`@fastify/swagger`)

## Arquitetura

- `src/modules/` — controllers + guards (ex: `session-auth.guard.ts`)
- `src/services/` — lógica de negócio
- `src/dto/` — DTOs com validação
- `src/docs/` — schemas Swagger
- `src/utils/` — helpers (upload, encryption, s3, validação)
- `src/generated/prisma/` — client Prisma gerado (NÃO editar à mão)
- `prisma/` — schema e migrations

## Comandos

```bash
pnpm run dev              # nest start --watch
pnpm run build            # prisma generate && nest build
pnpm run prisma:generate  # gera client Prisma
pnpm run prisma:migrate   # prisma migrate dev
```

## Convenções

- **Sem comentários no código** — nem inline, bloco, JSDoc ou divisor de seção. Nomes claros bastam. Comentários existentes: deixar, salvo se editando aquela linha.
- **`any` proibido** — nenhuma forma (`: any`, `as any`, `Record<string, any>`, `Promise<any>`, `<any>`). Tipar com o tipo real; quando desconhecido (erro de `catch`, body de request), usar `unknown` + narrowing (`instanceof`, type guard, `validateDto`).
- **Sem casts de conveniência (`as Type`)** — não usar `as` para calar o compilador. Tipar na origem: DTO, generic, retorno de service. `as` aceitável só em fronteiras reais: `JSON.parse`/SDK de terceiros sem tipo (cast estreito), narrowing de erro após checagem, e `as const`.
- **Exceções de tipagem:** `src/generated/**` (Prisma gerado, não editar) e mappers de `$queryRaw` — tipo solto permitido, mas isolado num único mapper por tabela (ex: `mapExpense`, `mapUser`), nunca espalhado pelos services.
- Upload: nunca confiar no mimetype do cliente — validar magic bytes via `src/utils/validateUpload.ts`.
- Recibos/comprovantes: pre-signed URL curta, validar ownership (prevenir IDOR).
- Após mudar `prisma/schema.prisma`: rodar `prisma:generate`.
