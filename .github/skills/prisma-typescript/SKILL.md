---
name: prisma-typescript
description: "Expert knowledge in Prisma ORM, TypeScript, and the keep-a-budget backend stack (Fastify + Prisma + PostgreSQL). Use when: creating or modifying services, controllers, routes, DTOs, Prisma models, migrations, or applying TypeScript best practices in this codebase."
argument-hint: "Describe the feature or entity to implement (e.g., 'create a Category entity with CRUD')"
---

# Prisma + TypeScript + Fastify Stack Expert

Skill de referência para desenvolvimento no `keep-a-budget` backend. Contém as melhores práticas da stack, padrões de código estabelecidos no projeto e links para documentação oficial.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js + TypeScript |
| Framework HTTP | Fastify v5 |
| ORM | Prisma v6 + `@prisma/adapter-pg` |
| Banco de dados | PostgreSQL |
| Validação | class-validator + class-transformer |
| Logs | Pino (via Fastify logger) |
| Armazenamento | AWS S3 |
| Agendamento | node-cron |

## Documentação Oficial

Antes de implementar qualquer recurso relacionado a Prisma, consulte:

- **Prisma Client**: https://www.prisma.io/docs/orm/prisma-client
- **Schema Reference**: https://www.prisma.io/docs/orm/reference/prisma-schema-reference
- **Migrations**: https://www.prisma.io/docs/orm/prisma-migrate
- **Transactions**: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- **Filtering & Sorting**: https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting
- **Pagination**: https://www.prisma.io/docs/orm/prisma-client/queries/pagination
- **Relation Queries**: https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries
- **Raw SQL**: https://www.prisma.io/docs/orm/prisma-client/using-raw-sql

---

## Padrões do Projeto

### 1. Prisma Schema

- Sempre use `@map("snake_case")` para campos e `@@map("table_name")` para tabelas
- IDs são `String @id @default(uuid()) @db.Uuid`
- `createdAt` e `updatedAt` seguem o padrão:
  ```prisma
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  ```
- Campos monetários usam `Decimal @db.Decimal(12, 2)`
- Datas sem hora usam `@db.Date`
- Adicione índices explícitos (`@@index`) para colunas de filtragem frequente
- Use `onDelete: Cascade` ou `onDelete: SetNull` conforme a regra de negócio

### 2. Services

- **Nunca exporte `BaseService`** — ele está deprecated. Cada entidade tem seu próprio Service
- Use `prisma` singleton importado de `../lib/prisma`
- Para operações com transação, aceite `tx?: Prisma.TransactionClient` e use `const db = tx ?? prisma`
- Erros "não encontrado" seguem o padrão:

  ```typescript
  const notFound = (): never => {
    const error = new AppError("Resource not found", 404);
    (error as Error).name = "DocumentNotFoundError";
    throw error;
  };
  ```

- Mapeie rows do Prisma para interfaces de modelo via função pura `mapEntity`:
  ```typescript
  const mapExpense = (row: any): IExpense => ({
    id: row.id,
    _id: row.id,          // manter retrocompatibilidade
    amount: Number(row.amount),  // Decimal → number
    // ...
  });
  ```

- Use `runWithTransaction` para operações compostas:
  ```typescript
  import { runWithTransaction } from "../utils/runWithTransaction";

  await runWithTransaction(async (tx) => {
    await this.create(data, tx);
    await this.anotherService.update(id, patch, tx);
  }, { operationName: "create-expense-with-invoice" });
  ```

### 3. Controllers

- Extendem `BaseController`
- Todos os métodos de rota são arrow functions para garantir binding correto do `this`
- Erros são tratados com `this.handleError(error, reply)`
- Use `request.log` (pino) para logs de request, `logger` para logs de serviço

```typescript
export class EntityController extends BaseController {
  private service: EntityService;

  constructor() {
    super();
    this.service = new EntityService();
  }

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const result = await this.service.getAll();
      reply.send(result);
    } catch (error) {
      this.handleError(error, reply);
    }
  };
}
```

### 4. DTOs

- Use `class-validator` decorators para validação
- Use `class-transformer` para conversão de tipos
- Nomeie como `CreateEntityDto`, `UpdateEntityDto`, `EntityQueryParamsDto`

```typescript
import { IsString, IsNumber, IsOptional, IsEmail } from "class-validator";

export class CreateEntityDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  amount?: number;
}
```

### 5. Routes

- Registre rotas com tipo explícito no schema Fastify (para Swagger)
- Importe schemas de `../docs/entity.schemas.ts`

```typescript
import { FastifyInstance } from "fastify";
import { EntityController } from "../controllers/entity.controller";

export default async function entityRoutes(app: FastifyInstance) {
  const controller = new EntityController();

  app.get("/", { schema: getEntitySchema }, controller.getAll);
  app.get("/:id", { schema: getEntityByIdSchema }, controller.getById);
  app.post("/", { schema: createEntitySchema }, controller.create);
  app.put("/:id", { schema: updateEntitySchema }, controller.update);
  app.delete("/:id", { schema: deleteEntitySchema }, controller.delete);
}
```

### 6. FilterBuilder

Use `FilterBuilder` para construir filtros de query:

```typescript
import { FilterBuilder } from "../utils/filterBuilder";

buildFilter(query: EntityQueryParamsDto) {
  return new FilterBuilder()
    .addEquals("field", query.field)
    .addNumberRange("amount", query.minAmount, query.maxAmount)
    .addDateRange("createdAt", query.startDate, query.endDate)
    .build();
}
```

### 7. Erros e AppError

```typescript
import { AppError } from "../utils/AppError";

// Recurso não encontrado
throw new AppError("Resource not found", 404);

// Validação
throw new AppError("Invalid input", 400, { field: "email", reason: "already exists" });

// Não autorizado
throw new AppError("Unauthorized", 401);

// Não implementado
throw new AppError("Not implemented", 501);
```

---

## TypeScript — Boas Práticas nesta Codebase

### Tipagem

- Prefira `interface` para contratos de modelo (`IExpense`, `IUser`)
- Prefira `type` para unions, mappers e tipos utilitários
- Use `Partial<T>` nos métodos de update
- Nunca use `any` exceto no mapper de row do Prisma (necessário pois o Prisma retorna `Decimal`)
- Converta `Prisma.Decimal` para `number` sempre no mapper: `Number(row.amount)`

### Async/Await

- Sempre use `async/await` — nunca `.then()/.catch()` encadeados
- Prefira `try/catch` explícito nos controllers; nos services, deixe os erros borbulhar
- Use `Promise.all` para operações paralelas independentes

### Organização

- Funções utilitárias puras ficam em `src/utils/`
- Configurações ficam em `src/config/`
- Tipos globais ficam em `src/types/`
- Modelos de domínio ficam em `src/models/`

### Evitar

- Não use `!` (non-null assertion) — prefira guards explícitos
- Não use `as unknown as Type` — refatore o tipo
- Não deixe `console.log` — use `logger` (pino)
- Não faça queries Prisma diretamente nos controllers — passe pelo service

---

## Workflow: Criar uma Nova Entidade

1. **Schema Prisma** → adicione o model em `prisma/schema.prisma`
2. **Migration** → rode `pnpm prisma:migrate` (o usuário roda manualmente)
3. **Model interface** → crie `src/models/Entity.ts` com a interface `IEntity`
4. **DTO** → crie `src/dto/entity.dto.ts`
5. **Service** → crie `src/services/entity.service.ts` com mapper e métodos CRUD
6. **Controller** → crie `src/controllers/entity.controller.ts` estendendo `BaseController`
7. **Docs schema** → crie `src/docs/entity.schemas.ts` para Swagger
8. **Routes** → crie `src/routes/entities.ts` e registre em `src/server.ts`

---

## Checklist de Qualidade

- [ ] Tipos explícitos em todos os parâmetros e retornos de funções públicas
- [ ] Mapper converte `Decimal` → `number` e `null` → `undefined`
- [ ] Transações usadas quando há mais de uma operação de escrita
- [ ] `notFound()` lança `AppError` com status 404 e nome `DocumentNotFoundError`
- [ ] Logs com `logger` (pino) nos services, `request.log` nos controllers
- [ ] Schema Fastify definido para cada rota (Swagger + validação)
- [ ] `@map` e `@@map` presentes no schema Prisma para todos os campos/tabelas
