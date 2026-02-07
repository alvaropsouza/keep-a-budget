export const userSchemas = {
  getAllUsers: {
    tags: ["Users"],
    description: "Get all users",
    response: {
      200: {
        type: "array",
        items: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            lastName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            salary: { type: "number" },
            avatar: { type: "string" },
            lastLogin: { type: "string", format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  getUserById: {
    tags: ["Users"],
    description: "Get user by ID",
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
          name: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          salary: { type: "number" },
          avatar: { type: "string" },
          lastLogin: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  getUserByEmail: {
    tags: ["Users"],
    description: "Get user by email",
    params: {
      type: "object",
      properties: {
        email: { type: "string" },
      },
      required: ["email"],
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          salary: { type: "number" },
          avatar: { type: "string" },
          lastLogin: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  createUser: {
    tags: ["Users"],
    description: "Create a new user",
    body: {
      type: "object",
      properties: {
        name: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        salary: { type: "number", minimum: 0 },
        avatar: { type: "string" },
        lastLogin: { type: "string", format: "date-time" },
      },
      required: ["name", "lastName", "email"],
    },
    response: {
      201: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          salary: { type: "number" },
          avatar: { type: "string" },
          lastLogin: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  updateUser: {
    tags: ["Users"],
    description: "Update a user",
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
        lastName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        salary: { type: "number", minimum: 0 },
        avatar: { type: "string" },
        lastLogin: { type: "string", format: "date-time" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          _id: { type: "string" },
          name: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          salary: { type: "number" },
          avatar: { type: "string" },
          lastLogin: { type: "string", format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  deleteUser: {
    tags: ["Users"],
    description: "Delete a user",
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
        },
      },
    },
  },
};
