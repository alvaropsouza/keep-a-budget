# Migração de Serviços → Use Cases / Repository

## Arquitetura alvo

```
Controller → UseCase → Repository (DB)
                    → Service (integração externa)
                    → UseCase (orquestração)
```

## Concluídos

| Módulo | Status |
|--------|--------|
| categories | ✅ CategoryRepository + 5 UCs |
| budgets | ✅ BudgetRepository + 5 UCs + S3Service |
| ir-documents | ✅ IrDocumentRepository + 3 UCs |
| fixed-expenses | ✅ FixedExpenseRepository + 6 UCs |
| expenses | ✅ ExpenseRepository + 10 UCs |
| vehicles | ✅ RemoveBgService + UploadCarPhotoUseCase |
| email | ✅ Renomeado EmailService → ResendService (provider naming) |
| cache | ✅ Infraestrutura pura — manter como service |
| invoice | ✅ InvoiceRepository + 12 UCs (list, summary, getById, create, update, delete, createFromCsv, importFromCsv, advance, close, reopen, closeExpired) |

## Pendentes (ordem recomendada)

### 1. `user` — 233 linhas

**Service:** `src/services/user.service.ts`
**Controller:** `src/modules/users.controller.ts`
**Módulo:** `src/modules/users.module.ts`

Use cases:
- `GetUserUseCase`
- `GetUserByEmailUseCase`
- `CreateUserUseCase`
- `UpdateUserUseCase`
- `DeleteUserUseCase`

---

### 2. `auth` — 351 linhas ⚠️ SENSÍVEL

**Service:** `src/services/auth.service.ts`
**Controller:** `src/modules/auth.controller.ts`
**Módulo:** `src/modules/auth.module.ts`
**Jobs:** `src/jobs/session-cleanup.job.ts` (usa `AuthService`)

Envolve: sessões, OTP, WebAuthn, rate limiting.
`ResendService` é consumido aqui — deve continuar como service (integração externa).

Use cases (estimar):
- `RequestOtpUseCase`
- `VerifyOtpUseCase`
- `AuthenticateUseCase`
- `LogoutUseCase`
- `CleanExpiredSessionsUseCase` (usado pelo job)

---

### 3. `ai` — verificar tamanho

**Service:** `src/services/ai.service.ts`
**Controller:** `src/modules/ai.controller.ts`
**Módulo:** `src/modules/ai.module.ts`

Provavelmente só wrapping do SDK Anthropic — verificar se é pura integração externa ou tem lógica de negócio.

---

## Context para a nova sessão

**Arquitetura documentada em:** `keep-a-budget/CLAUDE.md` → seção "Arquitetura"

**Padrão de nomenclatura:**
- Repository: `[Resource]Repository` + métodos `findById` / `findMany` / `create` / `update` / `delete`
- UseCase: `[Verb][Resource]UseCase` + único método `execute(input): Promise<Output>`
- Service: `[Provider]Service` (só integração externa) — nome = provider, não domínio (ex: `ResendService` não `EmailService`)

**Arch check bloqueante:** `scripts/check-arch.mjs` — falha o build se controller importar service/repository diretamente. Violations atuais: `auth.controller`, `users.controller`, `ai.controller`.

**Convenção de log nos use cases:**
```typescript
private readonly logger = new Logger(NomeUseCase.name);

this.logger.log({ input }, "NomeUseCase.execute");
this.logger.log({ id: result.id }, "NomeUseCase.execute done");
this.logger.error({ err }, "NomeUseCase.execute failed");
```

**Transações:** usar `runWithTransaction` de `../../utils/run-with-transaction`. Repository methods aceitam `tx?: TxClient`.

**S3Service** (`src/services/s3.service.ts`) já implementado:
- `upload(buffer, fileName, mimeType, options?)` → `string` (s3Key)
- `getSignedUrl(keyOrUrl, expiresIn?)` → `string`
- `downloadObject(key)` → `Buffer`
- `deleteObject(keyOrUrl)` → `void`
- `generateKey(fileName, prefix?, userEmail?)` → `string`
