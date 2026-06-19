import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IFixedExpense } from "../interfaces/fixed-expense";

const mapFixedExpense = (row: Prisma.FixedExpenseGetPayload<true>): IFixedExpense => ({
  id: row.id,
  _id: row.id,
  userId: row.userId,
  name: row.name,
  amount: Number(row.amount),
  description: row.description ?? "",
  dueDay: row.dueDay ?? undefined,
  isActive: row.isActive,
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
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapFixedExpense);
  }

  async findById(id: string): Promise<IFixedExpense | null> {
    const row = await prisma.fixedExpense.findUnique({ where: { id } });
    return row ? mapFixedExpense(row) : null;
  }

  async create(data: {
    userId: string;
    name: string;
    amount: number;
    description?: string;
    dueDay?: number;
    isActive?: boolean;
  }): Promise<IFixedExpense> {
    const row = await prisma.fixedExpense.create({
      data: {
        userId: data.userId,
        name: data.name,
        amount: data.amount,
        description: data.description ?? "",
        dueDay: data.dueDay ?? null,
        isActive: data.isActive ?? true,
      },
    });
    return mapFixedExpense(row);
  }

  async update(
    id: string,
    data: { name?: string; amount?: number; description?: string; dueDay?: number; isActive?: boolean },
  ): Promise<IFixedExpense | null> {
    const row = await prisma.fixedExpense.update({ where: { id }, data }).catch(() => null);
    return row ? mapFixedExpense(row) : null;
  }

  async delete(id: string): Promise<IFixedExpense | null> {
    const row = await prisma.fixedExpense.delete({ where: { id } }).catch(() => null);
    return row ? mapFixedExpense(row) : null;
  }
}
