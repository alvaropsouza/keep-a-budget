export const invoiceSchemas = {
  getAllInvoices: {
    tags: ["Invoices"],
    description: "Get all invoices with optional filtering",
    querystring: {
      type: "object",
      properties: {
        bank: { type: "string", enum: ["NUBANK", "XP"] },
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
            dueDate: { type: "string", format: "date-time" },
            amount: { type: "number" },
            closingDate: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },

  getInvoiceById: {
    tags: ["Invoices"],
    description: "Get invoice by ID",
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
          dueDate: { type: "string", format: "date-time" },
          amount: { type: "number" },
          closingDate: { type: "string", format: "date-time" },
        },
      },
    },
  },

  createInvoice: {
    tags: ["Invoices"],
    description: "Create a new invoice",
    body: {
      type: "object",
      properties: {
        bank: { type: "string", enum: ["NUBANK", "XP"] },
        dueDate: { type: "string", format: "date-time" },
        amount: { type: "number", minimum: 0 },
        closingDate: { type: "string", format: "date-time" },
      },
      required: ["bank", "dueDate", "amount", "closingDate"],
    },
    response: {
      201: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          dueDate: { type: "string", format: "date-time" },
          amount: { type: "number" },
          closingDate: { type: "string", format: "date-time" },
        },
      },
    },
  },

  updateInvoice: {
    tags: ["Invoices"],
    description: "Update an invoice",
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
        dueDate: { type: "string", format: "date-time" },
        amount: { type: "number", minimum: 0 },
        closingDate: { type: "string", format: "date-time" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          dueDate: { type: "string", format: "date-time" },
          amount: { type: "number" },
          closingDate: { type: "string", format: "date-time" },
        },
      },
    },
  },

  deleteInvoice: {
    tags: ["Invoices"],
    description: "Delete an invoice",
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
};
