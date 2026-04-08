import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  advanceInvoice,
  closeInvoice,
  reopenInvoice,
  importInvoiceCsv,
  createInvoiceFromCsv,
} from "../controllers/invoice.controller";
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

  fastify.post(
    "/create-from-csv",
    {
      schema: invoiceSchemas.createFromCsv,
    },
    createInvoiceFromCsv,
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

  fastify.post(
    "/:id/close",
    {
      schema: invoiceSchemas.closeInvoice,
    },
    closeInvoice,
  );

  fastify.post(
    "/:id/reopen",
    {
      schema: invoiceSchemas.reopenInvoice,
    },
    reopenInvoice,
  );

  fastify.post(
    "/:id/import-csv",
    {
      schema: invoiceSchemas.importCsv,
    },
    importInvoiceCsv,
  );
}

export default invoiceRoutes;
