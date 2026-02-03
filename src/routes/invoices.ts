import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  advanceInvoice,
} from "../controllers/invoices/invoices.controller";
import { invoiceSchemas } from "../docs/invoice.schemas";

async function invoiceRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  fastify.get(
    "/",
    {
      schema: invoiceSchemas.getAllInvoices,
    },
    getAllInvoices,
  );

  fastify.get(
    "/:id",
    {
      schema: invoiceSchemas.getInvoiceById,
    },
    getInvoiceById,
  );

  fastify.post(
    "/",
    {
      schema: invoiceSchemas.createInvoice,
    },
    createInvoice,
  );

  fastify.put(
    "/:id",
    {
      schema: invoiceSchemas.updateInvoice,
    },
    updateInvoice,
  );

  fastify.delete(
    "/:id",
    {
      schema: invoiceSchemas.deleteInvoice,
    },
    deleteInvoice,
  );

  fastify.post(
    "/:id/advance",
    {
      schema: invoiceSchemas.advanceInvoice,
    },
    advanceInvoice,
  );
}

export default invoiceRoutes;
