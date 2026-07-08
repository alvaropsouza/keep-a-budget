import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IExtraIncome } from "../interfaces/extra-income";

const mapExtraIncome = (row: Prisma.ExtraIncomeGetPayload<true>): IExtraIncome => ({
  id: row.id,
  _id: row.id,
  userId: row.userId,
  description: row.description,
  amount: Number(row.amount),
  date: row.date,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class ExtraIncomeRepository {
  async findMany(userId: string, filter?: { month?: number; year?: number }): Promise<IExtraIncome[]> {
    const dateRange =
      filter?.month !== undefined && filter?.year !== undefined
        ? {
            date: {
              gte: new Date(Date.UTC(filter.year, filter.month - 1, 1)),
              lt: new Date(Date.UTC(filter.year, filter.month, 1)),
            },
          }
        : {};
    const rows = await prisma.extraIncome.findMany({
      where: { userId, ...dateRange },
      orderBy: { date: "desc" },
    });
    return rows.map(mapExtraIncome);
  }

  async findById(id: string): Promise<IExtraIncome | null> {
    const row = await prisma.extraIncome.findUnique({ where: { id } });
    return row ? mapExtraIncome(row) : null;
  }

  async create(data: { userId: string; description: string; amount: number; date: string }): Promise<IExtraIncome> {
    const row = await prisma.extraIncome.create({
      data: {
        userId: data.userId,
        description: data.description,
        amount: data.amount,
        date: new Date(data.date),
      },
    });
    return mapExtraIncome(row);
  }

  async delete(id: string): Promise<IExtraIncome | null> {
    const row = await prisma.extraIncome.delete({ where: { id } }).catch(() => null);
    return row ? mapExtraIncome(row) : null;
  }
}
