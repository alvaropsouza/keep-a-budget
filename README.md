# keep-a-budget

Backend app responsible for keeping track of credit card invoice expenses. Built with Node.js, Fastify, MongoDB, and AWS S3.

## Features

- **Card Invoices Management**: CRUD operations for credit card invoices with support for multiple banks (NUBANK, XP)
- **Expenses Management**: CRUD operations for expenses with category tracking, receipt storage, and installment support
- **Installment Handling**: Automatically creates N monthly expenses when installment is set, properly handling year transitions
- **Query Filters**: All GET routes support filtering by fields and date ranges
- **Receipt Storage**: Upload and store receipt images in AWS S3
- **RESTful API**: Clean REST API built with Fastify framework

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote instance)
- AWS Account with S3 bucket configured

## Installation

1. Clone the repository:
```bash
git clone https://github.com/alvaropsouza/keep-a-budget.git
cd keep-a-budget
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/keep-a-budget
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=keep-a-budget-receipts
```

## Running the Application

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Health Check
- `GET /health` - Check if the server is running

### Card Invoices

#### Get all invoices (with optional filters)
```
GET /api/invoices
```

Query parameters:
- `bank` - Filter by bank (NUBANK or XP)
- `invoiceDate` - Filter by specific invoice date
- `startDate` - Filter invoices from this date
- `endDate` - Filter invoices until this date
- `createdStartDate` - Filter by creation date from
- `createdEndDate` - Filter by creation date until
- `updatedStartDate` - Filter by update date from
- `updatedEndDate` - Filter by update date until

Example:
```bash
curl "http://localhost:3000/api/invoices?bank=NUBANK&startDate=2024-01-01"
```

#### Get invoice by ID
```
GET /api/invoices/:id
```

#### Create new invoice
```
POST /api/invoices
```

Request body:
```json
{
  "invoiceDate": "2024-01-15",
  "bank": "NUBANK"
}
```

#### Update invoice
```
PUT /api/invoices/:id
```

Request body:
```json
{
  "invoiceDate": "2024-01-20",
  "bank": "XP"
}
```

#### Delete invoice
```
DELETE /api/invoices/:id
```

### Expenses

#### Get all expenses (with optional filters)
```
GET /api/expenses
```

Query parameters:
- `bank` - Filter by bank
- `category` - Filter by category
- `cardInvoiceId` - Filter by card invoice ID
- `minAmount` - Filter by minimum amount
- `maxAmount` - Filter by maximum amount
- `createdStartDate` - Filter by creation date from
- `createdEndDate` - Filter by creation date until
- `updatedStartDate` - Filter by update date from
- `updatedEndDate` - Filter by update date until

Example:
```bash
curl "http://localhost:3000/api/expenses?category=groceries&minAmount=50"
```

#### Get expense by ID
```
GET /api/expenses/:id
```

#### Create new expense
```
POST /api/expenses
```

Request body (single expense):
```json
{
  "bank": "NUBANK",
  "category": "groceries",
  "amount": 150.50,
  "description": "Weekly shopping",
  "cardInvoiceId": "657abc123def456789012345"
}
```

Request body (with installments - creates N monthly expenses):
```json
{
  "bank": "NUBANK",
  "category": "electronics",
  "amount": 1200.00,
  "description": "New laptop",
  "installmentTotal": 12,
  "cardInvoiceId": "657abc123def456789012345"
}
```

Note: When `installmentTotal` is set, the system automatically creates N expenses, one for each month, properly handling year transitions.

#### Update expense
```
PUT /api/expenses/:id
```

Request body:
```json
{
  "category": "electronics",
  "amount": 1300.00
}
```

#### Delete expense
```
DELETE /api/expenses/:id
```

#### Upload receipt
```
POST /api/expenses/:id/receipt
```

Request: multipart/form-data with file field

Example using curl:
```bash
curl -X POST \
  -F "file=@/path/to/receipt.jpg" \
  http://localhost:3000/api/expenses/657abc123def456789012345/receipt
```

## Data Models

### CardInvoice
- `invoiceDate` (Date, required) - The invoice date
- `bank` (String, required) - Bank name (enum: NUBANK, XP)
- `createdAt` (Date, auto) - Creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

### Expense
- `bank` (String, required) - Bank name
- `category` (String, required) - Expense category
- `amount` (Number, required) - Expense amount
- `description` (String, optional) - Expense description
- `receipt` (String, optional) - S3 URL of receipt image
- `installment` (Object, optional)
  - `current` (Number) - Current installment number
  - `total` (Number) - Total number of installments
- `cardInvoiceId` (ObjectId, optional) - Reference to CardInvoice
- `createdAt` (Date, auto) - Creation timestamp
- `updatedAt` (Date, auto) - Last update timestamp

## Project Structure

```
keep-a-budget/
├── src/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   └── s3.js            # AWS S3 client configuration
│   ├── controllers/
│   │   ├── expenseController.js   # Expense business logic
│   │   └── invoiceController.js   # Invoice business logic
│   ├── models/
│   │   ├── CardInvoice.js   # CardInvoice Mongoose schema
│   │   └── Expense.js       # Expense Mongoose schema
│   ├── routes/
│   │   ├── expenses.js      # Expense routes
│   │   └── invoices.js      # Invoice routes
│   ├── utils/
│   │   └── s3Upload.js      # S3 upload utility
│   └── server.js            # Main application entry point
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore file
├── package.json             # Project dependencies
└── README.md                # This file
```

## Technologies Used

- **Fastify** - Fast and low overhead web framework
- **MongoDB** with **Mongoose** - Database and ODM
- **AWS S3** - Receipt image storage
- **@fastify/multipart** - File upload handling
- **dotenv** - Environment variable management

## License

ISC

