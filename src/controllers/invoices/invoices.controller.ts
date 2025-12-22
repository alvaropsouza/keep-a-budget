import { FastifyRequest, FastifyReply } from "fastify";
import CardInvoice from "../../models/CardInvoice";
import Expense from "../../models/Expense";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParamsDto,
} from "./dto/invoice.dto";
import { validateAndRespond } from "../../utils/validation";

const createDateRangeFilter = (
  field: string,
  startDate?: string,
  endDate?: string
) => {
  const range = {
    ...(startDate && { $gte: new Date(startDate) }),
    ...(endDate && { $lte: new Date(endDate) }),
  };
  return Object.keys(range).length ? { [field]: range } : {};
};

const buildFilterQuery = (
  queryParams: InvoiceQueryParamsDto
): Record<string, unknown> => {
  return {
    ...(queryParams.bank && { bank: queryParams.bank }),
    ...(queryParams.openDate && { openDate: new Date(queryParams.openDate) }),
    ...(queryParams.closingDate && {
      closingDate: new Date(queryParams.closingDate),
    }),
    ...(queryParams.dueDate && { dueDate: new Date(queryParams.dueDate) }),
    ...createDateRangeFilter(
      "openDate",
      queryParams.startDate,
      queryParams.endDate
    ),
    ...createDateRangeFilter(
      "createdAt",
      queryParams.createdStartDate,
      queryParams.createdEndDate
    ),
    ...createDateRangeFilter(
      "updatedAt",
      queryParams.updatedStartDate,
      queryParams.updatedEndDate
    ),
  };
};

export const getAllInvoices = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const filter = buildFilterQuery(request.query as InvoiceQueryParamsDto);
  const invoices = await CardInvoice.find(filter)
    .sort({ dueDate: -1 })
    .populate("expenses");
  reply.send(invoices);
};

export const getInvoiceById = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const invoice = await CardInvoice.findById(
    (request.params as { id: string }).id
  )
    .populate("expenses")
    .orFail();
  reply.send(invoice);
};

export const createInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!(await validateAndRespond(CreateInvoiceDto, request.body, reply))) {
    return;
  }

  const invoice = new CardInvoice(request.body as CreateInvoiceDto);
  await invoice.save();
  reply.status(201).send(invoice);
};

// Update invoice
export const updateInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!(await validateAndRespond(UpdateInvoiceDto, request.body, reply))) {
    return;
  }

  const invoice = await CardInvoice.findByIdAndUpdate(
    (request.params as { id: string }).id,
    request.body as UpdateInvoiceDto,
    { new: true, runValidators: true }
  ).orFail();
  reply.send(invoice);
};

export const deleteInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const invoiceId = (request.params as { id: string }).id;
  await CardInvoice.findByIdAndDelete(invoiceId).orFail();

  await Expense.deleteMany({ cardInvoiceId: invoiceId });

  reply.send({
    message: "Invoice and associated expenses deleted successfully",
  });
};
