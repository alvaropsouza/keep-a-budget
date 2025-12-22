# API Testing Guide

## Prerequisites

Before testing, ensure you have:
1. MongoDB running (local or remote)
2. AWS S3 bucket configured with proper credentials
3. Environment variables set in `.env` file

## Quick Start Testing

### 1. Start the server
```bash
npm run dev
```

### 2. Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing Card Invoices

### Create an Invoice
```bash
curl -X POST http://localhost:3000/api/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceDate": "2024-01-15",
    "bank": "NUBANK"
  }'
```

### Get All Invoices
```bash
curl http://localhost:3000/api/invoices
```

### Get Invoices with Filters
```bash
# Filter by bank
curl "http://localhost:3000/api/invoices?bank=NUBANK"

# Filter by date range
curl "http://localhost:3000/api/invoices?startDate=2024-01-01&endDate=2024-12-31"

# Multiple filters
curl "http://localhost:3000/api/invoices?bank=XP&startDate=2024-01-01"
```

### Get Invoice by ID
```bash
curl http://localhost:3000/api/invoices/{invoice_id}
```

### Update Invoice
```bash
curl -X PUT http://localhost:3000/api/invoices/{invoice_id} \
  -H "Content-Type: application/json" \
  -d '{
    "bank": "XP"
  }'
```

### Delete Invoice
```bash
curl -X DELETE http://localhost:3000/api/invoices/{invoice_id}
```

## Testing Expenses

### Create a Single Expense
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "bank": "NUBANK",
    "category": "groceries",
    "amount": 150.50,
    "description": "Weekly shopping"
  }'
```

### Create Expense with Installments
This will create 12 monthly expenses automatically:
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "bank": "NUBANK",
    "category": "electronics",
    "amount": 1200.00,
    "description": "New laptop",
    "installmentTotal": 12
  }'
```

### Get All Expenses
```bash
curl http://localhost:3000/api/expenses
```

### Get Expenses with Filters
```bash
# Filter by category
curl "http://localhost:3000/api/expenses?category=groceries"

# Filter by bank
curl "http://localhost:3000/api/expenses?bank=NUBANK"

# Filter by amount range
curl "http://localhost:3000/api/expenses?minAmount=100&maxAmount=500"

# Filter by date range
curl "http://localhost:3000/api/expenses?createdStartDate=2024-01-01&createdEndDate=2024-12-31"

# Multiple filters
curl "http://localhost:3000/api/expenses?category=electronics&minAmount=1000"
```

### Get Expense by ID
```bash
curl http://localhost:3000/api/expenses/{expense_id}
```

### Update Expense
```bash
curl -X PUT http://localhost:3000/api/expenses/{expense_id} \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 175.00,
    "description": "Updated weekly shopping"
  }'
```

### Upload Receipt Image
```bash
curl -X POST http://localhost:3000/api/expenses/{expense_id}/receipt \
  -F "file=@/path/to/receipt.jpg"
```

### Delete Expense
```bash
curl -X DELETE http://localhost:3000/api/expenses/{expense_id}
```

## Testing Installment Feature

The installment feature is one of the key functionalities. Here's how to test it:

1. Create an expense with installments:
```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "bank": "NUBANK",
    "category": "furniture",
    "amount": 500.00,
    "description": "Sofa",
    "installmentTotal": 6
  }'
```

2. Verify that 6 expenses were created:
```bash
curl http://localhost:3000/api/expenses
```

You should see 6 expenses, each with:
- `installment.current`: 1, 2, 3, 4, 5, 6
- `installment.total`: 6
- Sequential monthly `createdAt` dates

3. Check that year transitions work correctly:
```bash
# Create a 6-month installment in October
# This should create expenses spanning into the next year
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "bank": "NUBANK",
    "category": "test",
    "amount": 600.00,
    "installmentTotal": 6
  }'
```

## Using Postman

You can import this collection into Postman for easier testing:

1. Create a new collection named "Keep-a-Budget API"
2. Set a collection variable: `base_url` = `http://localhost:3000`
3. Add requests for each endpoint using the examples above
4. Replace hardcoded IDs with Postman variables: `{{invoice_id}}`, `{{expense_id}}`

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- Verify network connectivity to MongoDB

### S3 Upload Error
- Verify AWS credentials in `.env`
- Check S3 bucket exists and is accessible
- Ensure proper IAM permissions for S3 uploads

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`
