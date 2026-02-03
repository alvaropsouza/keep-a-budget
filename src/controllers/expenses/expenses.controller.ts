import { FastifyRequest, FastifyReply } from "fastify";
import Expense, { IExpense } from "../../models/Expense";
import CardInvoice from "../../models/CardInvoice";
import { uploadToS3 } from "../../utils/s3Upload";
import logger from "../../config/logger";
import { ExpenseTypeEnum } from "../../enums/expenseType.enum";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryParamsDto,
} from "./dto/expense.dto";
import { validateAndRespond } from "../../utils/validation";

const createRangeFilter = (
  min?: number | string,
  max?: number | string,
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
  endDate?: string,
): Record<string, Date> | null => {
  const range: Record<string, Date> = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate) range.$lte = new Date(endDate);
  return Object.keys(range).length ? range : null;
};

const parseExpenseRequest = async (
  request: FastifyRequest,
): Promise<{
  body: CreateExpenseDto;
  fileBuffer: Buffer | null;
  filename: string | null;
  mimetype: string | null;
}> => {
  const contentType = request.headers["content-type"];
  let body: CreateExpenseDto;
  let fileBuffer: Buffer | null = null;
  let filename: string | null = null;
  let mimetype: string | null = null;

  if (contentType?.includes("multipart/form-data")) {
    logger.debug("Parsing multipart form data");
    const parts = request.parts();
    const formFields: Record<string, string> = {};

    for await (const part of parts) {
      if (part.type === "field") {
        formFields[part.fieldname] = part.value as string;
      } else if (part.type === "file") {
        fileBuffer = await part.toBuffer();
        filename = part.filename;
        mimetype = part.mimetype;
        logger.debug(
          { filename, mimetype, size: fileBuffer.length },
          "File received",
        );
      }
    }

    body = {
      bank: formFields.bank as any,
      category: formFields.category,
      amount: Number.parseFloat(formFields.amount),
      description: formFields.description,
      installmentTotal: formFields.installmentTotal
        ? Number.parseInt(formFields.installmentTotal)
        : undefined,
      installmentStartDate: formFields.installmentStartDate,
      receipt: formFields.receipt,
    };
  } else {
    body = request.body as CreateExpenseDto;
  }

  return { body, fileBuffer, filename, mimetype };
};

const uploadReceiptIfProvided = async (
  expenseId: any,
  fileBuffer: Buffer | null,
  filename: string | null,
  mimetype: string | null,
): Promise<string | null> => {
  if (!fileBuffer || !filename || !mimetype) {
    return null;
  }

  try {
    const fileUrl = await uploadToS3(fileBuffer, filename, mimetype);
    await Expense.findByIdAndUpdate(expenseId, { receipt: fileUrl });
    logger.debug(
      { expenseId, receiptUrl: fileUrl },
      "Attached receipt to expense",
    );
    return fileUrl;
  } catch (error) {
    logger.error({ expenseId, error }, "Failed to upload receipt file");
    return null;
  }
};

const buildFilterQuery = (
  queryParams: ExpenseQueryParamsDto,
): Record<string, unknown> => {
  const createdAtFilter = createDateRangeFilter(
    queryParams.createdStartDate,
    queryParams.createdEndDate,
  );
  const updatedAtFilter = createDateRangeFilter(
    queryParams.updatedStartDate,
    queryParams.updatedEndDate,
  );
  const amountFilter = createRangeFilter(
    queryParams.minAmount,
    queryParams.maxAmount,
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

const createSingleExpense = async (
  body: CreateExpenseDto,
  fileBuffer: Buffer | null,
  filename: string | null,
  mimetype: string | null,
): Promise<IExpense> => {
  const { installmentStartDate, ...expenseData } = body;
  const expenseDate = installmentStartDate
    ? new Date(installmentStartDate)
    : new Date();

  const queryDate = new Date(
    Date.UTC(
      expenseDate.getUTCFullYear(),
      expenseDate.getUTCMonth(),
      expenseDate.getUTCDate(),
    ),
  );

  const cardInvoice = await CardInvoice.findOne({
    bank: body.bank,
    openDate: { $lte: queryDate },
    closingDate: { $gte: queryDate },
  });

  const expense = new Expense({
    ...expenseData,
    type: ExpenseTypeEnum.EXPENSE,
    date: expenseDate,
    cardInvoiceId: cardInvoice?._id,
  });
  await expense.save();

  if (cardInvoice) {
    await CardInvoice.findByIdAndUpdate(cardInvoice._id, {
      $inc: { balance: expense.amount },
    });
    logger.debug(
      {
        expenseId: expense._id,
        invoiceId: cardInvoice._id,
        amount: expense.amount,
      },
      "Updated invoice balance",
    );
  }

  // Upload file if provided
  if (fileBuffer && filename && mimetype) {
    const receiptUrl = await uploadReceiptIfProvided(
      expense._id,
      fileBuffer,
      filename,
      mimetype,
    );
    if (receiptUrl) {
      expense.receipt = receiptUrl;
    }
  }

  return expense;
};

const createInstallmentsExpense = async (
  body: CreateExpenseDto,
  installmentTotal: number,
  installmentStartDate?: string,
) => {
  const expenses = await createInstallmentExpenses(
    body,
    installmentTotal,
    installmentStartDate,
  );
  const savedExpenses = await Expense.insertMany(expenses);

  // Update invoice amounts for installments
  for (const expense of savedExpenses) {
    if (expense.cardInvoiceId) {
      await CardInvoice.findByIdAndUpdate(expense.cardInvoiceId, {
        $inc: { balance: expense.amount },
      });
    }
  }

  return savedExpenses;
};

const createInstallmentExpenses = async (
  baseExpense: CreateExpenseDto,
  installmentTotal: number,
  startDate?: string,
): Promise<IExpense[]> => {
  const expenses: IExpense[] = [];
  const baseDate = startDate ? new Date(startDate) : new Date();

  for (let i = 1; i <= installmentTotal; i++) {
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();

    const targetMonth = month + (i - 1);
    const targetDate = new Date(Date.UTC(year, targetMonth, day));

    if (targetDate.getUTCDate() !== day) {
      targetDate.setUTCDate(0);
    }

    const cardInvoice = await CardInvoice.findOne({
      bank: baseExpense.bank,
      openDate: { $lte: targetDate },
      closingDate: { $gte: targetDate },
    });

    const expenseData = {
      ...baseExpense,
      type: ExpenseTypeEnum.EXPENSE,
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
  reply: FastifyReply,
): Promise<void> => {
  logger.debug({ query: request.query }, "Fetching all expenses");
  const filter = buildFilterQuery(request.query as ExpenseQueryParamsDto);
  const expenses = await Expense.find(filter).sort({ date: -1 });
  logger.info({ count: expenses.length }, "Successfully fetched expenses");
  reply.send(expenses);
};

export const getExpenseById = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const expenseId = (request.params as { id: string }).id;
  logger.debug({ expenseId }, "Fetching expense by ID");
  const expense = await Expense.findById(expenseId).orFail();
  logger.info({ expenseId }, "Successfully fetched expense");
  reply.send(expense);
};

export const createExpense = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  logger.debug("Processing expense creation request");

  const { body, fileBuffer, filename, mimetype } =
    await parseExpenseRequest(request);

  if (!(await validateAndRespond(CreateExpenseDto, body, reply))) {
    return;
  }

  logger.debug({ body }, "Creating new expense");
  const { installmentTotal, installmentStartDate } = body;

  if (installmentTotal && installmentTotal > 1) {
    logger.info(
      { installmentTotal, bank: body.bank },
      "Creating installment expenses",
    );
    const savedExpenses = await createInstallmentsExpense(
      body,
      installmentTotal,
      installmentStartDate,
    );
    logger.info(
      { count: savedExpenses.length, installmentTotal },
      "Successfully created installment expenses",
    );
    reply.status(201).send(savedExpenses);
  } else {
    const expense = await createSingleExpense(
      body,
      fileBuffer,
      filename,
      mimetype,
    );
    logger.info(
      {
        expenseId: expense._id,
        amount: expense.amount,
        hasReceipt: !!fileBuffer,
      },
      "Successfully created expense",
    );
    reply.status(201).send(expense);
  }
};

export const updateExpense = async (
  request: FastifyRequest,
  reply: FastifyReply,
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
        $inc: { balance: amountDelta },
      });
      logger.debug(
        { expenseId, invoiceId: expense.cardInvoiceId, delta: amountDelta },
        "Synced invoice balance due to expense amount change",
      );
    }
  }

  logger.info({ expenseId }, "Successfully updated expense");
  reply.send(expense);
};

export const deleteExpense = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const expenseId = (request.params as { id: string }).id;
  logger.debug({ expenseId }, "Deleting expense");
  const expense = await Expense.findByIdAndDelete(expenseId).orFail();

  if (expense.cardInvoiceId) {
    await CardInvoice.findByIdAndUpdate(expense.cardInvoiceId, {
      $inc: { balance: -expense.amount },
    });
    logger.debug(
      { expenseId, invoiceId: expense.cardInvoiceId, amount: expense.amount },
      "Decremented invoice balance",
    );
  }

  logger.info({ expenseId }, "Successfully deleted expense");
  reply.send({ message: "Expense deleted successfully" });
};

export const uploadReceipt = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const expenseId = (request.params as { id: string }).id;
  logger.info({ expenseId }, "Starting receipt upload for expense");

  const data = await request.file();
  if (!data) {
    logger.error({ expenseId }, "No file uploaded");
    reply.status(400).send({ error: "No file uploaded" });
    return;
  }

  logger.debug(
    { expenseId, filename: data.filename, mimetype: data.mimetype },
    "Processing receipt upload",
  );

  try {
    const buffer = await data.toBuffer();
    logger.debug(
      { expenseId, filename: data.filename, fileSize: buffer.length },
      "File buffer created successfully",
    );

    const fileUrl = await uploadToS3(buffer, data.filename, data.mimetype);
    logger.info(
      { expenseId, filename: data.filename, receiptUrl: fileUrl },
      "File uploaded to S3 successfully",
    );

    const expense = await Expense.findByIdAndUpdate(
      expenseId,
      { receipt: fileUrl },
      { new: true },
    ).orFail();

    logger.info(
      { expenseId, filename: data.filename, receiptUrl: fileUrl },
      "Successfully uploaded and attached receipt to expense",
    );
    reply.send(expense);
  } catch (error) {
    logger.error(
      { expenseId, filename: data?.filename, error },
      "Failed to upload receipt",
    );
    reply.status(500).send({ error: "Failed to upload receipt file" });
  }
};

export const deleteReceipt = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const { id } = request.params as { id: string };
  logger.info({ expenseId: id }, "Removing receipt from expense");

  const expense = await Expense.findByIdAndUpdate(
    id,
    { $unset: { receipt: 1 } },
    { new: true },
  );

  if (!expense) {
    reply.status(404).send({ message: "Expense not found" });
    return;
  }

  reply.send({ message: "Receipt removed successfully" });
};
