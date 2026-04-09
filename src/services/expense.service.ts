import { BaseService } from "./base.service";
import Expense, { IExpense } from "../models/Expense";
import { InvoiceService } from "./invoice.service";
import { ExpenseTypeEnum } from "../enums/expenseType.enum";
import { FilterBuilder } from "../utils/filterBuilder";
import { ExpenseQueryParamsDto } from "../dto/expense.dto";
import { uploadToS3, getSignedS3Url } from "../utils/s3Upload";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { runWithTransaction } from "../utils/runWithTransaction";
import { ClientSession } from "mongoose";

interface CreateExpenseData {
  bank: string;
  category: string;
  amount: number;
  description?: string;
  installmentTotal?: number;
  installmentStartNumber?: number;
  installmentStartDate?: string;
  receipt?: string;
}

interface FileData {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  userEmail?: string;
}

export class ExpenseService extends BaseService<IExpense> {
  private invoiceService: InvoiceService;

  constructor() {
    super(Expense);
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

  async getAll(filter: Record<string, unknown>): Promise<IExpense[]> {
    return this.findAll(filter, { date: -1 });
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

    const { installmentTotal, installmentStartDate, installmentStartNumber } =
      data;

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
      async (session) => {
        logger.debug(
          {
            bank: data.bank,
            expenseDate,
            hasSession: Boolean(session),
          },
          "Resolving invoice for single expense",
        );

        const cardInvoice = await this.invoiceService.findForExpenseDate(
          data.bank,
          expenseDate,
          session,
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
            cardInvoiceId: cardInvoice?._id,
          },
          session,
        );

        if (cardInvoice) {
          logger.debug(
            {
              invoiceId: cardInvoice._id,
              amount: createdExpense.amount,
            },
            "Updating invoice balance after expense creation",
          );
          await this.invoiceService.updateBalance(
            cardInvoice._id,
            createdExpense.amount,
            session,
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
      const receiptUrl = await this.uploadReceipt(expense._id, file);
      if (receiptUrl) {
        expense.receipt = receiptUrl;
      }
    }

    logger.info(
      { expenseId: expense._id, amount: expense.amount },
      "Expense created",
    );
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
      async (session) => {
        logger.debug(
          {
            bank: data.bank,
            installmentTotal,
            firstInstallment,
            hasSession: Boolean(session),
          },
          "Building installment expenses",
        );

        const expenses = await this.buildInstallments(
          data,
          installmentTotal,
          startDate,
          firstInstallment,
          session,
        );
        const insertedExpenses = await Expense.insertMany(expenses, {
          session,
        });

        const balancesByInvoice = new Map<string, number>();
        for (const expense of insertedExpenses) {
          if (!expense.cardInvoiceId) {
            continue;
          }

          const invoiceId = expense.cardInvoiceId.toString();
          balancesByInvoice.set(
            invoiceId,
            (balancesByInvoice.get(invoiceId) ?? 0) + expense.amount,
          );
        }

        for (const [invoiceId, amount] of balancesByInvoice) {
          await this.invoiceService.updateBalance(invoiceId, amount, session);
        }

        return insertedExpenses as IExpense[];
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
    session?: ClientSession,
  ): Promise<IExpense[]> {
    const expenses: IExpense[] = [];
    const baseDate = startDate ? new Date(startDate) : new Date();
    const firstInstallment = installmentStartNumber ?? 1;

    for (let i = firstInstallment; i <= installmentTotal; i++) {
      const targetDate = this.calculateInstallmentDate(
        baseDate,
        i - firstInstallment,
      );
      const cardInvoice = await this.invoiceService.ensureInvoiceForDate(
        baseData.bank,
        targetDate,
        session,
      );

      if (cardInvoice?.isClosed) {
        throw new AppError(
          `Cannot add expenses to closed invoice for ${targetDate.toISOString()}. Please reopen the invoice first.`,
          400,
        );
      }

      const expense = new Expense({
        ...(baseData as any),
        type: ExpenseTypeEnum.EXPENSE,
        description: `${baseData.description || baseData.category} (${i}/${installmentTotal})`,
        date: targetDate,
        installment: {
          current: i,
          total: installmentTotal,
        },
        cardInvoiceId: cardInvoice?._id,
      });

      expenses.push(expense);
    }

    return expenses;
  }

  private calculateInstallmentDate(baseDate: Date, monthsToAdd: number): Date {
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();

    const targetMonth = month + monthsToAdd;
    const targetDate = new Date(Date.UTC(year, targetMonth, day));

    // Handle day overflow (e.g., Jan 31 -> Feb 31 = Feb 28/29)
    if (targetDate.getUTCDate() !== day) {
      targetDate.setUTCDate(0); // Set to last day of previous month
    }

    return targetDate;
  }

  async updateExpense(
    id: string,
    updateData: Partial<IExpense>,
  ): Promise<IExpense> {
    return runWithTransaction(
      async (session) => {
        const oldExpense = await this.findById(id, undefined, session);

        if (oldExpense.cardInvoiceId) {
          const invoice = await this.invoiceService.findById(
            oldExpense.cardInvoiceId.toString(),
            undefined,
            session,
          );
          if (invoice?.isClosed) {
            throw new AppError(
              "Cannot update expenses in a closed invoice. Please reopen the invoice first.",
              400,
            );
          }
        }

        const expense = await this.update(id, updateData, session);

        if (
          updateData.amount !== undefined &&
          updateData.amount !== oldExpense.amount &&
          expense.cardInvoiceId
        ) {
          const delta = updateData.amount - oldExpense.amount;
          await this.invoiceService.updateBalance(
            expense.cardInvoiceId,
            delta,
            session,
          );
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
      async (session) => {
        const expense = await this.findById(id, undefined, session);

        if (expense.cardInvoiceId) {
          const invoice = await this.invoiceService.findById(
            expense.cardInvoiceId.toString(),
            undefined,
            session,
          );
          if (invoice?.isClosed) {
            throw new AppError(
              "Cannot delete expenses from a closed invoice. Please reopen the invoice first.",
              400,
            );
          }
        }

        await this.delete(id, session);

        if (expense.cardInvoiceId) {
          await this.invoiceService.updateBalance(
            expense.cardInvoiceId,
            -expense.amount,
            session,
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

  async uploadReceipt(expenseId: any, file: FileData): Promise<string | null> {
    try {
      // Upload to S3 and store the key (not public URL)
      const s3Key = await uploadToS3(
        file.buffer,
        file.filename,
        file.mimetype,
        {
          userEmail: file.userEmail,
        },
      );
      await this.update(expenseId, { receipt: s3Key } as any);
      logger.info({ expenseId }, "Receipt uploaded (private)");
      return s3Key;
    } catch (error) {
      logger.error({ expenseId, error }, "Failed to upload receipt");
      return null;
    }
  }

  /**
   * Generate a temporary signed URL for accessing a receipt
   * @param s3Key - The S3 key stored in the receipt field
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   * @returns Pre-signed URL with temporary access
   */
  async getReceiptUrl(
    s3Key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    return getSignedS3Url(s3Key, expiresIn);
  }

  /**
   * Get expenses with signed receipt URLs
   * @param filter - Query filter
   * @returns Expenses with temporary receipt URLs
   */
  async getAllWithSignedReceipts(
    filter: Record<string, unknown>,
  ): Promise<IExpense[]> {
    const expenses = await this.getAll(filter);

    // Generate signed URLs for receipts
    const expensesWithSignedUrls = await Promise.all(
      expenses.map(async (expense) => {
        if (expense.receipt) {
          try {
            const signedUrl = await this.getReceiptUrl(expense.receipt);
            return { ...expense.toObject(), receipt: signedUrl };
          } catch (error) {
            logger.error(
              { expenseId: expense._id, error },
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
    const expense = await Expense.findByIdAndUpdate(
      id,
      { $unset: { receipt: 1 } },
      { new: true },
    ).orFail();

    logger.info({ expenseId: id }, "Receipt removed");
    return expense;
  }
}
