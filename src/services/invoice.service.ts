import { BaseService } from "./base.service";
import CardInvoice, { ICardInvoice } from "../models/CardInvoice";
import Expense from "../models/Expense";
import { ExpenseTypeEnum } from "../enums/expenseType.enum";
import { FilterBuilder } from "../utils/filterBuilder";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { InvoiceQueryParamsDto } from "../dto/invoice.dto";
import { BanksEnum } from "../enums/banks.enum";
import { parseInvoiceCsv } from "../utils/xpCsvParser";
import { ClientSession } from "mongoose";
import { runWithTransaction } from "../utils/runWithTransaction";

export class InvoiceService extends BaseService<ICardInvoice> {
  constructor() {
    super(CardInvoice);
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    const target = new Date(Date.UTC(year, month + months, day));
    if (target.getUTCDate() !== day) {
      target.setUTCDate(0);
    }

    return target;
  }

  private async getLatestInvoice(
    bank: string,
    session?: ClientSession,
  ): Promise<ICardInvoice | null> {
    const query = CardInvoice.findOne({ bank }).sort({ closingDate: -1 });
    if (session) {
      query.session(session);
    }
    return query.exec();
  }

  private async safeCreateInvoice(
    bank: string,
    closingDate: Date,
    dueDate: Date,
    session?: ClientSession,
  ): Promise<ICardInvoice> {
    try {
      return await this.createInvoice(
        {
          bank: bank as BanksEnum,
          closingDate,
          dueDate,
          balance: 0,
        },
        session,
      );
    } catch (error) {
      const isConflict =
        (error instanceof AppError && error.statusCode === 409) ||
        (error as { code?: number })?.code === 11000;

      if (isConflict) {
        const query = CardInvoice.findOne({ bank, closingDate });
        if (session) {
          query.session(session);
        }
        const existing = await query.exec();
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  buildFilter(queryParams: InvoiceQueryParamsDto): Record<string, unknown> {
    return new FilterBuilder()
      .addEquals("bank", queryParams.bank)
      .addDate("closingDate", queryParams.closingDate)
      .addDate("dueDate", queryParams.dueDate)
      .addDateRange("closingDate", queryParams.startDate, queryParams.endDate)
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

  async getAllWithExpenses(
    filter: Record<string, unknown>,
  ): Promise<ICardInvoice[]> {
    return CardInvoice.find(filter).sort({ dueDate: -1 }).populate("expenses");
  }

  async getByIdWithExpenses(id: string): Promise<ICardInvoice> {
    return this.findById(id, "expenses");
  }

  async checkDuplicate(
    bank: string,
    closingDate: string,
    session?: ClientSession,
  ): Promise<boolean> {
    return this.exists(
      {
        bank,
        closingDate: new Date(closingDate),
      },
      session,
    );
  }

  async createInvoice(
    data: Partial<ICardInvoice>,
    session?: ClientSession,
  ): Promise<ICardInvoice> {
    if (
      await this.checkDuplicate(
        data.bank!,
        data.closingDate!.toString(),
        session,
      )
    ) {
      throw new AppError(
        "Invoice already exists for this bank and period",
        409,
      );
    }
    return this.create(data, session);
  }

  async deleteWithExpenses(id: string): Promise<void> {
    await runWithTransaction(async (session) => {
      await Expense.deleteMany({ cardInvoiceId: id }, { session });
      await this.delete(id, session);
    });
    logger.info({ invoiceId: id }, "Invoice and associated expenses deleted");
  }

  async advancePayment(id: string, amount: number): Promise<ICardInvoice> {
    await runWithTransaction(async (session) => {
      const invoice = await this.findById(id, undefined, session);

      const currentBalance = invoice.balance ?? 0;
      const advancedAmount = invoice.advance ?? 0;
      const availableBalance = currentBalance - advancedAmount;

      if (amount > availableBalance) {
        throw new AppError(
          "Advance amount cannot exceed available balance",
          400,
          {
            currentBalance,
            advancedAmount,
            availableBalance,
            requestedAmount: amount,
          },
        );
      }

      await CardInvoice.findByIdAndUpdate(
        id,
        { $inc: { advance: amount, balance: -amount } },
        { new: true, runValidators: true, session },
      ).orFail();

      const advanceExpense = new Expense({
        bank: invoice.bank,
        type: ExpenseTypeEnum.ADVANCE,
        category: "Advance",
        amount,
        description: "Advance payment",
        date: new Date(),
        cardInvoiceId: invoice._id,
      });

      await advanceExpense.save({ session });
    });

    logger.info({ invoiceId: id, amount }, "Advance payment processed");
    return this.getByIdWithExpenses(id);
  }

  async updateBalance(
    invoiceId: any,
    delta: number,
    session?: ClientSession,
  ): Promise<void> {
    await CardInvoice.findByIdAndUpdate(
      invoiceId,
      {
        $inc: { balance: delta },
      },
      { session },
    ).orFail();
    logger.debug({ invoiceId, delta }, "Invoice balance updated");
  }

  async findForExpenseDate(
    bank: string,
    date: Date,
    session?: ClientSession,
  ): Promise<ICardInvoice | null> {
    const queryDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const query = CardInvoice.findOne({
      bank,
      closingDate: { $gte: queryDate },
    }).sort({ closingDate: 1 });

    if (session) {
      query.session(session);
    }

    return query.exec();
  }

  async ensureInvoiceForDate(
    bank: string,
    date: Date,
    session?: ClientSession,
  ): Promise<ICardInvoice> {
    const targetDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const existingInvoice = await this.findForExpenseDate(
      bank,
      targetDate,
      session,
    );
    if (existingInvoice) {
      return existingInvoice;
    }

    const latestInvoice = await this.getLatestInvoice(bank, session);
    if (!latestInvoice) {
      throw new AppError(
        `Nenhuma fatura cadastrada para o banco ${bank}. Crie a primeira fatura manualmente para definirmos o ciclo.`,
        400,
      );
    }

    let currentClosingDate = latestInvoice.closingDate;
    let currentDueDate = latestInvoice.dueDate;
    let createdInvoice: ICardInvoice | null = null;

    while (!createdInvoice || createdInvoice.closingDate < targetDate) {
      const nextClosingDate = this.addMonthsClamped(currentClosingDate, 1);
      const nextDueDate = this.addMonthsClamped(currentDueDate, 1);

      createdInvoice = await this.safeCreateInvoice(
        bank,
        nextClosingDate,
        nextDueDate,
        session,
      );

      currentClosingDate = createdInvoice.closingDate;
      currentDueDate = createdInvoice.dueDate;
    }

    return createdInvoice;
  }

  async closeInvoice(
    id: string,
    manualBalance?: number,
  ): Promise<ICardInvoice> {
    const invoice = await this.findById(id);

    if (invoice.isClosed) {
      throw new AppError("Invoice is already closed", 400);
    }

    const updateData: Partial<ICardInvoice> = {
      isClosed: true,
    };

    if (manualBalance) {
      updateData.balance = manualBalance;
    }

    const updatedInvoice = await CardInvoice.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("expenses")
      .orFail();

    logger.info(
      { invoiceId: id, finalBalance: updatedInvoice.balance },
      "Invoice closed",
    );
    return updatedInvoice;
  }

  async checkAndCloseExpiredInvoices(): Promise<{
    closed: number;
    invoices: ICardInvoice[];
  }> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const expiredInvoices = await CardInvoice.find({
      isClosed: false,
      closingDate: { $lt: today },
    });

    const closedInvoices: ICardInvoice[] = [];

    for (const invoice of expiredInvoices) {
      try {
        const closed = await this.closeInvoice(invoice._id.toString());
        closedInvoices.push(closed);
      } catch (error) {
        logger.error(
          { invoiceId: invoice._id, error },
          "Failed to auto-close expired invoice",
        );
      }
    }

    logger.info(
      { total: closedInvoices.length },
      "Auto-closed expired invoices",
    );

    return {
      closed: closedInvoices.length,
      invoices: closedInvoices,
    };
  }

  async reopenInvoice(id: string): Promise<ICardInvoice> {
    const invoice = await this.findById(id);

    if (!invoice.isClosed) {
      throw new AppError("Invoice is not closed", 400);
    }

    const updatedInvoice = await CardInvoice.findByIdAndUpdate(
      id,
      { isClosed: false },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate("expenses")
      .orFail();

    logger.info({ invoiceId: id }, "Invoice reopened");
    return updatedInvoice;
  }

  async createFromCsv(
    bank: BanksEnum,
    closingDate: string,
    dueDate: string,
    csvContent: string,
    excludeIndexes?: number[],
  ): Promise<ICardInvoice> {
    const rows = parseInvoiceCsv(
      bank,
      csvContent,
      excludeIndexes ? new Set(excludeIndexes) : undefined,
    );

    const invoiceId = await runWithTransaction(async (session) => {
      const invoice = await this.createInvoice(
        {
          bank,
          closingDate: new Date(closingDate),
          dueDate: new Date(dueDate),
          balance: 0,
        },
        session,
      );

      if (rows.length === 0) {
        logger.warn({ closingDate }, "CSV create produced no valid expenses");
        return invoice._id.toString();
      }

      const newExpenses = rows.map((row) => ({
        bank,
        type: ExpenseTypeEnum.EXPENSE,
        category: "Importado",
        date: row.date,
        amount: row.amount,
        description: row.description,
        installment: row.installment ?? undefined,
        cardInvoiceId: invoice._id,
      }));

      await Expense.insertMany(newExpenses, { session });

      const newTotal = rows.reduce((sum, r) => sum + r.amount, 0);

      await CardInvoice.findByIdAndUpdate(
        invoice._id,
        { $inc: { balance: newTotal } },
        { new: true, runValidators: true, session },
      ).orFail();

      return invoice._id.toString();
    });

    const updatedInvoice = await this.getByIdWithExpenses(invoiceId);

    logger.info(
      { invoiceId: updatedInvoice._id, imported: rows.length },
      "Invoice created from CSV",
    );

    return updatedInvoice;
  }

  async importFromCsv(
    id: string,
    csvContent: string,
    excludeIndexes?: number[],
  ): Promise<ICardInvoice> {
    const invoice = await this.findById(id);

    if (invoice.isClosed) {
      throw new AppError(
        "Cannot import expenses into a closed invoice. Please reopen the invoice first.",
        400,
      );
    }

    const rows = parseInvoiceCsv(
      invoice.bank,
      csvContent,
      excludeIndexes ? new Set(excludeIndexes) : undefined,
    );

    await runWithTransaction(async (session) => {
      const existingExpenses = await Expense.find(
        {
          cardInvoiceId: id,
          type: ExpenseTypeEnum.EXPENSE,
        },
        null,
        { session },
      );

      const existingExpensesTotal = existingExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );

      await Expense.deleteMany(
        {
          cardInvoiceId: id,
          type: ExpenseTypeEnum.EXPENSE,
        },
        { session },
      );

      await CardInvoice.findByIdAndUpdate(
        id,
        {
          $inc: { balance: -existingExpensesTotal },
        },
        { session },
      ).orFail();

      if (rows.length === 0) {
        logger.warn({ invoiceId: id }, "CSV import produced no valid expenses");
        return id;
      }

      const newExpenses = rows.map((row) => ({
        bank: invoice.bank,
        type: ExpenseTypeEnum.EXPENSE,
        category: "Importado",
        date: row.date,
        amount: row.amount,
        description: row.description,
        installment: row.installment ?? undefined,
        cardInvoiceId: invoice._id,
      }));

      await Expense.insertMany(newExpenses, { session });

      const newTotal = rows.reduce((sum, row) => sum + row.amount, 0);

      await CardInvoice.findByIdAndUpdate(
        id,
        { $inc: { balance: newTotal } },
        { new: true, runValidators: true, session },
      ).orFail();

      return id;
    });

    const updatedInvoice = await this.getByIdWithExpenses(id);

    logger.info(
      { invoiceId: id, imported: rows.length },
      "CSV imported into invoice",
    );

    return updatedInvoice;
  }
}
