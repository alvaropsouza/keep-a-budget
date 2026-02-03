# Changelog

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
