# Changelog

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
