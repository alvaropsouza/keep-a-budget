import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { IFixedExpense } from "../models/FixedExpense";
import { FilterBuilder } from "../utils/filterBuilder";
import { FixedExpenseQueryParamsDto } from "../dto/fixedExpense.dto";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { prisma } from "../lib/prisma";

interface CreateFixedExpenseData {
  name: string;
  amount: number;
  description?: string;
  dueDay?: number;
  isActive?: boolean;
}

interface UpdateFixedExpenseData {
  name?: string;
  amount?: number;
  description?: string;
  dueDay?: number;
  isActive?: boolean;
}

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

const notFound = (): never => {
  const error = new AppError("Resource not found", 404);
  (error as Error).name = "DocumentNotFoundError";
  throw error;
};

@Injectable()
export class FixedExpenseService {
  buildFilter(
    userId: string,
    queryParams: FixedExpenseQueryParamsDto,
  ): Record<string, unknown> {
    const filter = new FilterBuilder()
      .addEquals("isActive", queryParams.isActive?.toString())
      .build();

    if (userId) {
      filter.userId = userId;
    }

    return filter;
  }

  async getAll(
    userId: string,
    filter: Record<string, unknown>,
  ): Promise<IFixedExpense[]> {
    const rows = await prisma.fixedExpense.findMany({
      where: {
        ...(userId ? { userId } : {}),
        ...(filter.isActive !== undefined
          ? {
              isActive:
                typeof filter.isActive === "boolean"
                  ? filter.isActive
                  : filter.isActive === "true",
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(mapFixedExpense);
  }

  async findById(id: string): Promise<IFixedExpense> {
    const row = await prisma.fixedExpense.findUnique({ where: { id } });
    if (!row) {
      notFound();
    }
    return mapFixedExpense(row!);
  }

  async update(id: string, data: UpdateFixedExpenseData): Promise<IFixedExpense> {
    const row = await prisma.fixedExpense.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.amount !== undefined ? { amount: data.amount } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.dueDay !== undefined ? { dueDay: data.dueDay } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    }).catch(() => null);

    if (!row) {
      notFound();
    }

    return mapFixedExpense(row!);
  }

  async delete(id: string): Promise<IFixedExpense> {
    const row = await prisma.fixedExpense.delete({ where: { id } }).catch(() => null);
    if (!row) {
      notFound();
    }
    return mapFixedExpense(row!);
  }

  async createFixedExpense(
    userId: string,
    data: CreateFixedExpenseData,
  ): Promise<IFixedExpense> {
    const row = await prisma.fixedExpense.create({
      data: {
        userId: userId || null,
        name: data.name,
        amount: data.amount,
        description: data.description ?? "",
        dueDay: data.dueDay ?? null,
        isActive: data.isActive ?? true,
      },
    });

    const fixedExpense = mapFixedExpense(row);

    logger.info(
      { fixedExpenseId: fixedExpense.id, amount: fixedExpense.amount },
      "Fixed expense created",
    );
    return fixedExpense;
  }

  async updateFixedExpense(
    id: string,
    userId: string,
    data: UpdateFixedExpenseData,
  ): Promise<IFixedExpense> {
    if (userId) {
      const existingFixedExpense = await this.findById(id);
      if (
        existingFixedExpense.userId &&
        existingFixedExpense.userId.toString() !== userId
      ) {
        throw new AppError("Unauthorized to update this fixed expense", 403);
      }
    }

    const updatedFixedExpense = await this.update(id, data);
    logger.info(
      { fixedExpenseId: id, updates: Object.keys(data) },
      "Fixed expense updated",
    );
    return updatedFixedExpense;
  }

  async deleteFixedExpense(id: string, userId: string): Promise<void> {
    if (userId) {
      const existingFixedExpense = await this.findById(id);
      if (
        existingFixedExpense.userId &&
        existingFixedExpense.userId.toString() !== userId
      ) {
        throw new AppError("Unauthorized to delete this fixed expense", 403);
      }
    }

    await this.delete(id);
    logger.info({ fixedExpenseId: id }, "Fixed expense deleted");
  }

  async getTotalFixedExpenses(userId: string): Promise<number> {
    const activeFixedExpenses = await this.getAll(userId, { isActive: true });
    return activeFixedExpenses.reduce(
      (total, expense) => total + expense.amount,
      0,
    );
  }
}
