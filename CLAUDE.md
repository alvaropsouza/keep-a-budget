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
- Docs: `@nestjs/swagger` + `@fastify/static` (decorators nos DTOs; UI em `/api/docs`)

## Arquitetura

```
src/
  main.ts              # bootstrap: Fastify, ValidationPipe, SwaggerModule
  app.module.ts        # raiz: importa todos os módulos

  config/              # configuração e singletons
    database.ts        # DatabaseModule (PrismaService)
    logger.ts          # logger Pino
    prisma.ts          # cliente Prisma singleton com cache middleware
    s3.ts              # S3Client singleton
    validateEnv.ts     # validação de env vars no boot

  dto/                 # DTOs: validação (class-validator) + docs (ApiProperty)
    auth.dto.ts
    budget.dto.ts
    category.dto.ts
    fixed-expense.dto.ts
    invoice.dto.ts
    ir-document.dto.ts
    parse-expense.dto.ts
    user.dto.ts

  enums/
    banks.enum.ts
    expense-type.enum.ts

  filters/
    app-error.filter.ts  # converte AppError → HTTP response

  guards/              # NestJS guards (CanActivate)
    login-rate-limit.guard.ts
    registration-rate-limit.guard.ts
    session-auth.guard.ts

  interfaces/          # tipos TypeScript puros (sem decorators)
    card-invoice.ts
    expense.ts
    fixed-expense.ts
    user.ts

  jobs/                # crons (node-cron)
    invoice-closure.job.ts
    session-cleanup.job.ts

  modules/             # módulos NestJS (plural, kebab-case)
    ai/
    auth/
    budgets/
    cache/
    categories/
    expenses/
    fixed-expenses/
    health/
    invoices/
    ir-documents/
    users/
    vehicles/

  plugins/             # plugins Fastify (registrados via app.register)
    cors.ts
    fastify-auth.plugin.ts  # decora req.authUser a partir da session
    helmet.ts

  services/            # lógica de negócio (injetáveis NestJS)
    ai.service.ts
    budget.service.ts
    ...

  types/
    fastify.d.ts       # augmenta FastifyRequest com authUser

  utils/               # helpers puros (sem injeção)
    app-error.ts
    encryption.ts
    read-multipart.ts
    s3.ts
    validate-upload.ts
    ...

  generated/           # Prisma client gerado — NÃO editar à mão
    prisma/

prisma/
  schema.prisma
  migrations/
```

### Convenções de nomenclatura

- Arquivos: **kebab-case** em todo `src/` (exceto `generated/`)
- Módulos: **plural** (`budgets`, `invoices`, `fixed-expenses`)
- Sufixos obrigatórios: `.controller.ts` `.service.ts` `.module.ts` `.guard.ts` `.dto.ts` `.job.ts` `.filter.ts`
- Plugin Fastify: sufixo `.plugin.ts`

### Swagger

Documentação via decorators nos DTOs e controllers — sem schemas manuais:
- DTOs: `@ApiProperty` / `@ApiPropertyOptional` em cada campo
- Controllers: `@ApiTags('recurso')` na classe
- UI disponível em `/api/docs` (apenas fora de produção)

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
