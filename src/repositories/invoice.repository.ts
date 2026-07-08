import { Injectable } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import logger from "../config/logger";
import type { ICardInvoice } from "../interfaces/card-invoice";
import { InvoiceStatusEnum } from "../enums/invoice-status.enum";
import type { IExpense } from "../interfaces/expense";
import { ExpenseTypeEnum } from "../enums/expense-type.enum";
import { AppError } from "../utils/app-error";
import { runWithTransaction, type TxClient } from "../utils/run-with-transaction";
import { getBrazilTodayUtcMidnight } from "../utils/timezone";

type DbClient = TxClient;

const toNumber = (value: Prisma.Decimal | number | null | undefined): number =>
  value == null ? 0 : Number(value);

const toUtcMidnight = (date: Date): Date =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const userFilter = (userId?: string) => (userId ? { userId } : {});

function buildInvoiceWhere(
  filter: InvoiceFilter,
  userId?: string,
): Prisma.CardInvoiceWhereInput {
  const where: Prisma.CardInvoiceWhereInput = {};
  if (filter.bank) where.bank = filter.bank;
  if (filter.closingDate) where.closingDate = new Date(filter.closingDate);
  if (filter.startDate || filter.endDate) {
    where.closingDate = {
      gte: filter.startDate ? new Date(filter.startDate) : undefined,
      lte: filter.endDate ? new Date(filter.endDate) : undefined,
    };
  }
  if (filter.dueDate) where.dueDate = new Date(filter.dueDate);
  if (filter.createdStartDate || filter.createdEndDate) {
    where.createdAt = {
      gte: filter.createdStartDate ? new Date(filter.createdStartDate) : undefined,
      lte: filter.createdEndDate ? new Date(filter.createdEndDate) : undefined,
    };
  }
  if (filter.updatedStartDate || filter.updatedEndDate) {
    where.updatedAt = {
      gte: filter.updatedStartDate ? new Date(filter.updatedStartDate) : undefined,
      lte: filter.updatedEndDate ? new Date(filter.updatedEndDate) : undefined,
    };
  }
  if (userId) where.userId = userId;
  return where;
}

const mapExpense = (row: Prisma.ExpenseGetPayload<true>): IExpense => ({
  id: row.id,
  _id: row.id,
  userId: row.userId ?? undefined,
  bank: row.bank,
  type: row.type as ExpenseTypeEnum,
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

const mapInvoice = (row: Prisma.CardInvoiceGetPayload<true>, expenses?: IExpense[]): ICardInvoice => ({
  id: row.id,
  _id: row.id,
  userId: row.userId ?? undefined,
  bank: row.bank,
  closingDate: new Date(row.closingDate),
  dueDate: new Date(row.dueDate),
  balance: toNumber(row.balance),
  advance: toNumber(row.advance),
  status: row.status as InvoiceStatusEnum,
  isClosed: row.status === InvoiceStatus.CLOSED,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  expenses,
});

export type CreateInvoiceData = {
  bank: string;
  closingDate: Date;
  dueDate: Date;
  balance?: number;
  advance?: number;
  isClosed?: boolean;
  userId: string;
};

export type UpdateInvoiceData = {
  bank?: string;
  closingDate?: Date;
  dueDate?: Date;
  balance?: number;
  status?: InvoiceStatusEnum;
};

export type InvoiceFilter = {
  bank?: string;
  closingDate?: string;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  createdStartDate?: string;
  createdEndDate?: string;
  updatedStartDate?: string;
  updatedEndDate?: string;
};

export type InvoiceSummary = {
  totalOpen: number;
  totalFuture: number;
  totalClosed: number;
  countOpen: number;
  countFuture: number;
  countClosed: number;
  byBank: Array<{
    bank: string;
    totalOpen: number;
    totalFuture: number;
    totalClosed: number;
    countOpen: number;
    countFuture: number;
    countClosed: number;
  }>;
};

@Injectable()
export class InvoiceRepository {
  private getDb(tx?: TxClient): DbClient {
    return (tx ?? prisma) as TxClient;
  }

  private addMonthsClamped(date: Date, months: number): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const target = new Date(Date.UTC(year, month + months, day));
    if (target.getUTCDate() !== day) target.setUTCDate(0);
    return target;
  }

  private async checkDuplicate(
    bank: string,
    closingDate: Date,
    userId?: string,
    tx?: TxClient,
  ): Promise<boolean> {
    const db = this.getDb(tx);
    const row = await db.cardInvoice.findFirst({
      where: { bank, closingDate, ...userFilter(userId) },
      select: { id: true },
    });
    return Boolean(row);
  }

  private async findLatest(bank: string, userId?: string, tx?: TxClient): Promise<ICardInvoice | null> {
    const db = this.getDb(tx);
    const row = await db.cardInvoice.findFirst({
      where: { bank, ...userFilter(userId) },
      orderBy: { closingDate: "desc" },
    });
    return row ? mapInvoice(row) : null;
  }

  async findById(id: string, userId?: string, tx?: TxClient): Promise<ICardInvoice | null> {
    const db = this.getDb(tx);
    const row = await db.cardInvoice.findFirst({ where: { id, ...userFilter(userId) } });
    return row ? mapInvoice(row) : null;
  }

  async findByIdOrThrow(id: string, userId?: string, tx?: TxClient): Promise<ICardInvoice> {
    const invoice = await this.findById(id, userId, tx);
    if (!invoice) throw new AppError("Resource not found", 404);
    return invoice;
  }

  async findWithExpenses(id: string, userId?: string): Promise<ICardInvoice> {
    const row = await prisma.cardInvoice.findUnique({
      where: { id, ...userFilter(userId) },
      include: { expenses: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] } },
    });
    if (!row) throw new AppError("Resource not found", 404);
    return mapInvoice(row, row.expenses.map(mapExpense));
  }

  async findMany(filter: InvoiceFilter, userId?: string): Promise<ICardInvoice[]> {
    const rows = await prisma.cardInvoice.findMany({
      where: buildInvoiceWhere(filter, userId),
      include: { expenses: { orderBy: [{ date: "desc" }, { createdAt: "desc" }] } },
      orderBy: { dueDate: "desc" },
    });
    return rows.map((row) => mapInvoice(row, row.expenses.map(mapExpense)));
  }

  async findForExpenseDate(
    bank: string,
    date: Date,
    userId?: string,
    tx?: TxClient,
  ): Promise<ICardInvoice | null> {
    const queryDate = toUtcMidnight(date);
    const db = this.getDb(tx);
    const row = await db.cardInvoice.findFirst({
      where: { bank, closingDate: { gte: queryDate }, ...userFilter(userId) },
      orderBy: { closingDate: "asc" },
    });
    return row ? mapInvoice(row) : null;
  }

  async findOpenForExpenseDate(
    bank: string,
    date: Date,
    userId?: string,
    tx?: TxClient,
  ): Promise<ICardInvoice | null> {
    const queryDate = toUtcMidnight(date);
    const db = this.getDb(tx);
    const row = await db.cardInvoice.findFirst({
      where: {
        bank,
        status: { not: InvoiceStatus.CLOSED },
        closingDate: { gte: queryDate },
        ...userFilter(userId),
      },
      orderBy: { closingDate: "asc" },
    });
    return row ? mapInvoice(row) : null;
  }

  async findExpiredOpen(): Promise<ICardInvoice[]> {
    const today = getBrazilTodayUtcMidnight();
    const rows = await prisma.cardInvoice.findMany({
      where: { status: { not: InvoiceStatus.CLOSED }, closingDate: { lt: today } },
    });
    return rows.map((row) => mapInvoice(row));
  }

  async create(data: CreateInvoiceData, tx?: TxClient): Promise<ICardInvoice> {
    if (await this.checkDuplicate(data.bank, data.closingDate, data.userId, tx)) {
      throw new AppError("Invoice already exists for this bank and period", 409);
    }
    const db = this.getDb(tx);
    const row = await db.cardInvoice.create({
      data: {
        bank: data.bank,
        closingDate: data.closingDate,
        dueDate: data.dueDate,
        balance: data.balance ?? 0,
        advance: data.advance ?? 0,
        status: data.isClosed ? InvoiceStatus.CLOSED : InvoiceStatus.FUTURE,
        userId: data.userId,
      },
    });
    if (!data.isClosed) {
      await this.syncBankStatuses(data.bank, data.userId, tx);
      const synced = await db.cardInvoice.findUnique({ where: { id: row.id } });
      return mapInvoice(synced ?? row);
    }
    return mapInvoice(row);
  }

  async syncBankStatuses(bank: string, userId?: string, tx?: TxClient): Promise<void> {
    const db = this.getDb(tx);
    const openRows = await db.cardInvoice.findMany({
      where: { bank, status: { not: InvoiceStatus.CLOSED }, ...userFilter(userId) },
      orderBy: { closingDate: "asc" },
      select: { id: true, status: true },
    });
    if (openRows.length === 0) return;

    const [current, ...future] = openRows;
    if (current.status !== InvoiceStatus.OPEN) {
      await db.cardInvoice.update({ where: { id: current.id }, data: { status: InvoiceStatus.OPEN } });
    }
    const demoteIds = future.filter((r) => r.status !== InvoiceStatus.FUTURE).map((r) => r.id);
    if (demoteIds.length > 0) {
      await db.cardInvoice.updateMany({
        where: { id: { in: demoteIds } },
        data: { status: InvoiceStatus.FUTURE },
      });
    }
  }

  async update(id: string, data: UpdateInvoiceData, userId?: string, tx?: TxClient): Promise<ICardInvoice> {
    const db = this.getDb(tx);
    const updateData: Prisma.CardInvoiceUpdateInput = {};
    if (data.bank != null) updateData.bank = data.bank;
    if (data.closingDate != null) updateData.closingDate = data.closingDate;
    if (data.dueDate != null) updateData.dueDate = data.dueDate;
    if (data.balance != null) updateData.balance = data.balance;
    if (data.status != null) updateData.status = data.status;

    const row = await db.cardInvoice
      .update({ where: { id, ...userFilter(userId) }, data: updateData })
      .catch(() => null);

    if (!row) throw new AppError("Resource not found", 404);
    return mapInvoice(row);
  }

  async updateBalance(invoiceId: string, delta: number, tx?: TxClient): Promise<void> {
    const db = this.getDb(tx);
    const updated = await db.cardInvoice
      .update({
        where: { id: invoiceId },
        data: { balance: { increment: delta } },
        select: { id: true },
      })
      .catch(() => null);

    if (!updated) throw new AppError("Resource not found", 404);
    logger.debug({ invoiceId, delta }, "Invoice balance updated");
  }

  async applyAdvance(id: string, amount: number, tx?: TxClient): Promise<void> {
    const db = this.getDb(tx);
    await db.cardInvoice.update({
      where: { id },
      data: { advance: { increment: amount }, balance: { decrement: amount } },
    });
  }

  async deleteWithExpenses(id: string, userId?: string): Promise<void> {
    await runWithTransaction(async (tx) => {
      const invoice = await this.findByIdOrThrow(id, userId, tx);
      await tx.expense.deleteMany({ where: { cardInvoiceId: invoice.id } });
      const deleted = await tx.cardInvoice.delete({ where: { id } }).catch(() => null);
      if (!deleted) throw new AppError("Resource not found", 404);
      await this.syncBankStatuses(invoice.bank, invoice.userId, tx);
    });
    logger.info({ invoiceId: id }, "Invoice and associated expenses deleted");
  }

  async getSummary(userId?: string): Promise<InvoiceSummary> {
    const where: Prisma.CardInvoiceWhereInput = userId ? { userId } : {};

    const byBankGroups = await prisma.cardInvoice.groupBy({
      by: ["bank", "status"],
      where,
      _sum: { balance: true },
      _count: { id: true },
    });

    const banks = [...new Set(byBankGroups.map((r) => r.bank))].sort();

    const pick = (bank: string, status: InvoiceStatus) =>
      byBankGroups.find((r) => r.bank === bank && r.status === status);

    const byBank = banks.map((bank) => {
      const openRow = pick(bank, InvoiceStatus.OPEN);
      const futureRow = pick(bank, InvoiceStatus.FUTURE);
      const closedRow = pick(bank, InvoiceStatus.CLOSED);
      return {
        bank,
        totalOpen: toNumber(openRow?._sum.balance),
        totalFuture: toNumber(futureRow?._sum.balance),
        totalClosed: toNumber(closedRow?._sum.balance),
        countOpen: openRow?._count.id ?? 0,
        countFuture: futureRow?._count.id ?? 0,
        countClosed: closedRow?._count.id ?? 0,
      };
    });

    return {
      totalOpen: byBank.reduce((sum, b) => sum + b.totalOpen, 0),
      totalFuture: byBank.reduce((sum, b) => sum + b.totalFuture, 0),
      totalClosed: byBank.reduce((sum, b) => sum + b.totalClosed, 0),
      countOpen: byBank.reduce((sum, b) => sum + b.countOpen, 0),
      countFuture: byBank.reduce((sum, b) => sum + b.countFuture, 0),
      countClosed: byBank.reduce((sum, b) => sum + b.countClosed, 0),
      byBank,
    };
  }

  async ensureForDate(
    bank: string,
    date: Date,
    userId?: string,
    tx?: TxClient,
    cycle?: { closingDay: number; dueDay: number },
  ): Promise<ICardInvoice> {
    const targetDate = toUtcMidnight(date);

    const existing = await this.findForExpenseDate(bank, targetDate, userId, tx);
    if (existing) return existing;

    const latest = await this.findLatest(bank, userId, tx);
    if (!latest && !cycle) {
      throw new AppError(
        `Nenhuma fatura cadastrada para o cartão ${bank}. Crie a primeira fatura manualmente para definirmos o ciclo.`,
        400,
      );
    }

    if (!latest && cycle) {
      const firstClosingDate = this.nextOccurrenceOfDay(targetDate, cycle.closingDay);
      const firstDueDate = this.dueDateAfterClosing(firstClosingDate, cycle.dueDay);
      return this.create(
        { bank, closingDate: firstClosingDate, dueDate: firstDueDate, balance: 0, userId: userId! },
        tx,
      );
    }

    let currentClosingDate = latest!.closingDate;
    let currentDueDate = latest!.dueDate;
    let created: ICardInvoice | null = null;

    while (!created || created.closingDate < targetDate) {
      const nextClosingDate = this.addMonthsClamped(currentClosingDate, 1);
      const nextDueDate = this.addMonthsClamped(currentDueDate, 1);

      created = await this.create(
        { bank, closingDate: nextClosingDate, dueDate: nextDueDate, balance: 0, userId: userId! },
        tx,
      );

      currentClosingDate = created.closingDate;
      currentDueDate = created.dueDate;
    }

    return created;
  }

  private nextOccurrenceOfDay(fromDate: Date, dayOfMonth: number): Date {
    const year = fromDate.getUTCFullYear();
    const month = fromDate.getUTCMonth();
    const candidate = this.clampedDate(year, month, dayOfMonth);
    if (candidate >= fromDate) return candidate;
    return this.clampedDate(year, month + 1, dayOfMonth);
  }

  private dueDateAfterClosing(closingDate: Date, dueDay: number): Date {
    const year = closingDate.getUTCFullYear();
    const month = closingDate.getUTCMonth();
    const sameMonth = this.clampedDate(year, month, dueDay);
    if (sameMonth > closingDate) return sameMonth;
    return this.clampedDate(year, month + 1, dueDay);
  }

  private clampedDate(year: number, month: number, day: number): Date {
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
  }
}
