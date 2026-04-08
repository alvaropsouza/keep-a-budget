# Changelog

## [Unreleased]

### Added

- **Exclusão seletiva de "Pagamento de fatura" na importação CSV**: o parser `parseXpCsv` agora aceita um `Set<number>` opcional de índices de linha a ignorar. Os endpoints `POST /invoices/:id/import-csv` e `POST /invoices/create-from-csv` aceitam o campo `excludeIndexes` (JSON array) no `multipart/form-data`, permitindo que o frontend envie quais linhas o usuário optou por descartar.
- **Suporte a CSV do Nubank**: a importação/criação de fatura via CSV agora aceita planilhas do Nubank (`date,title,amount`) além de XP.

### Changed

- **Importação CSV multi-banco**: os fluxos `import-csv` e `create-from-csv` passaram a usar parser por banco (`XP`/`NUBANK`); no `create-from-csv`, o banco passa a ser informado no `multipart/form-data`.

### Changed

- **Parser CSV XP**: A regra de auto-filtro de "Pagamento de fatura" por limiar de valor (-R$ 4.000) foi removida. Todos os lançamentos "Pagamento de fatura" agora são inclusos no resultado do parser e a decisão de ignorá-los fica a cargo do usuário via `excludeIndexes`. Entradas com valor zero continuam sendo descartadas.
- **Configuração S3**: removido `forcePathStyle` do cliente S3 e `S3_ENDPOINT` das variáveis de ambiente obrigatórias. A integração agora usa diretamente o AWS S3 sem necessidade de endpoint customizado.

## [2.6.0] - 2026-04-08

### Added

- **Importação de fatura via CSV (XP)**: Permite recriar as despesas de uma fatura a partir de uma planilha exportada pelo app XP
  - Novo endpoint `POST /invoices/:id/import-csv` (multipart/form-data)
  - Novo endpoint `POST /invoices/create-from-csv` (multipart/form-data) — cria a fatura e importa as despesas em uma única operação; aceita `closingDate`, `dueDate` e o arquivo CSV; banco fixo em XP
  - Novo parser `src/utils/xpCsvParser.ts` que suporta o formato XP: `Data;Estabelecimento;Portador;Valor;Parcela`
  - Apenas "Pagamento de fatura" e entradas com valor zero são ignoradas; estornos e adiantamentos são importados normalmente
  - Parcelas no formato `X de Y` são preservadas com `installment.current` e `installment.total`
  - As despesas existentes (tipo `EXPENSE`) da fatura são substituídas; adiantamentos não são afetados
  - Não é possível importar em faturas fechadas
  - Schema Swagger adicionado para `importCsv` e `createFromCsv`

### Added

- **Reabertura de faturas**: Endpoint para reabrir faturas fechadas
  - Novo endpoint `POST /invoices/:id/reopen`
  - Método `InvoiceService.reopenInvoice(id)`: Reabre uma fatura fechada
  - Validação: não permite reabrir fatura que já está aberta
  - Schema Swagger para `reopenInvoice`
- **Proteção de faturas fechadas**: Validações para impedir alterações em faturas fechadas
  - Criação de despesas bloqueada em faturas fechadas
  - Edição de despesas bloqueada em faturas fechadas
  - Exclusão de despesas bloqueada em faturas fechadas
  - Criação de parcelas bloqueada se qualquer fatura estiver fechada
  - Mensagens de erro claras orientando o usuário a reabrir a fatura

### Changed

- `ExpenseService.createSingle()`: Valida se fatura está fechada antes de criar despesa
- `ExpenseService.buildInstallments()`: Valida se faturas estão fechadas antes de criar parcelas
- `ExpenseService.updateExpense()`: Valida se fatura está fechada antes de editar despesa
- `ExpenseService.deleteExpense()`: Valida se fatura está fechada antes de excluir despesa

### Technical

- Método `reopenInvoice` exportado no `invoice.controller.ts`
- Rota configurada em `invoices.ts`
- Schema adicionado em `invoice.schemas.ts`

## [2.4.0] - 2026-02-19

### Added

- **Invoice closure functionality**: Faturas agora podem ser marcadas como fechadas (`isClosed`)
  - Novo campo `isClosed` no modelo `CardInvoice` (padrão: `false`)
  - Endpoint `POST /invoices/:id/close` para fechar fatura manualmente
  - Suporte para ajustar o valor da fatura ao fechar através do parâmetro opcional `balance`
  - Faturas fechadas ainda podem ter o `balance` alterado via `PUT /invoices/:id`
- **Verificação automática diária**: Job agendado para fechar faturas vencidas
  - Executa diariamente às 00:05
  - Fecha automaticamente faturas onde `closingDate` já passou e `isClosed` é `false`
  - Logs estruturados de todas as faturas fechadas automaticamente
- **Novo DTO**: `CloseInvoiceDto` para fechar faturas com valor opcional
- **Documentação Swagger**: Schema completo da nova rota de fechamento de faturas

### Changed

- `UpdateInvoiceDto` agora aceita o campo opcional `isClosed`
- Todos os schemas de resposta do Swagger incluem o campo `isClosed`

### Technical

- Adicionada dependência `node-cron` (v4.2.1) para agendamento de tarefas
- Novo serviço `InvoiceClosureJob` em `src/jobs/invoiceClosureJob.ts`
- Métodos adicionados em `InvoiceService`:
  - `closeInvoice(id, manualBalance?)`: Fecha uma fatura específica
  - `checkAndCloseExpiredInvoices()`: Verifica e fecha faturas vencidas

## [2.3.0] - 2026-02-17

### Added

- **Automatic invoice generation for installments**: when a purchase is split into installments, the API now creates any missing future invoices for the same bank so each parcel has a card invoice to attach to.

### Improved

- Reused the new invoice generation flow during installment creation, ensuring balances stay in sync as soon as expenses are persisted.

## [2.2.0] - 2026-02-17

### Added

- **Partial installment creation**: New `installmentStartNumber` parameter lets the backend generate only the remaining parcels of a purchase, preserving original numbering and invoice alignment.
- **UI controls**: Expense dialog now exposes a "Parcela inicial" field with validation and helper text so users can start at the current installment directly from the web app.

### Changed

- Installment generation logic now validates parcel ranges and offsets dates based on the chosen starting number, ensuring descriptions (e.g., `8/10`) match what is saved.
- Fastify schemas and multipart parsing were updated to document and accept the new field across API clients.

## [2.1.0] - 2026-02-07

### ✨ Improved S3 URL Management

This release introduces a comprehensive S3 URL management system for better file handling.

### Added

- **`src/utils/s3Url.ts`**: Centralized S3 URL utilities
  - `getS3Url()`: Generate public URLs for S3 objects
  - `getKeyFromUrl()`: Extract S3 keys from URLs
  - `isValidS3Url()`: Validate S3 URLs
  - `getS3BaseUrl()`: Get bucket base URL
  - `getS3UrlConfig()`: Environment-based configuration
- **`docs/S3_URL_MANAGEMENT.md`**: Complete documentation for S3 URL system
- **`generateS3Key()`**: Utility function for generating unique S3 keys

### Changed

- **`uploadToS3()`**: Refactored to use centralized URL generation
  - Now returns clean URLs from `getS3Url()` helper
  - Removed duplicate URL construction logic
  - Added support for custom ACL and key prefix options
  - Better logging with structured data
- **Environment Handling**: Automatic detection of MinIO vs AWS S3
  - Path-style URLs for MinIO (local development)
  - Virtual-hosted URLs for AWS S3 (production)

### Improved

- **Type Safety**: Added proper TypeScript types for S3 operations
- **Logging**: Structured logging for URL generation and file uploads
- **Documentation**: Comprehensive guide with usage examples
- **Maintainability**: Single source of truth for URL logic

### Benefits

- 🎯 Centralized URL management
- 🔄 Environment-aware URL generation
- 🛡️ Better type safety
- 📝 Comprehensive documentation
- 🧪 Easier testing and mocking

## [2.0.0] - 2026-02-03

### 🎉 Major Refactoring - Complete Architecture Overhaul

This release represents a complete refactoring of the codebase with focus on clean code, reusability, and maintainability.

### Added

- **Service Layer**: Introduced `BaseService` with generic CRUD operations
  - `ExpenseService`: Business logic for expenses
  - `InvoiceService`: Business logic for invoices
- **FilterBuilder**: Fluent API utility for building MongoDB queries
- **BaseController**: Abstract controller with standard error handling and validation
- **Consolidated DTOs**: Moved all DTOs to `src/dto/` directory
- **Comprehensive documentation**: Added `REFACTORING.md` with detailed architecture guide

### Changed

- **Controllers**: Reduced from ~750 lines to ~300 lines (-60%)
  - `expense.controller.ts`: Simplified from 470 to 140 lines
  - `invoice.controller.ts`: Simplified from 280 to 90 lines
- **Architecture**: Separated business logic from request handling
  - Controllers now only handle HTTP concerns
  - Services contain all business logic
- **Error Handling**: Centralized in `BaseController`
- **Validation**: Standardized using `BaseController.validate()`
- **Code Organization**: Removed nested controller directories

### Removed

- Duplicated filter building functions (6+ instances)
- Nested directory structure in controllers
- Redundant validation code
- Mixed responsibilities in controllers

### Technical Improvements

- **Reduced Complexity**: Cyclomatic complexity significantly reduced
- **Better Testability**: Services can be tested independently
- **DRY Principle**: Eliminated code duplication through inheritance and composition
- **SOLID Principles**: Single Responsibility, Open/Closed, Dependency Inversion
- **Type Safety**: Improved TypeScript typing throughout

### Migration Guide

No breaking changes to the API. All endpoints remain the same. Internal structure only.

### Performance

- No performance impact
- Slightly improved due to reduced code paths

---

## [1.0.0] - Initial Release

- Basic CRUD for invoices and expenses
- S3 receipt upload support
- Swagger documentation
- MongoDB integration
