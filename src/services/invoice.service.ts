import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { ICardInvoice } from "../models/CardInvoice";
import { IExpense } from "../models/Expense";
import { ExpenseTypeEnum } from "../enums/expenseType.enum";
import { FilterBuilder } from "../utils/filterBuilder";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { InvoiceQueryParamsDto } from "../dto/invoice.dto";
import { BanksEnum } from "../enums/banks.enum";
import { parseInvoiceCsv } from "../utils/invoiceCsvParser";
import { runWithTransaction } from "../utils/runWithTransaction";
import { prisma } from "../lib/prisma";
import { getBrazilTodayUtcMidnight } from "../utils/timezone";

const toNumber = (value: Prisma.Decimal | number | null | undefined): number =>
  value == null ? 0 : Number(value);

const mapExpense = (row: any): IExpense => ({
  id: row.id,
  _id: row.id,
  userId: row.userId ?? undefined,
  bank: row.bank,
  type: row.type,
  category: row.category,
  date: new Date(row.date),
  amount: toNumber(row.amount),
  description: row.description ?? "",
  receipt: row.receipt ?? undefined,
  irDeductible: row.irDeductible ?? false,
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

const mapInvoice = (row: any, expenses?: IExpense[]): ICardInvoice => ({
  id: row.id,
  _id: row.id,
  userId: row.userId ?? undefined,
  bank: row.bank,
  closingDate: new Date(row.closingDate),
  dueDate: new Date(row.dueDate),
  balance: toNumber(row.balance),
  advance: toNumber(row.advance),
  isClosed: row.isClosed,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  expenses,
});

const notFound = (): never => {
  const error = new AppError("Resource not found", 404);
  (error as Error).name = "DocumentNotFoundError";
  throw error;
};

type TxClient = Prisma.TransactionClient;
type DbClient = TxClient;

@Injectable()
export class InvoiceService {
  private getDb(client?: TxClient): DbClient {
    return (client ?? prisma) as TxClient;
  }

  private async findInvoiceById(
    id: string,
    client?: TxClient,
    userId?: string,
  ): Promise<ICardInvoice> {
    const db = this.getDb(client);
    const row = await db.cardInvoice.findFirst({ where: { id, ...(userId ? { userId } : {}) } });

    if (!row) {
      notFound();
    }

    return mapInvoice(row);
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
    userId?: string,
    client?: TxClient,
  ): Promise<ICardInvoice | null> {
    const db = this.getDb(client);
    const row = await db.cardInvoice.findFirst({
      where: { bank, ...(userId ? { userId } : {}) },
      orderBy: { closingDate: "desc" },
    });

    return row ? mapInvoice(row) : null;
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

  async findById(
    id: string,
    _populate?: string,
    client?: TxClient,
    userId?: string,
  ): Promise<ICardInvoice> {
    return this.findInvoiceById(id, client, userId);
  }

  async update(id: string, data: Partial<ICardInvoice>, userId?: string): Promise<ICardInvoice> {
    const updateData: Prisma.CardInvoiceUpdateInput = {};

    if (data.bank != null) {
      updateData.bank = data.bank;
    }
    if (data.closingDate != null) {
      updateData.closingDate = data.closingDate;
    }
    if (data.dueDate != null) {
      updateData.dueDate = data.dueDate;
    }
    if (data.balance != null) {
      updateData.balance = data.balance;
    }
    if (data.isClosed != null) {
      updateData.isClosed = data.isClosed;
    }

    const row = await prisma.cardInvoice
      .update({
        where: { id, ...(userId ? { userId } : {}) },
        data: updateData,
      })
      .catch(() => null);

    if (!row) {
      notFound();
    }

    return mapInvoice(row);
  }

  async getAllWithExpenses(
    filter: Record<string, unknown>,
    userId?: string,
  ): Promise<ICardInvoice[]> {
    const bankFilter =
      typeof filter.bank === "string" ? filter.bank : undefined;
    const closingDateFilter = filter.closingDate as
      | Date
      | { $gte?: Date; $lte?: Date }
      | undefined;
    const dueDateFilter = filter.dueDate as Date | undefined;
    const createdAtFilter = filter.createdAt as
      | { $gte?: Date; $lte?: Date }
      | undefined;
    const updatedAtFilter = filter.updatedAt as
      | { $gte?: Date; $lte?: Date }
      | undefined;

    const where: Prisma.CardInvoiceWhereInput = {};

    if (bankFilter == null) {
      // no-op
    } else {
      where.bank = bankFilter;
    }

    if (closingDateFilter == null) {
      // no-op
    } else if ((closingDateFilter as any).$gte) {
      where.closingDate = {
        gte: (closingDateFilter as any).$gte,
        lte: (closingDateFilter as any).$lte,
      };
    } else {
      where.closingDate = closingDateFilter as Date;
    }

    if (dueDateFilter == null) {
      // no-op
    } else {
      where.dueDate = dueDateFilter;
    }

    if (createdAtFilter == null) {
      // no-op
    } else {
      where.createdAt = {
        gte: createdAtFilter.$gte,
        lte: createdAtFilter.$lte,
      };
    }

    if (updatedAtFilter == null) {
      // no-op
    } else {
      where.updatedAt = {
        gte: updatedAtFilter.$gte,
        lte: updatedAtFilter.$lte,
      };
    }

    if (userId) {
      where.userId = userId;
    }

    const rows = await prisma.cardInvoice.findMany({
      where,
      include: {
        expenses: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        },
      },
      orderBy: { dueDate: "desc" },
    });

    return rows.map((row: any) =>
      mapInvoice(row, row.expenses.map(mapExpense)),
    );
  }

  async getByIdWithExpenses(id: string, userId?: string): Promise<ICardInvoice> {
    const row = await prisma.cardInvoice.findUnique({
      where: { id, ...(userId ? { userId } : {}) },
      include: {
        expenses: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        },
      },
    });

    if (!row) {
      notFound();
    }

    return mapInvoice(row!, row!.expenses.map(mapExpense));
  }

  async checkDuplicate(
    bank: string,
    closingDate: string,
    userId?: string,
    client?: TxClient,
  ): Promise<boolean> {
    const db = this.getDb(client);
    const row = await db.cardInvoice.findFirst({
      where: {
        bank,
        closingDate: new Date(closingDate),
        ...(userId ? { userId } : {}),
      },
      select: { id: true },
    });

    return Boolean(row);
  }

  async createInvoice(
    data: Partial<ICardInvoice> & { userId?: string },
    client?: TxClient,
  ): Promise<ICardInvoice> {
    if (
      await this.checkDuplicate(
        data.bank!,
        data.closingDate!.toString(),
        data.userId,
        client,
      )
    ) {
      throw new AppError("Invoice already exists for this bank and period", 409);
    }

    const db = this.getDb(client);

    const row = await db.cardInvoice.create({
      data: {
        bank: data.bank!,
        closingDate: data.closingDate!,
        dueDate: data.dueDate!,
        balance: data.balance ?? 0,
        advance: data.advance ?? 0,
        isClosed: data.isClosed ?? false,
        userId: data.userId!,
      },
    });

    return mapInvoice(row);
  }

  async deleteWithExpenses(id: string, userId?: string): Promise<void> {
    await runWithTransaction(async (tx) => {
      await this.findInvoiceById(id, tx, userId);
      await tx.expense.deleteMany({ where: { cardInvoiceId: id } });
      const deleted = await tx.cardInvoice.delete({ where: { id } }).catch(() => null);
      if (!deleted) {
        notFound();
      }
    });

    logger.info({ invoiceId: id }, "Invoice and associated expenses deleted");
  }

  async advancePayment(id: string, amount: number, userId?: string): Promise<ICardInvoice> {
    await runWithTransaction(async (tx) => {
      const invoice = await this.findById(id, undefined, tx, userId);

      const currentBalance = invoice.balance ?? 0;
      const advancedAmount = invoice.advance ?? 0;
      const availableBalance = currentBalance - advancedAmount;

      if (amount > availableBalance) {
        throw new AppError("Advance amount cannot exceed available balance", 400, {
          currentBalance,
          advancedAmount,
          availableBalance,
          requestedAmount: amount,
        });
      }

      await tx.cardInvoice.update({
        where: { id },
        data: {
          advance: { increment: amount },
          balance: { decrement: amount },
        },
      });

      await tx.expense.create({
        data: {
          bank: invoice.bank,
          type: ExpenseTypeEnum.ADVANCE,
          category: "Advance",
          date: new Date(),
          amount,
          description: "Advance payment",
          cardInvoiceId: invoice.id,
          userId: invoice.userId!,
        },
      });
    });

    logger.info({ invoiceId: id, amount }, "Advance payment processed");
    return this.getByIdWithExpenses(id);
  }

  async updateBalance(
    invoiceId: string,
    delta: number,
    client?: TxClient,
  ): Promise<void> {
    const db = this.getDb(client);

    const updated = await db.cardInvoice
      .update({
        where: { id: invoiceId },
        data: { balance: { increment: delta } },
        select: { id: true },
      })
      .catch(() => null);

    if (!updated) {
      notFound();
    }

    logger.debug({ invoiceId, delta }, "Invoice balance updated");
  }

  async findForExpenseDate(
    bank: string,
    date: Date,
    userId?: string,
    client?: TxClient,
  ): Promise<ICardInvoice | null> {
    const queryDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const db = this.getDb(client);
    const row = await db.cardInvoice.findFirst({
      where: {
        bank,
        closingDate: { gte: queryDate },
        ...(userId ? { userId } : {}),
      },
      orderBy: { closingDate: "asc" },
    });

    return row ? mapInvoice(row) : null;
  }

  async ensureInvoiceForDate(
    bank: string,
    date: Date,
    userId?: string,
    client?: TxClient,
  ): Promise<ICardInvoice> {
    const targetDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const existingInvoice = await this.findForExpenseDate(bank, targetDate, userId, client);
    if (existingInvoice) {
      return existingInvoice;
    }

    const latestInvoice = await this.getLatestInvoice(bank, userId, client);
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

      createdInvoice = await this.createInvoice(
        {
          bank: bank as BanksEnum,
          closingDate: nextClosingDate,
          dueDate: nextDueDate,
          balance: 0,
          userId,
        },
        client,
      );

      currentClosingDate = createdInvoice.closingDate;
      currentDueDate = createdInvoice.dueDate;
    }

    return createdInvoice;
  }

  async closeInvoice(id: string, manualBalance?: number, userId?: string): Promise<ICardInvoice> {
    const invoice = await this.findById(id, undefined, undefined, userId);

    if (invoice.isClosed) {
      throw new AppError("Invoice is already closed", 400);
    }

    const updateData: Partial<ICardInvoice> = { isClosed: true };
    if (manualBalance != null) {
      updateData.balance = manualBalance;
    }

    await this.update(id, updateData, userId);

    const updatedInvoice = await this.getByIdWithExpenses(id);

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
    // "Hoje" no fuso do Brasil. Fatura com closingDate = D fecha só quando o dia
    // brasileiro vira D+1 (00:00 BRT), não às 21h BRT do dia D (meia-noite UTC).
    const today = getBrazilTodayUtcMidnight();

    const expiredRows = await prisma.cardInvoice.findMany({
      where: {
        isClosed: false,
        closingDate: { lt: today },
      },
    });

    const closedInvoices: ICardInvoice[] = [];

    for (const invoice of expiredRows) {
      try {
        const closed = await this.closeInvoice(invoice.id);
        closedInvoices.push(closed);
      } catch (error) {
        logger.error(
          { invoiceId: invoice.id, error },
          "Failed to auto-close expired invoice",
        );
      }
    }

    logger.info({ total: closedInvoices.length }, "Auto-closed expired invoices");

    return {
      closed: closedInvoices.length,
      invoices: closedInvoices,
    };
  }

  async reopenInvoice(id: string, userId?: string): Promise<ICardInvoice> {
    const invoice = await this.findById(id, undefined, undefined, userId);

    if (!invoice.isClosed) {
      throw new AppError("Invoice is not closed", 400);
    }

    await this.update(id, { isClosed: false }, userId);
    const updatedInvoice = await this.getByIdWithExpenses(id);

    logger.info({ invoiceId: id }, "Invoice reopened");
    return updatedInvoice;
  }

  async createFromCsv(
    bank: BanksEnum,
    closingDate: string,
    dueDate: string,
    csvContent: string,
    excludeIndexes?: number[],
    userId?: string,
  ): Promise<ICardInvoice> {
    const rows = parseInvoiceCsv(
      bank,
      csvContent,
      excludeIndexes ? new Set(excludeIndexes) : undefined,
    );

    const invoiceId = await runWithTransaction(async (tx) => {
      const invoice = await this.createInvoice(
        {
          bank,
          closingDate: new Date(closingDate),
          dueDate: new Date(dueDate),
          balance: 0,
          userId,
        },
        tx,
      );

      if (rows.length === 0) {
        logger.warn({ closingDate }, "CSV create produced no valid expenses");
        return invoice.id;
      }

      await tx.expense.createMany({
        data: rows.map((row) => ({
          bank,
          type: ExpenseTypeEnum.EXPENSE,
          category: "Importado",
          date: row.date,
          amount: row.amount,
          description: row.description,
          installmentCurrent: row.installment?.current ?? null,
          installmentTotal: row.installment?.total ?? null,
          cardInvoiceId: invoice.id,
          userId: userId!,
        })),
      });

      const newTotal = rows.reduce((sum, r) => sum + r.amount, 0);

      await tx.cardInvoice.update({
        where: { id: invoice.id },
        data: { balance: { increment: newTotal } },
      });

      return invoice.id;
    });

    const updatedInvoice = await this.getByIdWithExpenses(invoiceId);

    logger.info(
      { invoiceId: updatedInvoice.id, imported: rows.length },
      "Invoice created from CSV",
    );

    return updatedInvoice;
  }

  async getSummary(userId?: string): Promise<{
    totalOpen: number;
    totalClosed: number;
    countOpen: number;
    countClosed: number;
    byBank: Array<{
      bank: string;
      totalOpen: number;
      totalClosed: number;
      countOpen: number;
      countClosed: number;
    }>;
  }> {
    const where: Prisma.CardInvoiceWhereInput = userId ? { userId } : {};

    const [openAgg, closedAgg, byBankGroups] = await Promise.all([
      prisma.cardInvoice.aggregate({
        where: { ...where, isClosed: false },
        _sum: { balance: true },
        _count: { id: true },
      }),
      prisma.cardInvoice.aggregate({
        where: { ...where, isClosed: true },
        _sum: { balance: true },
        _count: { id: true },
      }),
      prisma.cardInvoice.groupBy({
        by: ["bank", "isClosed"],
        where,
        _sum: { balance: true },
        _count: { id: true },
      }),
    ]);

    const banks = ["NUBANK", "XP"] as const;
    const byBank = banks.map((bank) => {
      const openRow = byBankGroups.find((r) => r.bank === bank && !r.isClosed);
      const closedRow = byBankGroups.find((r) => r.bank === bank && r.isClosed);
      return {
        bank,
        totalOpen: toNumber(openRow?._sum.balance),
        totalClosed: toNumber(closedRow?._sum.balance),
        countOpen: openRow?._count.id ?? 0,
        countClosed: closedRow?._count.id ?? 0,
      };
    });

    return {
      totalOpen: toNumber(openAgg._sum.balance),
      totalClosed: toNumber(closedAgg._sum.balance),
      countOpen: openAgg._count.id,
      countClosed: closedAgg._count.id,
      byBank,
    };
  }

  async importFromCsv(
    id: string,
    csvContent: string,
    excludeIndexes?: number[],
    userId?: string,
  ): Promise<ICardInvoice> {
    const invoice = await this.findById(id, undefined, undefined, userId);

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

    await runWithTransaction(async (tx) => {
      const existing = await tx.expense.findMany({
        where: {
          cardInvoiceId: id,
          type: ExpenseTypeEnum.EXPENSE,
        },
        select: { amount: true },
      });

      const existingExpensesTotal = existing.reduce(
        (sum: number, expense: { amount: Prisma.Decimal | number }) =>
          sum + toNumber(expense.amount),
        0,
      );

      await tx.expense.deleteMany({
        where: {
          cardInvoiceId: id,
          type: ExpenseTypeEnum.EXPENSE,
        },
      });

      await tx.cardInvoice.update({
        where: { id },
        data: {
          balance: { decrement: existingExpensesTotal },
        },
      });

      if (rows.length === 0) {
        logger.warn({ invoiceId: id }, "CSV import produced no valid expenses");
        return;
      }

      await tx.expense.createMany({
        data: rows.map((row) => ({
          bank: invoice.bank,
          type: ExpenseTypeEnum.EXPENSE,
          category: "Importado",
          date: row.date,
          amount: row.amount,
          description: row.description,
          installmentCurrent: row.installment?.current ?? null,
          installmentTotal: row.installment?.total ?? null,
          cardInvoiceId: id,
          userId: invoice.userId!,
        })),
      });

      const newTotal = rows.reduce((sum, row) => sum + row.amount, 0);

      await tx.cardInvoice.update({
        where: { id },
        data: {
          balance: { increment: newTotal },
        },
      });
    });

    const updatedInvoice = await this.getByIdWithExpenses(id);

    logger.info({ invoiceId: id, imported: rows.length }, "CSV imported into invoice");

    return updatedInvoice;
  }
}
