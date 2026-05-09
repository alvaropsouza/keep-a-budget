export const invoiceSchemas = {
  getAllInvoices: {
    tags: ["Invoices"],
    description: "Get all invoices with optional filtering",
    querystring: {
      type: "object",
      properties: {
        bank: { type: "string", enum: ["NUBANK", "XP"] },
        closingDate: { type: "string", format: "date-time" },
        dueDate: { type: "string", format: "date-time" },
        createdStartDate: { type: "string", format: "date-time" },
        createdEndDate: { type: "string", format: "date-time" },
        updatedStartDate: { type: "string", format: "date-time" },
        updatedEndDate: { type: "string", format: "date-time" },
        startDate: { type: "string", format: "date-time" },
        endDate: { type: "string", format: "date-time" },
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
            closingDate: { type: "string", format: "date-time" },
            dueDate: { type: "string", format: "date-time" },
            balance: { type: "number" },
            advance: { type: "number" },
            isClosed: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            expenses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  _id: { type: "string" },
                  bank: { type: "string" },
                  type: { type: "string", enum: ["ADVANCE", "EXPENSE"] },
                  category: { type: "string" },
                  amount: { type: "number" },
                  description: { type: "string" },
                  receipt: { type: "string" },
                  installment: {
                    type: "object",
                    properties: {
                      current: { type: "number" },
                      total: { type: "number" },
                    },
                  },
                  createdAt: { type: "string", format: "date-time" },
                  updatedAt: { type: "string", format: "date-time" },
                },
              },
            },
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
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          expenses: {
            type: "array",
            items: {
              type: "object",
              properties: {
                _id: { type: "string" },
                bank: { type: "string" },
                type: { type: "string", enum: ["ADVANCE", "EXPENSE"] },
                category: { type: "string" },
                amount: { type: "number" },
                description: { type: "string" },
                receipt: { type: "string" },
                installment: {
                  type: "object",
                  properties: {
                    current: { type: "number" },
                    total: { type: "number" },
                  },
                },
                createdAt: { type: "string", format: "date-time" },
                updatedAt: { type: "string", format: "date-time" },
              },
            },
          },
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
        closingDate: { type: "string", format: "date-time" },
        dueDate: { type: "string", format: "date-time" },
        balance: { type: "number" },
      },
      required: ["bank", "closingDate", "dueDate"],
    },
    response: {
      201: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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
        closingDate: { type: "string", format: "date-time" },
        dueDate: { type: "string", format: "date-time" },
        balance: { type: "number" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },

  advanceInvoice: {
    tags: ["Invoices"],
    description: "Advance a payment on an invoice",
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
        amount: { type: "number", minimum: 0.01 },
      },
      required: ["amount"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },

  closeInvoice: {
    tags: ["Invoices"],
    description: "Close an invoice manually",
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
        balance: { type: "number", minimum: 0 },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },

  reopenInvoice: {
    tags: ["Invoices"],
    description: "Reopen a closed invoice",
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
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
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

  importCsv: {
    tags: ["Invoices"],
    description:
      "Import expenses from a supported bank CSV export (XP/NUBANK). Replaces all existing expenses in the invoice with the CSV data.",
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    consumes: ["multipart/form-data"],
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },

  createFromCsv: {
    tags: ["Invoices"],
    description:
      "Create a new invoice and populate its expenses from a supported bank CSV export (XP/NUBANK).",
    consumes: ["multipart/form-data"],
    response: {
      201: {
        type: "object",
        properties: {
          _id: { type: "string" },
          bank: { type: "string" },
          closingDate: { type: "string", format: "date-time" },
          dueDate: { type: "string", format: "date-time" },
          balance: { type: "number" },
          advance: { type: "number" },
          isClosed: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },

  getSummary: {
    tags: ["Invoices"],
    description:
      "Get aggregated invoice totals: open/closed balances and per-bank breakdown.",
    response: {
      200: {
        type: "object",
        properties: {
          totalOpen: { type: "number" },
          totalClosed: { type: "number" },
          countOpen: { type: "number" },
          countClosed: { type: "number" },
          byBank: {
            type: "array",
            items: {
              type: "object",
              properties: {
                bank: { type: "string" },
                totalOpen: { type: "number" },
                totalClosed: { type: "number" },
                countOpen: { type: "number" },
                countClosed: { type: "number" },
              },
            },
          },
        },
      },
    },
  },
};
