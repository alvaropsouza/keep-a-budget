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
      preHandler: fastify.authenticate,
    },
    getAllInvoices,
  );

  fastify.get(
    "/:id",
    {
      schema: invoiceSchemas.getInvoiceById,
      preHandler: fastify.authenticate,
    },
    getInvoiceById,
  );

  fastify.post(
    "/",
    {
      schema: invoiceSchemas.createInvoice,
      preHandler: fastify.authenticate,
    },
    createInvoice,
  );

  fastify.post(
    "/create-from-csv",
    {
      schema: invoiceSchemas.createFromCsv,
      preHandler: fastify.authenticate,
    },
    createInvoiceFromCsv,
  );

  fastify.put(
    "/:id",
    {
      schema: invoiceSchemas.updateInvoice,
      preHandler: fastify.authenticate,
    },
    updateInvoice,
  );

  fastify.delete(
    "/:id",
    {
      schema: invoiceSchemas.deleteInvoice,
      preHandler: fastify.authenticate,
    },
    deleteInvoice,
  );

  fastify.post(
    "/:id/advance",
    {
      schema: invoiceSchemas.advanceInvoice,
      preHandler: fastify.authenticate,
    },
    advanceInvoice,
  );

  fastify.post(
    "/:id/close",
    {
      schema: invoiceSchemas.closeInvoice,
      preHandler: fastify.authenticate,
    },
    closeInvoice,
  );

  fastify.post(
    "/:id/reopen",
    {
      schema: invoiceSchemas.reopenInvoice,
      preHandler: fastify.authenticate,
    },
    reopenInvoice,
  );

  fastify.post(
    "/:id/import-csv",
    {
      schema: invoiceSchemas.importCsv,
      preHandler: fastify.authenticate,
    },
    importInvoiceCsv,
  );
}

export default invoiceRoutes;
