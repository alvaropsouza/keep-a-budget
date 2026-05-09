import { Prisma } from "../generated/prisma/client/client";
import { IExpense } from "../models/Expense";
import { InvoiceService } from "./invoice.service";
import { ExpenseTypeEnum } from "../enums/expenseType.enum";
import { FilterBuilder } from "../utils/filterBuilder";
import { ExpenseQueryParamsDto } from "../dto/expense.dto";
import { uploadToS3, getSignedS3Url } from "../utils/s3Upload";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { runWithTransaction } from "../utils/runWithTransaction";
import { prisma } from "../lib/prisma";

interface CreateExpenseData {
  bank: string;
  category: string;
  amount: number;
  description?: string;
  installmentTotal?: number;
  installmentStartNumber?: number;
  installmentStartDate?: string;
  receipt?: string;
  userId?: string;
}

interface FileData {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  userEmail?: string;
}

const toNumber = (value: Prisma.Decimal | number | null | undefined): number =>
  value == null ? 0 : Number(value);

const mapExpense = (row: any): IExpense => ({
  id: row.id,
  _id: row.id,
  bank: row.bank,
  type: row.type,
  category: row.category,
  date: new Date(row.date),
  amount: toNumber(row.amount),
  description: row.description ?? "",
  receipt: row.receipt ?? undefined,
  installment:
    row.installmentCurrent || row.installmentTotal
      ? {
          current: row.installmentCurrent ?? undefined,
          total: row.installmentTotal ?? undefined,
        }
      : undefined,
  cardInvoiceId: row.cardInvoiceId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const notFound = (): never => {
  const error = new AppError("Resource not found", 404);
  (error as Error).name = "DocumentNotFoundError";
  throw error;
};

export class ExpenseService {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  buildFilter(queryParams: ExpenseQueryParamsDto): Record<string, unknown> {
    return new FilterBuilder()
      .addEquals("bank", queryParams.bank)
      .addEquals("category", queryParams.category)
      .addEquals("cardInvoiceId", queryParams.cardInvoiceId)
      .addNumberRange("amount", queryParams.minAmount, queryParams.maxAmount)
      .addDateRange(
        "createdAt",
        queryParams.createdStartDate,
        queryParams.createdEndDate,
      )
      .addDateRange(
        "updatedAt",
        queryParams.updatedStartDate,
        queryParams.updatedEndDate,
      )
      .build();
  }

  async findById(id: string, tx?: Prisma.TransactionClient): Promise<IExpense> {
    const db = tx ?? prisma;
    const row = await db.expense.findUnique({ where: { id } });
    if (!row) {
      notFound();
    }
    return mapExpense(row);
  }

  private async create(
    data: Partial<IExpense> & { userId?: string },
    tx?: Prisma.TransactionClient,
  ): Promise<IExpense> {
    const db = tx ?? prisma;
    const row = await db.expense.create({
      data: {
        bank: data.bank!,
        type: data.type!,
        category: data.category!,
        date: data.date!,
        amount: data.amount!,
        description: data.description ?? "",
        receipt: data.receipt ?? null,
        installmentCurrent: data.installment?.current ?? null,
        installmentTotal: data.installment?.total ?? null,
        cardInvoiceId: data.cardInvoiceId ?? null,
        ...(data.userId ? { userId: data.userId } : {}),
      },
    });

    return mapExpense(row);
  }

  async update(
    id: string,
    data: Partial<IExpense>,
    tx?: Prisma.TransactionClient,
  ): Promise<IExpense> {
    const db = tx ?? prisma;
    const row = await db.expense
      .update({
        where: { id },
        data: {
          ...(data.bank !== undefined ? { bank: data.bank } : {}),
          ...(data.type !== undefined ? { type: data.type } : {}),
          ...(data.category !== undefined ? { category: data.category } : {}),
          ...(data.date !== undefined ? { date: data.date } : {}),
          ...(data.amount !== undefined ? { amount: data.amount } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.receipt !== undefined ? { receipt: data.receipt } : {}),
          ...(data.cardInvoiceId !== undefined
            ? { cardInvoiceId: data.cardInvoiceId }
            : {}),
        },
      })
      .catch(() => null);

    if (!row) {
      notFound();
    }

    return mapExpense(row);
  }

  async delete(id: string, tx?: Prisma.TransactionClient): Promise<IExpense> {
    const db = tx ?? prisma;
    const row = await db.expense.delete({ where: { id } }).catch(() => null);
    if (!row) {
      notFound();
    }
    return mapExpense(row);
  }

  async getAll(filter: Record<string, unknown>, userId?: string): Promise<IExpense[]> {
    const amountRange = filter.amount as { $gte?: number; $lte?: number } | undefined;
    const createdRange = filter.createdAt as { $gte?: Date; $lte?: Date } | undefined;
    const updatedRange = filter.updatedAt as { $gte?: Date; $lte?: Date } | undefined;

    const rows = await prisma.expense.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(filter.bank !== undefined ? { bank: String(filter.bank) } : {}),
        ...(filter.category !== undefined ? { category: String(filter.category) } : {}),
        ...(filter.cardInvoiceId !== undefined
          ? { cardInvoiceId: String(filter.cardInvoiceId) }
          : {}),
        ...(amountRange
          ? {
              amount: {
                gte: amountRange.$gte,
                lte: amountRange.$lte,
              },
            }
          : {}),
        ...(createdRange
          ? {
              createdAt: {
                gte: createdRange.$gte,
                lte: createdRange.$lte,
              },
            }
          : {}),
        ...(updatedRange
          ? {
              updatedAt: {
                gte: updatedRange.$gte,
                lte: updatedRange.$lte,
              },
            }
          : {}),
      },
      orderBy: { date: "desc" },
    });

    return rows.map(mapExpense);
  }

  async createExpense(
    data: CreateExpenseData,
    file?: FileData,
  ): Promise<IExpense | IExpense[]> {
    logger.info(
      {
        bank: data.bank,
        category: data.category,
        amount: data.amount,
        installmentTotal: data.installmentTotal,
        installmentStartNumber: data.installmentStartNumber,
        hasReceiptFile: Boolean(file),
      },
      "Starting expense creation",
    );

    const { installmentTotal, installmentStartDate, installmentStartNumber } = data;

    if (
      installmentStartNumber &&
      (!installmentTotal || installmentStartNumber > installmentTotal)
    ) {
      throw new AppError(
        "installmentStartNumber must be less than or equal to installmentTotal",
        400,
      );
    }

    if (installmentTotal && installmentTotal > 1) {
      return this.createInstallments(
        data,
        installmentTotal,
        installmentStartDate,
        installmentStartNumber,
      );
    }

    return this.createSingle(data, file);
  }

  private async createSingle(
    data: CreateExpenseData,
    file?: FileData,
  ): Promise<IExpense> {
    const expenseDate = data.installmentStartDate
      ? new Date(data.installmentStartDate)
      : new Date();

    const expense = await runWithTransaction(
      async (tx) => {
        logger.debug(
          {
            bank: data.bank,
            expenseDate,
            hasSession: Boolean(tx),
          },
          "Resolving invoice for single expense",
        );

        const cardInvoice = await this.invoiceService.findForExpenseDate(
          data.bank,
          expenseDate,
          data.userId,
          tx,
        );

        if (cardInvoice?.isClosed) {
          throw new AppError(
            "Cannot add expenses to a closed invoice. Please reopen the invoice first.",
            400,
          );
        }

        const createdExpense = await this.create(
          {
            ...(data as any),
            type: ExpenseTypeEnum.EXPENSE,
            date: expenseDate,
            cardInvoiceId: cardInvoice?.id ?? null,
            userId: data.userId,
          },
          tx,
        );

        if (cardInvoice) {
          logger.debug(
            {
              invoiceId: cardInvoice.id,
              amount: createdExpense.amount,
            },
            "Updating invoice balance after expense creation",
          );
          await this.invoiceService.updateBalance(
            cardInvoice.id,
            createdExpense.amount,
            tx,
          );
        }

        return createdExpense;
      },
      {
        operationName: "expense.createSingle",
        metadata: {
          bank: data.bank,
          category: data.category,
          amount: data.amount,
        },
      },
    );

    if (file) {
      const receiptUrl = await this.uploadReceipt(expense.id, file);
      if (receiptUrl) {
        expense.receipt = receiptUrl;
      }
    }

    logger.info({ expenseId: expense.id, amount: expense.amount }, "Expense created");
    return expense;
  }

  private async createInstallments(
    data: CreateExpenseData,
    installmentTotal: number,
    startDate?: string,
    installmentStartNumber: number = 1,
  ): Promise<IExpense[]> {
    const firstInstallment = installmentStartNumber ?? 1;

    if (firstInstallment > installmentTotal) {
      throw new AppError(
        "installmentStartNumber cannot be greater than installmentTotal",
        400,
      );
    }

    const savedExpenses = await runWithTransaction(
      async (tx) => {
        logger.debug(
          {
            bank: data.bank,
            installmentTotal,
            firstInstallment,
            hasSession: Boolean(tx),
          },
          "Building installment expenses",
        );

        const expenses = await this.buildInstallments(
          data,
          installmentTotal,
          startDate,
          firstInstallment,
          tx,
        );

        const insertedExpenses: IExpense[] = [];
        const balancesByInvoice = new Map<string, number>();

        for (const expense of expenses) {
          const inserted = await this.create(expense, tx);
          insertedExpenses.push(inserted);

          if (!inserted.cardInvoiceId) {
            continue;
          }

          const invoiceId = inserted.cardInvoiceId.toString();
          balancesByInvoice.set(
            invoiceId,
            (balancesByInvoice.get(invoiceId) ?? 0) + inserted.amount,
          );
        }

        for (const [invoiceId, amount] of balancesByInvoice) {
          await this.invoiceService.updateBalance(invoiceId, amount, tx);
        }

        return insertedExpenses;
      },
      {
        operationName: "expense.createInstallments",
        metadata: {
          bank: data.bank,
          category: data.category,
          installmentTotal,
        },
      },
    );

    logger.info(
      { count: savedExpenses.length, installmentTotal },
      "Installment expenses created",
    );
    return savedExpenses;
  }

  private async buildInstallments(
    baseData: CreateExpenseData,
    installmentTotal: number,
    startDate?: string,
    installmentStartNumber: number = 1,
    tx?: Prisma.TransactionClient,
  ): Promise<Partial<IExpense>[]> {
    const expenses: Partial<IExpense>[] = [];
    const baseDate = startDate ? new Date(startDate) : new Date();
    const firstInstallment = installmentStartNumber ?? 1;

    for (let i = firstInstallment; i <= installmentTotal; i++) {
      const targetDate = this.calculateInstallmentDate(baseDate, i - firstInstallment);
      const cardInvoice = await this.invoiceService.ensureInvoiceForDate(
        baseData.bank,
        targetDate,
        baseData.userId,
        tx,
      );

      if (cardInvoice?.isClosed) {
        throw new AppError(
          `Cannot add expenses to closed invoice for ${targetDate.toISOString()}. Please reopen the invoice first.`,
          400,
        );
      }

      expenses.push({
        ...(baseData as any),
        type: ExpenseTypeEnum.EXPENSE,
        description: `${baseData.description || baseData.category} (${i}/${installmentTotal})`,
        date: targetDate,
        installment: {
          current: i,
          total: installmentTotal,
        },
        cardInvoiceId: cardInvoice?.id ?? null,
      });
    }

    return expenses;
  }

  private calculateInstallmentDate(baseDate: Date, monthsToAdd: number): Date {
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();

    const targetMonth = month + monthsToAdd;
    const targetDate = new Date(Date.UTC(year, targetMonth, day));

    if (targetDate.getUTCDate() !== day) {
      targetDate.setUTCDate(0);
    }

    return targetDate;
  }

  async updateExpense(id: string, updateData: Partial<IExpense>): Promise<IExpense> {
    return runWithTransaction(
      async (tx) => {
        const oldExpense = await this.findById(id, tx);

        if (oldExpense.cardInvoiceId) {
          const invoice = await this.invoiceService.findById(
            oldExpense.cardInvoiceId.toString(),
            undefined,
            tx,
          );
          if (invoice?.isClosed) {
            throw new AppError(
              "Cannot update expenses in a closed invoice. Please reopen the invoice first.",
              400,
            );
          }
        }

        const expense = await this.update(id, updateData, tx);

        if (
          updateData.amount !== undefined &&
          updateData.amount !== oldExpense.amount &&
          expense.cardInvoiceId
        ) {
          const delta = updateData.amount - oldExpense.amount;
          await this.invoiceService.updateBalance(expense.cardInvoiceId, delta, tx);
        }

        return expense;
      },
      {
        operationName: "expense.updateExpense",
        metadata: {
          expenseId: id,
          updatedKeys: Object.keys(updateData),
        },
      },
    );
  }

  async deleteExpense(id: string): Promise<void> {
    await runWithTransaction(
      async (tx) => {
        const expense = await this.findById(id, tx);

        if (expense.cardInvoiceId) {
          const invoice = await this.invoiceService.findById(
            expense.cardInvoiceId.toString(),
            undefined,
            tx,
          );
          if (invoice?.isClosed) {
            throw new AppError(
              "Cannot delete expenses from a closed invoice. Please reopen the invoice first.",
              400,
            );
          }
        }

        await this.delete(id, tx);

        if (expense.cardInvoiceId) {
          await this.invoiceService.updateBalance(
            expense.cardInvoiceId,
            -expense.amount,
            tx,
          );
        }
      },
      {
        operationName: "expense.deleteExpense",
        metadata: {
          expenseId: id,
        },
      },
    );

    logger.info({ expenseId: id }, "Expense deleted");
  }

  async uploadReceipt(expenseId: string, file: FileData): Promise<string | null> {
    try {
      const s3Key = await uploadToS3(file.buffer, file.filename, file.mimetype, {
        userEmail: file.userEmail,
      });
      await this.update(expenseId, { receipt: s3Key } as any);
      logger.info({ expenseId }, "Receipt uploaded (private)");
      return s3Key;
    } catch (error) {
      logger.error({ expenseId, error }, "Failed to upload receipt");
      return null;
    }
  }

  async getReceiptUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    return getSignedS3Url(s3Key, expiresIn);
  }

  async getAllWithSignedReceipts(
    filter: Record<string, unknown>,
    userId?: string,
  ): Promise<IExpense[]> {
    const expenses = await this.getAll(filter, userId);

    const expensesWithSignedUrls = await Promise.all(
      expenses.map(async (expense) => {
        if (expense.receipt) {
          try {
            const signedUrl = await this.getReceiptUrl(expense.receipt);
            return { ...expense, receipt: signedUrl };
          } catch (error) {
            logger.error(
              { expenseId: expense.id, error },
              "Failed to generate signed URL for receipt",
            );
            return expense;
          }
        }
        return expense;
      }),
    );

    return expensesWithSignedUrls as IExpense[];
  }

  async deleteReceipt(id: string): Promise<IExpense> {
    const expense = await this.update(id, { receipt: null as any });

    logger.info({ expenseId: id }, "Receipt removed");
    return expense;
  }
}
