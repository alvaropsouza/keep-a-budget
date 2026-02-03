import { FastifyRequest, FastifyReply } from "fastify";
import CardInvoice from "../../models/CardInvoice";
import Expense from "../../models/Expense";
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceQueryParamsDto,
  AdvanceInvoiceDto,
} from "./dto/invoice.dto";
import { validateAndRespond } from "../../utils/validation";
import { ExpenseTypeEnum } from "../../enums/expenseType.enum";

type DateRangeFilter = {
  $gte?: Date;
  $lte?: Date;
};

const createDateRangeFilter = (
  field: string,
  startDate?: string,
  endDate?: string,
): Record<string, DateRangeFilter> | Record<string, never> => {
  const range: DateRangeFilter = {};

  if (startDate) range.$gte = new Date(startDate);
  if (endDate) range.$lte = new Date(endDate);

  return Object.keys(range).length > 0 ? { [field]: range } : {};
};

const buildFilterQuery = (
  queryParams: InvoiceQueryParamsDto,
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
      queryParams.endDate,
    ),
    ...createDateRangeFilter(
      "createdAt",
      queryParams.createdStartDate,
      queryParams.createdEndDate,
    ),
    ...createDateRangeFilter(
      "updatedAt",
      queryParams.updatedStartDate,
      queryParams.updatedEndDate,
    ),
  };
};

export const getAllInvoices = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const filter = buildFilterQuery(request.query as InvoiceQueryParamsDto);

  const invoices = await CardInvoice.find(filter)
    .sort({ dueDate: -1 })
    .populate("expenses");

  reply.send(invoices);
};

export const getInvoiceById = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const { id } = request.params as { id: string };

  const invoice = await CardInvoice.findById(id).populate("expenses").orFail();

  reply.send(invoice);
};

export const createInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (!(await validateAndRespond(CreateInvoiceDto, request.body, reply))) {
    return;
  }

  const body = request.body as CreateInvoiceDto;

  // Check if invoice already exists for this bank and period
  const existingInvoice = await CardInvoice.findOne({
    bank: body.bank,
    openDate: new Date(body.openDate),
    closingDate: new Date(body.closingDate),
  });

  if (existingInvoice) {
    reply.status(409).send({
      error: "Invoice already exists for this bank and period",
    });
    return;
  }

  const invoice = new CardInvoice(body);
  await invoice.save();

  reply.status(201).send(invoice);
};

export const updateInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (!(await validateAndRespond(UpdateInvoiceDto, request.body, reply))) {
    return;
  }

  const { id } = request.params as { id: string };
  const updateData = request.body as UpdateInvoiceDto;

  const invoice = await CardInvoice.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  }).orFail();

  reply.send(invoice);
};

export const deleteInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const { id } = request.params as { id: string };

  await CardInvoice.findByIdAndDelete(id).orFail();
  await Expense.deleteMany({ cardInvoiceId: id });

  reply.send({
    message: "Invoice and associated expenses deleted successfully",
  });
};

export const advanceInvoice = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  if (!(await validateAndRespond(AdvanceInvoiceDto, request.body, reply))) {
    return;
  }

  const { amount } = request.body as AdvanceInvoiceDto;
  const { id } = request.params as { id: string };

  const invoice = await CardInvoice.findById(id).populate("expenses").orFail();

  const currentBalance = invoice.balance ?? 0;
  const advancedAmount = invoice.advance ?? 0;
  const availableBalance = currentBalance - advancedAmount;

  if (amount > availableBalance) {
    reply.status(400).send({
      error: "Advance amount cannot exceed available balance",
      details: {
        currentBalance,
        advancedAmount,
        availableBalance,
        requestedAmount: amount,
      },
    });
    return;
  }

  const updatedInvoice = await CardInvoice.findByIdAndUpdate(
    id,
    { $inc: { advance: amount } },
    { new: true, runValidators: true },
  )
    .populate("expenses")
    .orFail();

  await Expense.create({
    bank: invoice.bank,
    type: ExpenseTypeEnum.ADVANCE,
    category: "Advance",
    amount,
    description: "Advance payment",
    date: new Date(),
    cardInvoiceId: invoice._id,
  });

  reply.send(updatedInvoice);
};
