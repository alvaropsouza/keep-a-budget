export const fixedExpenseSchemas = {
  getAllFixedExpenses: {
    description: "Get all fixed expenses",
    tags: ["Fixed Expenses"],
    querystring: {
      type: "object",
      properties: {
        isActive: { type: "boolean" },
      },
    },
    response: {
      200: {
        description: "List of fixed expenses",
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            userId: { type: "string" },
            name: { type: "string" },
            amount: { type: "number" },
            description: { type: "string" },
            dueDay: { type: "number" },
            isActive: { type: "boolean" },
            createdAt: { type: "string" },
            updatedAt: { type: "string" },
          },
        },
      },
    },
  },
  getFixedExpenseById: {
    description: "Get a fixed expense by ID",
    tags: ["Fixed Expenses"],
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        description: "Fixed expense details",
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          name: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          dueDay: { type: "number" },
          isActive: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
      },
    },
  },
  createFixedExpense: {
    description: "Create a new fixed expense",
    tags: ["Fixed Expenses"],
    body: {
      type: "object",
      required: ["name", "amount"],
      properties: {
        name: { type: "string" },
        amount: { type: "number", minimum: 0 },
        description: { type: "string" },
        dueDay: { type: "number", minimum: 1, maximum: 31 },
        isActive: { type: "boolean" },
      },
    },
    response: {
      201: {
        description: "Fixed expense created successfully",
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          name: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          dueDay: { type: "number" },
          isActive: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
      },
    },
  },
  updateFixedExpense: {
    description: "Update a fixed expense",
    tags: ["Fixed Expenses"],
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
        name: { type: "string" },
        amount: { type: "number", minimum: 0 },
        description: { type: "string" },
        dueDay: { type: "number", minimum: 1, maximum: 31 },
        isActive: { type: "boolean" },
      },
    },
    response: {
      200: {
        description: "Fixed expense updated successfully",
        type: "object",
        properties: {
          _id: { type: "string" },
          userId: { type: "string" },
          name: { type: "string" },
          amount: { type: "number" },
          description: { type: "string" },
          dueDay: { type: "number" },
          isActive: { type: "boolean" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" },
        },
      },
    },
  },
  deleteFixedExpense: {
    description: "Delete a fixed expense",
    tags: ["Fixed Expenses"],
    params: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    response: {
      200: {
        description: "Fixed expense deleted successfully",
        type: "object",
        properties: {
          message: { type: "string" },
        },
      },
    },
  },
  getTotalFixedExpenses: {
    description: "Get total of all active fixed expenses",
    tags: ["Fixed Expenses"],
    response: {
      200: {
        description: "Total of active fixed expenses",
        type: "object",
        properties: {
          total: { type: "number" },
        },
      },
    },
  },
};
