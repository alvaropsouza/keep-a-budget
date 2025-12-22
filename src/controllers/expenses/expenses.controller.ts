import { FastifyRequest, FastifyReply } from "fastify";
import Expense, { IExpense } from "../../models/Expense";
import { uploadToS3 } from "../../utils/s3Upload";
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryParamsDto,
} from "./dto/expense.dto";
import { validateAndRespond } from "../../utils/validation";

const buildFilterQuery = (
  queryParams: ExpenseQueryParamsDto
): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};

  if (queryParams.bank) {
    filter.bank = queryParams.bank;
  }

  if (queryParams.category) {
    filter.category = queryParams.category;
  }

  if (queryParams.cardInvoiceId) {
    filter.cardInvoiceId = queryParams.cardInvoiceId;
  }

  if (queryParams.minAmount || queryParams.maxAmount) {
    filter.amount = {};
    if (queryParams.minAmount) {
      (filter.amount as Record<string, number>).$gte = parseFloat(
        queryParams.minAmount
      );
    }
    if (queryParams.maxAmount) {
      (filter.amount as Record<string, number>).$lte = parseFloat(
        queryParams.maxAmount
      );
    }
  }

  if (queryParams.createdStartDate || queryParams.createdEndDate) {
    filter.createdAt = {};
    if (queryParams.createdStartDate) {
      (filter.createdAt as Record<string, Date>).$gte = new Date(
        queryParams.createdStartDate
      );
    }
    if (queryParams.createdEndDate) {
      (filter.createdAt as Record<string, Date>).$lte = new Date(
        queryParams.createdEndDate
      );
    }
  }

  if (queryParams.updatedStartDate || queryParams.updatedEndDate) {
    filter.updatedAt = {};
    if (queryParams.updatedStartDate) {
      (filter.updatedAt as Record<string, Date>).$gte = new Date(
        queryParams.updatedStartDate
      );
    }
    if (queryParams.updatedEndDate) {
      (filter.updatedAt as Record<string, Date>).$lte = new Date(
        queryParams.updatedEndDate
      );
    }
  }

  return filter;
};

const createInstallmentExpenses = async (
  baseExpense: CreateExpenseDto,
  installmentTotal: number,
  startDate: string | null = null
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

    const expenseData = {
      ...baseExpense,
      description: `${baseExpense.description} (${i}/${installmentTotal})`,
      date: targetDate,
      installmentNumber: i,
      installmentTotal: installmentTotal,
    };
    expenses.push(new Expense(expenseData));
  }
  return expenses;
};

export const getAllExpenses = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const filter = buildFilterQuery(request.query as ExpenseQueryParamsDto);
    const expenses = await Expense.find(filter).sort({ date: -1 });
    reply.send(expenses);
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message });
  }
};

export const getExpenseById = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const expense = await Expense.findById(
      (request.params as { id: string }).id
    );
    if (!expense) {
      reply.status(404).send({ error: "Expense not found" });
      return;
    }
    reply.send(expense);
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message });
  }
};

export const createExpense = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!(await validateAndRespond(CreateExpenseDto, request.body, reply))) {
    return;
  }

  try {
    const body = request.body as CreateExpenseDto;
    const { installmentTotal, installmentStartDate, ...expenseData } = body;

    if (installmentTotal && installmentTotal > 1) {
      const expenses = await createInstallmentExpenses(
        body,
        installmentTotal,
        installmentStartDate
      );
      const savedExpenses = await Expense.insertMany(expenses);
      reply.status(201).send(savedExpenses);
    } else {
      const expense = new Expense(expenseData);
      await expense.save();
      reply.status(201).send(expense);
    }
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

export const updateExpense = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (!(await validateAndRespond(UpdateExpenseDto, request.body, reply))) {
    return;
  }

  try {
    const expense = await Expense.findByIdAndUpdate(
      (request.params as { id: string }).id,
      request.body as UpdateExpenseDto,
      { new: true, runValidators: true }
    );
    if (!expense) {
      reply.status(404).send({ error: "Expense not found" });
      return;
    }
    reply.send(expense);
  } catch (error) {
    reply.status(400).send({ error: (error as Error).message });
  }
};

export const deleteExpense = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const expense = await Expense.findByIdAndDelete(
      (request.params as { id: string }).id
    );
    if (!expense) {
      reply.status(404).send({ error: "Expense not found" });
      return;
    }
    reply.send({ message: "Expense deleted successfully" });
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message });
  }
};

export const uploadReceipt = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    const data = await request.file();
    if (!data) {
      reply.status(400).send({ error: "No file uploaded" });
      return;
    }

    const buffer = await data.toBuffer();
    const fileUrl = await uploadToS3(buffer, data.filename, data.mimetype);

    const expense = await Expense.findByIdAndUpdate(
      (request.params as { id: string }).id,
      { receiptUrl: fileUrl },
      { new: true }
    );

    if (!expense) {
      reply.status(404).send({ error: "Expense not found" });
      return;
    }

    reply.send(expense);
  } catch (error) {
    reply.status(500).send({ error: (error as Error).message });
  }
};
