# Keep a Budget API

> **✨ Projeto Recentemente Refatorado!** Esta aplicação passou por uma refatoração completa focada em clean code, reutilização de componentes e redução de complexidade. Veja [REFACTORING.md](./REFACTORING.md) para detalhes.

Backend application for managing credit card invoices and expenses. Built with Node.js, Fastify, MongoDB, and AWS S3 (compatible with MinIO).

## 🚀 Features

- **Card Invoices Management**: CRUD operations for credit card invoices with support for multiple banks.
- **Expenses Management**: CRUD operations for expenses with category tracking and installment support.
- **Receipt Storage**: Upload and store receipt images in AWS S3 or MinIO.
- **RESTful API**: High-performance API built with Fastify.
- **API Documentation**: Interactive Swagger UI documentation.
- **Clean Architecture**: Service layer, controllers, and reusable utilities following SOLID principles.

## 📋 Prerequisites

- Node.js (v20+)
- pnpm
- Docker & Docker Compose (for local infrastructure)

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/alvaropsouza/keep-a-budget.git
   cd keep-a-budget
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in the values.
   ```bash
   cp .env.example .env
   ```

## ⚙️ Environment Variables

The application requires the following environment variables:

```env
PORT=3000
MONGODB_URI=mongodb://admin:password@localhost:27017/keep-a-budget?authSource=admin

# AWS S3 / MinIO Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET_NAME=keep-a-budget-receipts
S3_ENDPOINT=http://localhost:9000
```

> **Note:** The default values above work with the provided `docker-compose.yml` setup.

## 🏃‍♂️ Running the App

### 1. Start Infrastructure

Start MongoDB and MinIO using Docker Compose:

```bash
docker-compose up -d
```

### 2. Run in Development Mode

Starts the server with auto-reload:

```bash
pnpm dev
```

### 3. Build and Start for Production

```bash
pnpm build
pnpm start
```

The server will start at `http://localhost:3000`.

## 🏗️ Project Structure

```
src/
├── config/           # Configuration (database, S3, logger, error handling)
├── controllers/      # Request handlers (thin layer)
├── services/         # Business logic (reusable, testable)
├── models/           # Mongoose models
├── dto/              # Data Transfer Objects with validation
├── routes/           # Route definitions
├── docs/             # Swagger schemas
├── enums/            # Enumerations
├── utils/            # Utilities (FilterBuilder, validation, S3 upload)
└── server.ts         # Application entry point
```

**Key Design Decisions:**
- **Services Layer**: All business logic is in services, making it reusable and testable
- **BaseService**: Generic CRUD operations inherited by all services
- **BaseController**: Standard error handling and validation
- **FilterBuilder**: Fluent API for building MongoDB queries
- **DTOs**: Centralized validation using class-validator

See [REFACTORING.md](./REFACTORING.md) for detailed architecture information.

## 📚 API Documentation

The API provides a Swagger UI documentation available at:
`http://localhost:3000/docs`

## 🐳 Docker Services

The `docker-compose.yml` file provides:

- **MongoDB**: Database service running on port `27017`.
- **MinIO**: S3-compatible object storage running on ports `9000` (API) and `9001` (Console).

Access MinIO Console at `http://localhost:9001` (User: `minioadmin`, Password: `minioadmin`).
