export const expenseSchemas = {
  getAllExpenses: {
    tags: ["Expenses"],
    description: "Get all expenses with optional filtering",
    querystring: {
      type: "object",
      properties: {
        bank: { type: "string", enum: ["NUBANK", "XP"] },
        category: { type: "string" },
        cardInvoiceId: { type: "string" },
        minAmount: { type: "string" },
        maxAmount: { type: "string" },
        createdStartDate: { type: "string", format: "date-time" },
        createdEndDate: { type: "string", format: "date-time" },
        updatedStartDate: { type: "string", format: "date-time" },
        updatedEndDate: { type: "string", format: "date-time" },
      },
    },
    response: {
      200: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            bank: { type: "string" },
            category: { type: "string" },
            amount: { type: "number" },
            description: { type: "string" },
            receipt: { type: "string" },
            installment: { type: "object" },
            cardInvoiceId: { type: "string" },
          },
        },
      },
    },
  },

  getExpenseById: {
    tags: ["Expenses"],
    description: "Get expense by ID",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          category: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          receipt: { type: "string" },
          installment: { type: "object" },
          cardInvoiceId: { type: "string" },
        },
      },
    },
  },

  createExpense: {
    tags: ["Expenses"],
    description: "Create a new expense",
    body: {
      type: "object",
      properties: {
        bank: { type: "string", enum: ["NUBANK", "XP"] },
        category: { type: "string" },
        amount: { type: "number", minimum: 0 },
        description: { type: "string" },
        receiptUrl: { type: "string" },
        cardInvoiceId: { type: "string" },
        installmentTotal: { type: "number", minimum: 1 },
        installmentStartDate: { type: "string", format: "date-time" },
      },
      required: ["bank", "category", "amount"],
    },
    response: {
      201: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          category: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          receipt: { type: "string" },
          installment: { type: "object" },
          cardInvoiceId: { type: "string" },
        },
      },
    },
  },

  updateExpense: {
    tags: ["Expenses"],
    description: "Update an expense",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    body: {
      type: "object",
      properties: {
        bank: { type: "string", enum: ["NUBANK", "XP"] },
        category: { type: "string" },
        amount: { type: "number", minimum: 0 },
        description: { type: "string" },
        receiptUrl: { type: "string" },
        cardInvoiceId: { type: "string" },
        installmentTotal: { type: "number", minimum: 1 },
        installmentStartDate: { type: "string", format: "date-time" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          category: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          receipt: { type: "string" },
          installment: { type: "object" },
          cardInvoiceId: { type: "string" },
        },
      },
    },
  },

  deleteExpense: {
    tags: ["Expenses"],
    description: "Delete an expense",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      204: { type: "null" },
    },
  },

  uploadReceipt: {
    tags: ["Expenses"],
    description: "Upload a receipt for an expense",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          message: { type: "string" },
          receiptUrl: { type: "string" },
        },
      },
    },
  },
};
