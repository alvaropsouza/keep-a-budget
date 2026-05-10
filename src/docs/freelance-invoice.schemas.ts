import { getSchemaPath } from "@nestjs/swagger";

export const freelanceInvoiceSchemas = {
  InvoiceItem: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      description: { type: "string" },
      quantity: { type: "number" },
      unitPrice: { type: "number" },
      total: { type: "number" },
    },
  },
  Invoice: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      invoiceNumber: { type: "string", example: "INV-000001" },
      clientName: { type: "string" },
      clientEmail: { type: "string", nullable: true },
      issueDate: { type: "string", format: "date" },
      dueDate: { type: "string", format: "date", nullable: true },
      status: { type: "string", enum: ["draft", "sent", "paid"] },
      total: { type: "number" },
      notes: { type: "string", nullable: true },
      items: {
        type: "array",
        items: { $ref: getSchemaPath("InvoiceItem") },
      },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  CreateInvoiceItemDto: {
    type: "object",
    properties: {
      description: { type: "string" },
      quantity: { type: "number", minimum: 0.01 },
      unitPrice: { type: "number", minimum: 0.01 },
    },
    required: ["description", "quantity", "unitPrice"],
  },
  CreateInvoiceDto: {
    type: "object",
    properties: {
      clientName: { type: "string" },
      clientEmail: { type: "string", format: "email", nullable: true },
      issueDate: { type: "string", format: "date" },
      dueDate: { type: "string", format: "date", nullable: true },
      items: {
        type: "array",
        items: { $ref: getSchemaPath("CreateInvoiceItemDto") },
      },
      notes: { type: "string", nullable: true },
    },
    required: ["clientName", "issueDate", "items"],
  },
};
