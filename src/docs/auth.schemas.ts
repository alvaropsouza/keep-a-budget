const authUserSchema = {
  type: "object",
  properties: {
    userId: { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
  },
};

const authSuccessSchema = {
  type: "object",
  properties: {
    userId: { type: "string" },
    email: { type: "string" },
    name: { type: "string" },
    sessionToken: { type: "string" },
    expiresAt: { type: "string", format: "date-time" },
    message: { type: "string" },
  },
};

export const authSchemas = {
  otpRequest: {
    tags: ["Auth"],
    description: "Request a one-time login code sent to the user email",
    body: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
      },
      required: ["email"],
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
  otpVerify: {
    tags: ["Auth"],
    description: "Verify a one-time login code and start a session",
    body: {
      type: "object",
      properties: {
        email: { type: "string", format: "email" },
        code: { type: "string", pattern: "^\\d{6}$" },
      },
      required: ["email", "code"],
    },
    response: {
      200: authSuccessSchema,
    },
  },
  authenticate: {
    tags: ["Auth"],
    description: "Authenticate an existing session token",
    body: {
      type: "object",
      properties: {
        token: { type: "string" },
      },
      required: ["token"],
    },
    response: {
      200: authSuccessSchema,
    },
  },
  validate: {
    tags: ["Auth"],
    description: "Validate current session",
    response: {
      200: {
        type: "object",
        properties: {
          valid: { type: "boolean" },
          user: authUserSchema,
          expiresAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  me: {
    tags: ["Auth"],
    description: "Get current authenticated user",
    response: {
      200: {
        type: "object",
        properties: {
          userId: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          expiresAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  logout: {
    tags: ["Auth"],
    description: "Revoke current session",
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
