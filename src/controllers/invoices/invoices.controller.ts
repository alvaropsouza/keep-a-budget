import { FastifyRequest, FastifyReply } from "fastify";
import CardInvoice from "../../models/CardInvoice";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParamsDto,
} from "./dto/invoice.dto";

// Helper function to add date range filter
const addDateRangeFilter = (
  filter: Record<string, unknown>,
  field: string,
  startDate?: string,
  endDate?: string
) => {
  if (startDate || endDate) {
    filter[field] = {};
    if (startDate) {
      (filter[field] as Record<string, Date>).$gte = new Date(startDate);
    }
    if (endDate) {
      (filter[field] as Record<string, Date>).$lte = new Date(endDate);
    }
  }
};

// Helper function to build filter query
const buildFilterQuery = (
  queryParams: InvoiceQueryParamsDto
): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  // Filter by bank
  if (queryParams.bank) {
    filter.bank = queryParams.bank;
  }

  // Filter by invoiceDate
  if (queryParams.invoiceDate) {
    filter.invoiceDate = new Date(queryParams.invoiceDate);
  }

  // Date range filters
  addDateRangeFilter(
    filter,
    "invoiceDate",
    queryParams.startDate,
    queryParams.endDate
  );

  // Created at date range
  addDateRangeFilter(
    filter,
    "createdAt",
    queryParams.createdStartDate,
    queryParams.createdEndDate
  );

  // Updated at date range
  addDateRangeFilter(
    filter,
    "updatedAt",
    queryParams.updatedStartDate,
    queryParams.updatedEndDate
  );

  return filter;
};

// Get all invoices with optional filters
export const getAllInvoices = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const filter = buildFilterQuery(request.query as InvoiceQueryParamsDto);
    const invoices = await CardInvoice.find(filter).sort({ invoiceDate: -1 });
    reply.send(invoices);
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message });
  }
};

// Get invoice by ID
export const getInvoiceById = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const invoice = await CardInvoice.findById(
      (request.params as { id: string }).id
    );
    if (!invoice) {
      reply.status(404).send({ error: "Invoice not found" });
      return;
    }
    reply.send(invoice);
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message });
  }
};

// Create new invoice
export const createInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const invoice = new CardInvoice(request.body as CreateInvoiceDto);
    await invoice.save();
    reply.status(201).send(invoice);
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

// Update invoice
export const updateInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const invoice = await CardInvoice.findByIdAndUpdate(
      (request.params as { id: string }).id,
      request.body as UpdateInvoiceDto,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      reply.status(404).send({ error: "Invoice not found" });
      return;
    }
    reply.send(invoice);
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

// Delete invoice
export const deleteInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const invoice = await CardInvoice.findByIdAndDelete(
      (request.params as { id: string }).id
    );
    if (!invoice) {
      reply.status(404).send({ error: "Invoice not found" });
      return;
    }
    reply.send({ message: "Invoice deleted successfully" });
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message });
  }
};
