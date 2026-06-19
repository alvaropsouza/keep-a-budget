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

### Camadas e responsabilidades

```
Controller  →  UseCase  →  Repository  (DB)
                       →  Service      (integração externa)
                       →  UseCase      (orquestração de outros UCs)
```

| Camada | Responsabilidade | Proibido |
|--------|-----------------|----------|
| **Controller** | Receber request, chamar UseCase, retornar response | Qualquer lógica de negócio |
| **UseCase** | Orquestrar, logar, mapear erros, chamar Repository/Service | Acesso direto ao DB, chamadas HTTP externas |
| **Repository** | Operações no banco via Prisma — só isso | Lógica de negócio, chamadas externas |
| **Service** | Integração com serviços externos (Anthropic, S3, Resend, RemoveBG) | Lógica de negócio, acesso ao DB |

> **Regra**: se não é integração externa, não é Service. Se não é operação de banco, não é Repository.

### Fluxo de dados

- DTO do controller === input do UseCase (sem conversão intermediária)
- UseCase retorna o dado diretamente (controller só repassa)
- Erros mapeados na ponta que os originou; UseCase lê e decide relançar, logar ou absorver

### Error handling

```typescript
// Repository — mapeia erros de DB para domínio
async findById(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

// Service — mapeia erros externos para domínio
async removeBackground(buffer: Buffer): Promise<Buffer> {
  try {
    return await removeBgApi(buffer);
  } catch (err) {
    throw new AppError('Background removal failed', 502);
  }
}

// UseCase — orquestra, loga, decide o que propagar
async execute(input: CreateExpenseInput): Promise<Expense> {
  this.logger.log({ input }, 'CreateExpenseUseCase.execute');
  try {
    const expense = await this.expenseRepository.create(input); // AppError 4xx propaga
    await this.emailService.notify(input.userId, expense);      // AppError 5xx: logar, não propagar
    return expense;
  } catch (err) {
    if (err instanceof AppError && err.statusCode >= 500) {
      this.logger.error({ err }, 'external service failed');
      return expense; // degradação graciosa quando possível
    }
    throw err;
  }
}
```

### Logs padrão nos UseCases

```typescript
this.logger.log({ input }, 'NomeUseCase.execute');       // início
this.logger.log({ result }, 'NomeUseCase.execute done'); // sucesso
this.logger.error({ err }, 'NomeUseCase.execute failed');// falha não recuperável
```

### Estrutura de pastas

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

  errors/              # classes de erro de domínio (extends AppError)
    app-error.ts

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

  modules/             # módulos NestJS (plural, kebab-case) — estrutura flat
    ai.controller.ts / ai.module.ts
    auth.controller.ts / auth.module.ts
    budgets.controller.ts / budgets.module.ts
    cache.module.ts
    categories.controller.ts / categories.module.ts
    expenses.controller.ts / expenses.module.ts
    fixed-expenses.controller.ts / fixed-expenses.module.ts
    health.controller.ts          # registrado direto no AppModule, sem módulo próprio
    invoices.controller.ts / invoices.module.ts
    ir-documents.controller.ts / ir-documents.module.ts
    users.controller.ts / users.module.ts
    vehicles.controller.ts / vehicles.module.ts

  plugins/             # plugins Fastify (registrados via app.register)
    cors.ts
    fastify-auth.plugin.ts  # decora req.authUser a partir da session
    helmet.ts

  repositories/        # acesso ao banco — só Prisma, sem lógica
    budget.repository.ts
    category.repository.ts
    expense.repository.ts
    fixed-expense.repository.ts
    invoice.repository.ts
    ir-document.repository.ts
    user.repository.ts
    vehicle.repository.ts

  services/            # integrações externas APENAS
    ai.service.ts      # Anthropic Claude API
    resend.service.ts  # Resend
    remove-bg.service.ts # RemoveBG API
    s3.service.ts      # AWS S3

  types/
    fastify.d.ts       # augmenta FastifyRequest com authUser

  use-cases/           # lógica de negócio e orquestração
    budgets/
      create-budget.use-case.ts
      list-budgets.use-case.ts
      ...
    expenses/
      create-expense.use-case.ts
      ...

  utils/               # helpers puros (sem injeção)
    encryption.ts
    read-multipart.ts
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
- Sufixos obrigatórios: `.controller.ts` `.service.ts` `.module.ts` `.guard.ts` `.dto.ts` `.job.ts` `.filter.ts` `.repository.ts` `.use-case.ts`
- Plugin Fastify: sufixo `.plugin.ts`

### Nomenclatura de classes por camada

#### Repository
- Classe: `[Resource]Repository` — ex: `ExpenseRepository`, `UserRepository`
- Arquivo: `[resource].repository.ts`
- Métodos padrão: `findById` · `findMany` · `create` · `update` · `delete` · `deleteMany`
- Métodos extras seguem o padrão `findBy[Field]` — ex: `findByEmail`, `findByInvoiceId`

#### UseCase
- Classe: `[Verb][Resource]UseCase` — ex: `CreateExpenseUseCase`, `ListInvoicesUseCase`
- Arquivo: `[verb]-[resource].use-case.ts` — ex: `create-expense.use-case.ts`
- Único método público: `execute(input: [ClassName]Input): Promise<[ClassName]Output>`
- Verbos padrão: `Create` · `Update` · `Delete` · `GetById` · `List`
- Verbos de domínio quando a ação não é CRUD: `CloseInvoice` · `AdvanceInvoicePayment` · `ImportExpensesFromCsv`

#### Service (integrações externas)
- Classe: `[Provider]Service` — ex: `AiService`, `ResendService`, `S3Service`, `RemoveBgService`
- **Provider = nome do serviço externo**, não o domínio de negócio. Ex: `ResendService` (não `EmailService`), `RemoveBgService` (não `BackgroundRemovalService`)
- Arquivo: `[provider].service.ts`
- Métodos descrevem a ação no provider: `parseExpense` · `sendOtp` · `uploadFile` · `removeBackground`

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

## Helpers de repositório (src/repositories/invoice.repository.ts)

- **`buildInvoiceWhere(filter, userId?)`** — constrói `Prisma.CardInvoiceWhereInput` a partir de `InvoiceFilter`. Usar em qualquer query que precise filtrar faturas por banco/data/período.
- **`toUtcMidnight(date)`** — converte Date para meia-noite UTC. Usar ao comparar datas de despesa com datas de fatura.
- **`userFilter(userId?)`** — retorna `{ userId }` ou `{}`. Usar em `where` spreads para isolamento por usuário.

## Comportamento do agente

- **Avaliar alternativas antes de implementar** — antes de executar qualquer mudança arquitetural ou refactor sugerido no chat, apresentar brevemente as opções viáveis (incluindo a sugerida), recomendar a melhor, e aguardar confirmação. Mudanças pequenas e mecânicas (renomear arquivo, corrigir import) não precisam de avaliação.

- **VIOLAÇÃO BLOQUEANTE — Controller importando Service/Repository diretamente** — Controller NUNCA pode importar de `services/` ou `repositories/`. Só pode injetar UseCases (e Guards). Ao escrever ou revisar código: se um controller importa service ou repository, PARAR e criar o UseCase primeiro. O script `scripts/check-arch.mjs` enforça isso no build (`pnpm run check:arch` para checar isolado).

## Convenções

- **Sem comentários no código** — nem inline, bloco, JSDoc ou divisor de seção. Nomes claros bastam. Comentários existentes: deixar, salvo se editando aquela linha.
- **`any` proibido** — nenhuma forma (`: any`, `as any`, `Record<string, any>`, `Promise<any>`, `<any>`). Tipar com o tipo real; quando desconhecido (erro de `catch`, body de request), usar `unknown` + narrowing (`instanceof`, type guard, `validateDto`).
- **Sem casts de conveniência (`as Type`)** — não usar `as` para calar o compilador. Tipar na origem: DTO, generic, retorno de service. `as` aceitável só em fronteiras reais: `JSON.parse`/SDK de terceiros sem tipo (cast estreito), narrowing de erro após checagem, e `as const`.
- **Exceções de tipagem:** `src/generated/**` (Prisma gerado, não editar) e mappers de `$queryRaw` — tipo solto permitido, mas isolado num único mapper por tabela (ex: `mapExpense`, `mapUser`), nunca espalhado pelos services.
- Upload: nunca confiar no mimetype do cliente — validar magic bytes via `src/utils/validateUpload.ts`.
- Recibos/comprovantes: pre-signed URL curta, validar ownership (prevenir IDOR).
- Após mudar `prisma/schema.prisma`: rodar `prisma:generate`.
