# API Integration Guide

This guide provides detailed information on how to integrate with the Keep a Budget API.

## Base URL

All API requests should be made to the base URL:
`http://localhost:3000` (or your configured host/port)

## Authentication

Currently, the API does not enforce authentication. Ensure that the API is deployed in a secure environment or behind a gateway if public access is required.

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of a request.

- `200 OK`: The request was successful.
- `201 Created`: The resource was successfully created.
- `400 Bad Request`: The request was invalid or cannot be served. Check the response body for validation errors.
- `404 Not Found`: The requested resource could not be found.
- `500 Internal Server Error`: An error occurred on the server.

Error responses typically follow this format:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid request parameters"
}
```

## Endpoints

### Invoices

Manage credit card invoices.

#### 1. Get All Invoices

Retrieve a list of invoices with optional filtering.

- **Endpoint**: `GET /invoices`
- **Query Parameters**:
  - `bank` (string): Filter by bank name (`NUBANK`, `XP`).
  - `startDate` (string, ISO 8601): Filter by range start date.
  - `endDate` (string, ISO 8601): Filter by range end date.
  - `openDate` (string, ISO 8601): Exact match for open date.
  - `closingDate` (string, ISO 8601): Exact match for closing date.
  - `dueDate` (string, ISO 8601): Exact match for due date.

**Example Request:**

```http
GET /invoices?bank=NUBANK&startDate=2023-01-01T00:00:00Z
```

#### 2. Get Invoice by ID

Retrieve a specific invoice by its ID.

- **Endpoint**: `GET /invoices/:id`
- **Path Parameters**:
  - `id` (string): The ID of the invoice.

**Example Request:**

```http
GET /invoices/658...
```

#### 3. Create Invoice

Create a new invoice.

- **Endpoint**: `POST /invoices`
- **Body Parameters**:
  - `bank` (string, required): Bank name (`NUBANK`, `XP`).
  - `openDate` (string, ISO 8601, required): Invoice open date.
  - `closingDate` (string, ISO 8601, required): Invoice closing date.
  - `dueDate` (string, ISO 8601, required): Invoice due date.
  - `amount` (number, optional): Initial amount (default: 0).

**Example Request:**

```json
{
  "bank": "NUBANK",
  "openDate": "2023-12-01T00:00:00.000Z",
  "closingDate": "2023-12-31T00:00:00.000Z",
  "dueDate": "2024-01-07T00:00:00.000Z"
}
```

#### 4. Update Invoice

Update an existing invoice.

- **Endpoint**: `PUT /invoices/:id`
- **Path Parameters**:
  - `id` (string): The ID of the invoice.
- **Body Parameters**: Same as Create Invoice (all optional).

#### 5. Delete Invoice

Delete an invoice.

- **Endpoint**: `DELETE /invoices/:id`
- **Path Parameters**:
  - `id` (string): The ID of the invoice.

---

### Expenses

Manage expenses, including receipt uploads and installments.

#### 1. Get All Expenses

Retrieve a list of expenses with optional filtering.

- **Endpoint**: `GET /expenses`
- **Query Parameters**:
  - `bank` (string): Filter by bank name.
  - `category` (string): Filter by category.
  - `cardInvoiceId` (string): Filter by invoice ID.
  - `minAmount` (number): Minimum amount.
  - `maxAmount` (number): Maximum amount.
  - `createdStartDate` (string, ISO 8601): Filter by creation date start.
  - `createdEndDate` (string, ISO 8601): Filter by creation date end.

**Example Request:**

```http
GET /expenses?category=Food&minAmount=50
```

#### 2. Get Expense by ID

Retrieve a specific expense by its ID.

- **Endpoint**: `GET /expenses/:id`
- **Path Parameters**:
  - `id` (string): The ID of the expense.

#### 3. Create Expense

Create a new expense. Supports file upload for receipts.

- **Endpoint**: `POST /expenses`
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `bank` (string, required): Bank name (`NUBANK`, `XP`).
  - `category` (string, required): Expense category.
  - `amount` (number, required): Expense amount.
  - `description` (string, optional): Description.
  - `installmentTotal` (number, optional): Total installments (default: 1).
  - `installmentStartDate` (string, ISO 8601, optional): Start date for installments.
  - `file` (file, optional): Receipt image file.

**Note on Installments:**
If `installmentTotal` > 1, the system will automatically generate multiple expense records, one for each month starting from `installmentStartDate` (or current date).

**Example Request (cURL):**

```bash
curl -X POST http://localhost:3000/expenses \
  -F "bank=NUBANK" \
  -F "category=Electronics" \
  -F "amount=1200" \
  -F "installmentTotal=10" \
  -F "file=@receipt.jpg"
```

#### 4. Update Expense

Update an existing expense.

- **Endpoint**: `PUT /expenses/:id`
- **Path Parameters**:
  - `id` (string): The ID of the expense.
- **Body Parameters**: Same as Create Expense (excluding file upload).

#### 5. Delete Expense

Delete an expense.

- **Endpoint**: `DELETE /expenses/:id`
- **Path Parameters**:
  - `id` (string): The ID of the expense.

#### 6. Upload Receipt

Upload a receipt for an existing expense.

- **Endpoint**: `POST /expenses/:id/receipt`
- **Content-Type**: `multipart/form-data`
- **Path Parameters**:
  - `id` (string): The ID of the expense.
- **Body Parameters**:
  - `file` (file, required): Receipt image file.

## Data Models

### Invoice Object

```json
{
  "_id": "string",
  "bank": "string",
  "openDate": "string (ISO 8601)",
  "closingDate": "string (ISO 8601)",
  "dueDate": "string (ISO 8601)",
  "amount": "number",
  "expenses": [ ... ] // Array of Expense Objects
}
```

### Expense Object

```json
{
  "_id": "string",
  "bank": "string",
  "category": "string",
  "amount": "number",
  "description": "string",
  "receipt": "string (URL)",
  "installment": {
    "current": "number",
    "total": "number"
  },
  "cardInvoiceId": "string"
}
```
