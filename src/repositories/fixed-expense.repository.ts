import { Injectable } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IFixedExpense } from "../interfaces/fixed-expense";
import type { TxClient } from "../utils/run-with-transaction";

const linkInclude = {
  expenses: {
    where: { cardInvoice: { status: { not: InvoiceStatus.CLOSED } } },
    select: { cardInvoiceId: true },
  },
} satisfies Prisma.FixedExpenseInclude;

type FixedExpenseRow = Prisma.FixedExpenseGetPayload<{ include: typeof linkInclude }>;

const mapFixedExpense = (row: FixedExpenseRow): IFixedExpense => ({
  id: row.id,
  _id: row.id,
  userId: row.userId,
  name: row.name,
  amount: Number(row.amount),
  description: row.description ?? "",
  category: row.category ?? undefined,
  dueDay: row.dueDay ?? undefined,
  recurrenceMonths: row.recurrenceMonths,
  startDate: row.startDate,
  endDate: row.endDate,
  paymentMethodName: row.paymentMethodName ?? undefined,
  autoLaunch: row.autoLaunch,
  isActive: row.isActive,
  linkedInvoiceIds: row.expenses.flatMap((e) => (e.cardInvoiceId ? [e.cardInvoiceId] : [])),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class FixedExpenseRepository {
  async findMany(userId: string, isActive?: boolean): Promise<IFixedExpense[]> {
    const rows = await prisma.fixedExpense.findMany({
      where: {
        userId,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: linkInclude,
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapFixedExpense);
  }

  async findById(id: string): Promise<IFixedExpense | null> {
    const row = await prisma.fixedExpense.findUnique({ where: { id }, include: linkInclude });
    return row ? mapFixedExpense(row) : null;
  }

  async findManyByIds(userId: string, ids: string[]): Promise<IFixedExpense[]> {
    const rows = await prisma.fixedExpense.findMany({
      where: { userId, id: { in: ids } },
      include: linkInclude,
    });
    return rows.map(mapFixedExpense);
  }

  async findAutoLaunchable(): Promise<IFixedExpense[]> {
    const rows = await prisma.fixedExpense.findMany({
      where: { autoLaunch: true, isActive: true, paymentMethodName: { not: null } },
      include: linkInclude,
    });
    return rows.map(mapFixedExpense);
  }

  async create(data: {
    userId: string;
    name: string;
    amount: number;
    description?: string;
    category?: string;
    dueDay?: number;
    recurrenceMonths?: number;
    startDate?: Date | null;
    endDate?: Date | null;
    paymentMethodName?: string | null;
    autoLaunch?: boolean;
    isActive?: boolean;
  }): Promise<IFixedExpense> {
    const row = await prisma.fixedExpense.create({
      data: {
        userId: data.userId,
        name: data.name,
        amount: data.amount,
        description: data.description ?? "",
        category: data.category ?? null,
        dueDay: data.dueDay ?? null,
        recurrenceMonths: data.recurrenceMonths ?? 1,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        paymentMethodName: data.paymentMethodName ?? null,
        autoLaunch: data.autoLaunch ?? false,
        isActive: data.isActive ?? true,
      },
      include: linkInclude,
    });
    return mapFixedExpense(row);
  }

  async update(
    id: string,
    data: {
      name?: string;
      amount?: number;
      description?: string;
      category?: string;
      dueDay?: number;
      recurrenceMonths?: number;
      startDate?: Date | null;
      endDate?: Date | null;
      paymentMethodName?: string | null;
      autoLaunch?: boolean;
      isActive?: boolean;
    },
  ): Promise<IFixedExpense | null> {
    const row = await prisma.fixedExpense
      .update({ where: { id }, data, include: linkInclude })
      .catch(() => null);
    return row ? mapFixedExpense(row) : null;
  }

  async delete(id: string, tx?: TxClient): Promise<IFixedExpense | null> {
    const db = tx ?? prisma;
    const row = await db.fixedExpense
      .delete({ where: { id }, include: linkInclude })
      .catch(() => null);
    return row ? mapFixedExpense(row) : null;
  }
}
