import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
} from "../controllers/invoices/invoices.controller";

async function invoiceRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
): Promise<void> {
  // Get all invoices with optional query filters
  fastify.get("/", getAllInvoices);

  // Get invoice by ID
  fastify.get("/:id", getInvoiceById);

  // Create new invoice
  fastify.post("/", createInvoice);

  // Update invoice
  fastify.put("/:id", updateInvoice);

  // Delete invoice
  fastify.delete("/:id", deleteInvoice);
}

export default invoiceRoutes;
