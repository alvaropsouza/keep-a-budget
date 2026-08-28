import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IExpense } from "../interfaces/expense";
import { ExpenseTypeEnum } from "../enums/expense-type.enum";
import type { TxClient } from "../utils/run-with-transaction";

export type ExpenseFilter = {
  bank?: string;
  category?: string;
  cardInvoiceId?: string;
  amountGte?: number;
  amountLte?: number;
  createdAtGte?: Date;
  createdAtLte?: Date;
  updatedAtGte?: Date;
  updatedAtLte?: Date;
};

export type CreateExpenseData = {
  userId: string;
  bank: string;
  type: ExpenseTypeEnum;
  category: string;
  date: Date;
  amount: number;
  description?: string;
  receipt?: string | null;
  irDeductible?: boolean;
  cardInvoiceId?: string | null;
  installmentCurrent?: number | null;
  installmentTotal?: number | null;
};

export type UpdateExpenseData = {
  bank?: string;
  type?: ExpenseTypeEnum;
  category?: string;
  date?: Date;
  amount?: number;
  description?: string;
  receipt?: string | null;
  irDeductible?: boolean;
  cardInvoiceId?: string | null;
};

const toNumber = (value: Prisma.Decimal | number | null | undefined): number =>
  value == null ? 0 : Number(value);

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
      ? { current: row.installmentCurrent ?? undefined, total: row.installmentTotal ?? undefined }
      : undefined,
  cardInvoiceId: row.cardInvoiceId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class ExpenseRepository {
  async findById(id: string, userId?: string, tx?: TxClient): Promise<IExpense | null> {
    const db = tx ?? prisma;
    const row = await db.expense.findFirst({ where: { id, ...(userId ? { userId } : {}) } });
    return row ? mapExpense(row) : null;
  }

  async findMany(userId: string, filter: ExpenseFilter = {}): Promise<IExpense[]> {
    const rows = await prisma.expense.findMany({
      where: {
        userId,
        ...(filter.bank ? { bank: filter.bank } : {}),
        ...(filter.category ? { category: filter.category } : {}),
        ...(filter.cardInvoiceId ? { cardInvoiceId: filter.cardInvoiceId } : {}),
        ...(filter.amountGte !== undefined || filter.amountLte !== undefined
          ? { amount: { gte: filter.amountGte, lte: filter.amountLte } }
          : {}),
        ...(filter.createdAtGte !== undefined || filter.createdAtLte !== undefined
          ? { createdAt: { gte: filter.createdAtGte, lte: filter.createdAtLte } }
          : {}),
        ...(filter.updatedAtGte !== undefined || filter.updatedAtLte !== undefined
          ? { updatedAt: { gte: filter.updatedAtGte, lte: filter.updatedAtLte } }
          : {}),
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(mapExpense);
  }

  async findIrExpenses(year: number, userId: string): Promise<IExpense[]> {
    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    const rows = await prisma.expense.findMany({
      where: { userId, irDeductible: true, date: { gte: yearStart, lte: yearEnd } },
      orderBy: [{ category: "asc" }, { date: "asc" }],
    });
    return rows.map(mapExpense);
  }

  async create(data: CreateExpenseData, tx?: TxClient): Promise<IExpense> {
    const db = tx ?? prisma;
    const row = await db.expense.create({
      data: {
        bank: data.bank,
        type: data.type,
        category: data.category,
        date: data.date,
        amount: data.amount,
        description: data.description ?? "",
        receipt: data.receipt ?? null,
        irDeductible: data.irDeductible ?? false,
        installmentCurrent: data.installmentCurrent ?? null,
        installmentTotal: data.installmentTotal ?? null,
        cardInvoiceId: data.cardInvoiceId ?? null,
        userId: data.userId,
      },
    });
    return mapExpense(row);
  }

  async update(id: string, data: UpdateExpenseData, tx?: TxClient): Promise<IExpense | null> {
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
          ...(data.irDeductible !== undefined ? { irDeductible: data.irDeductible } : {}),
          ...(data.cardInvoiceId !== undefined ? { cardInvoiceId: data.cardInvoiceId } : {}),
        },
      })
      .catch(() => null);
    return row ? mapExpense(row) : null;
  }

  async delete(id: string, tx?: TxClient): Promise<IExpense | null> {
    const db = tx ?? prisma;
    const row = await db.expense.delete({ where: { id } }).catch(() => null);
    return row ? mapExpense(row) : null;
  }

  async createMany(data: CreateExpenseData[], tx?: TxClient): Promise<void> {
    const db = tx ?? prisma;
    await db.expense.createMany({
      data: data.map((d) => ({
        bank: d.bank,
        type: d.type,
        category: d.category,
        date: d.date,
        amount: d.amount,
        description: d.description ?? "",
        receipt: d.receipt ?? null,
        irDeductible: d.irDeductible ?? false,
        installmentCurrent: d.installmentCurrent ?? null,
        installmentTotal: d.installmentTotal ?? null,
        cardInvoiceId: d.cardInvoiceId ?? null,
        userId: d.userId,
      })),
    });
  }

  async sumAmountByInvoice(invoiceId: string, type: ExpenseTypeEnum, tx?: TxClient): Promise<number> {
    const db = tx ?? prisma;
    const result = await db.expense.aggregate({
      where: { cardInvoiceId: invoiceId, type },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  async deleteByInvoiceType(invoiceId: string, type: ExpenseTypeEnum, tx?: TxClient): Promise<void> {
    const db = tx ?? prisma;
    await db.expense.deleteMany({ where: { cardInvoiceId: invoiceId, type } });
  }
}
