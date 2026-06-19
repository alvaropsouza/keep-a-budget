# keep-a-budget (backend)

## Memory System

**Memória vive em `../memory/` na raiz do monorepo. Markdown puro — sem Obsidian, sem wikilinks.**

IMPORTANT: Toda operação de memória usa `../memory/` como raiz, NÃO `~/.claude/projects/*/memory/`.

### Escrever memórias

1. Criar `.md` na subpasta correta:
   - `../memory/user/` — perfil, preferências, expertise do usuário
   - `../memory/project/` — decisões, status, metas, contexto de arquitetura
   - `../memory/feedback/` — regras do/don't de comportamento do agente
   - `../memory/reference/` — ponteiros para recursos externos

2. Frontmatter obrigatório:
   ```yaml
   ---
   name: kebab-case-slug
   type: user | project | feedback | reference
   area: backend | frontend | shared
   description: "resumo de uma linha"
   created: YYYY-MM-DD
   ---
   ```

3. Linkar memórias relacionadas com links markdown relativos: `[slug](../project/slug.md)`. Nunca wikilinks `[[slug]]`.

4. Atualizar índice `../memory/MEMORY.md` (uma linha por memória, sob a seção correta, com link relativo).

### Ler memórias

Ler `../memory/MEMORY.md` para índice. Seguir os links markdown para arquivos individuais.

## Comunicação

Usar **caveman mode (full)** em todas sessões. Ativo por padrão.

## Estrutura do projeto

Monorepo em `keep-a-budget-system/`:
- `keep-a-budget/` — backend NestJS/Fastify + Prisma + PostgreSQL (este repo)
- `keep-a-budget-frontend/` — frontend React + Vite
- `memory/` — memória do agente (markdown puro)

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
