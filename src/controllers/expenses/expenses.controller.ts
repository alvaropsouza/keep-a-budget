import { FastifyRequest, FastifyReply } from "fastify";
import Expense, { IExpense } from "../../models/Expense";
import CardInvoice from "../../models/CardInvoice";
import { uploadToS3 } from "../../utils/s3Upload";
import logger from "../../config/logger";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryParamsDto,
} from "./dto/expense.dto";
import { validateAndRespond } from "../../utils/validation";

const createRangeFilter = (
  min?: number | string,
  max?: number | string
): Record<string, number> | object => {
  const range: Record<string, number> = {};
  if (min !== undefined)
    range.$gte = typeof min === "string" ? Number.parseFloat(min) : min;
  if (max !== undefined)
    range.$lte = typeof max === "string" ? Number.parseFloat(max) : max;
  return Object.keys(range).length ? range : {};
};

const createDateRangeFilter = (
  startDate?: string,
  endDate?: string
): Record<string, Date> | null => {
  const range: Record<string, Date> = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate) range.$lte = new Date(endDate);
  return Object.keys(range).length ? range : null;
};

const buildFilterQuery = (
  queryParams: ExpenseQueryParamsDto
): Record<string, unknown> => {
  const createdAtFilter = createDateRangeFilter(
    queryParams.createdStartDate,
    queryParams.createdEndDate
  );
  const updatedAtFilter = createDateRangeFilter(
    queryParams.updatedStartDate,
    queryParams.updatedEndDate
  );
  const amountFilter = createRangeFilter(
    queryParams.minAmount,
    queryParams.maxAmount
  );

  return {
    ...(queryParams.bank && { bank: queryParams.bank }),
    ...(queryParams.category && { category: queryParams.category }),
    ...(queryParams.cardInvoiceId && {
      cardInvoiceId: queryParams.cardInvoiceId,
    }),
    ...(Object.keys(amountFilter).length > 0 && { amount: amountFilter }),
    ...(createdAtFilter && { createdAt: createdAtFilter }),
    ...(updatedAtFilter && { updatedAt: updatedAtFilter }),
  };
};

const createInstallmentExpenses = async (
  baseExpense: CreateExpenseDto,
  installmentTotal: number,
  startDate?: string
): Promise<IExpense[]> => {
  const expenses: IExpense[] = [];
  const baseDate = startDate ? new Date(startDate) : new Date();

  for (let i = 1; i <= installmentTotal; i++) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const day = baseDate.getDate();

    const targetMonth = month + (i - 1);
    const targetDate = new Date(year, targetMonth, day);

    if (targetDate.getDate() !== day) {
      targetDate.setDate(0);
    }

    const cardInvoice = await CardInvoice.findOne({
      bank: baseExpense.bank,
      openDate: { $lte: targetDate },
      closingDate: { $gte: targetDate },
    });

    const expenseData = {
      ...baseExpense,
      description: `${baseExpense.description} (${i}/${installmentTotal})`,
      date: targetDate,
      installmentNumber: i,
      installmentTotal: installmentTotal,
      cardInvoiceId: cardInvoice?._id,
    };
    expenses.push(new Expense(expenseData));
  }
  return expenses;
};

export const getAllExpenses = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  logger.debug({ query: request.query }, "Fetching all expenses");
  const filter = buildFilterQuery(request.query as ExpenseQueryParamsDto);
  const expenses = await Expense.find(filter).sort({ date: -1 });
  logger.info({ count: expenses.length }, "Successfully fetched expenses");
  reply.send(expenses);
};

export const getExpenseById = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const expenseId = (request.params as { id: string }).id;
  logger.debug({ expenseId }, "Fetching expense by ID");
  const expense = await Expense.findById(expenseId).orFail();
  logger.info({ expenseId }, "Successfully fetched expense");
  reply.send(expense);
};

export const createExpense = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!(await validateAndRespond(CreateExpenseDto, request.body, reply))) {
    return;
  }

  logger.debug({ body: request.body }, "Creating new expense");
  const body = request.body as CreateExpenseDto;
  const { installmentTotal, installmentStartDate, ...expenseData } = body;

  if (installmentTotal && installmentTotal > 1) {
    logger.info(
      { installmentTotal, bank: body.bank },
      "Creating installment expenses"
    );
    const expenses = await createInstallmentExpenses(
      body,
      installmentTotal,
      installmentStartDate
    );
    const savedExpenses = await Expense.insertMany(expenses);

    // Update invoice amounts for installments
    for (const expense of savedExpenses) {
      if (expense.cardInvoiceId) {
        await CardInvoice.findByIdAndUpdate(expense.cardInvoiceId, {
          $inc: { amount: expense.amount },
        });
      }
    }

    logger.info(
      { count: savedExpenses.length, installmentTotal },
      "Successfully created installment expenses"
    );
    reply.status(201).send(savedExpenses);
  } else {
    const expenseDate = installmentStartDate
      ? new Date(installmentStartDate)
      : new Date();
    const cardInvoice = await CardInvoice.findOne({
      bank: body.bank,
      openDate: { $lte: expenseDate },
      closingDate: { $gte: expenseDate },
    });

    const expense = new Expense({
      ...expenseData,
      date: expenseDate,
      cardInvoiceId: cardInvoice?._id,
    });
    await expense.save();

    if (cardInvoice) {
      await CardInvoice.findByIdAndUpdate(cardInvoice._id, {
        $inc: { amount: expense.amount },
      });
      logger.debug(
        {
          expenseId: expense._id,
          invoiceId: cardInvoice._id,
          amount: expense.amount,
        },
        "Updated invoice amount"
      );
    }

    logger.info(
      { expenseId: expense._id, amount: expense.amount },
      "Successfully created expense"
    );
    reply.status(201).send(expense);
  }
};

export const updateExpense = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!(await validateAndRespond(UpdateExpenseDto, request.body, reply))) {
    return;
  }

  const expenseId = (request.params as { id: string }).id;
  logger.debug({ expenseId, body: request.body }, "Updating expense");
  const oldExpense = await Expense.findById(expenseId).orFail();
  const updateData = request.body as UpdateExpenseDto;

  const expense = await Expense.findByIdAndUpdate(expenseId, updateData, {
    new: true,
    runValidators: true,
  }).orFail();

  // If amount changed, sync the invoice total
  if (
    updateData.amount !== undefined &&
    updateData.amount !== oldExpense.amount
  ) {
    const amountDelta = updateData.amount - oldExpense.amount;
    if (expense.cardInvoiceId) {
      await CardInvoice.findByIdAndUpdate(expense.cardInvoiceId, {
        $inc: { amount: amountDelta },
      });
      logger.debug(
        { expenseId, invoiceId: expense.cardInvoiceId, delta: amountDelta },
        "Synced invoice amount due to expense amount change"
      );
    }
  }

  logger.info({ expenseId }, "Successfully updated expense");
  reply.send(expense);
};

export const deleteExpense = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const expenseId = (request.params as { id: string }).id;
  logger.debug({ expenseId }, "Deleting expense");
  const expense = await Expense.findByIdAndDelete(expenseId).orFail();

  if (expense.cardInvoiceId) {
    await CardInvoice.findByIdAndUpdate(expense.cardInvoiceId, {
      $inc: { amount: -expense.amount },
    });
    logger.debug(
      { expenseId, invoiceId: expense.cardInvoiceId, amount: expense.amount },
      "Decremented invoice amount"
    );
  }

  logger.info({ expenseId }, "Successfully deleted expense");
  reply.send({ message: "Expense deleted successfully" });
};

export const uploadReceipt = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const expenseId = (request.params as { id: string }).id;
  logger.debug({ expenseId }, "Uploading receipt file");
  const data = await request.file();
  if (!data) {
    reply.status(400).send({ error: "No file uploaded" });
    return;
  }

  logger.debug(
    { expenseId, filename: data.filename, mimetype: data.mimetype },
    "Processing receipt upload"
  );
  const buffer = await data.toBuffer();
  const fileUrl = await uploadToS3(buffer, data.filename, data.mimetype);

  const expense = await Expense.findByIdAndUpdate(
    expenseId,
    { receipt: fileUrl },
    { new: true }
  ).orFail();

  logger.info(
    { expenseId, filename: data.filename, receiptUrl: fileUrl },
    "Successfully uploaded receipt"
  );
  reply.send(expense);
};
