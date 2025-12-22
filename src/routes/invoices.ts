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
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get("/", getAllInvoices);
  fastify.get("/:id", getInvoiceById);
  fastify.post("/", createInvoice);
  fastify.put("/:id", updateInvoice);
  fastify.delete("/:id", deleteInvoice);
}

export default invoiceRoutes;
