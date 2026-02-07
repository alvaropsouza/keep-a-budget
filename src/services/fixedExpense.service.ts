import { BaseService } from "./base.service";
import FixedExpense, { IFixedExpense } from "../models/FixedExpense";
import { FilterBuilder } from "../utils/filterBuilder";
import { FixedExpenseQueryParamsDto } from "../dto/fixedExpense.dto";
import logger from "../config/logger";
import mongoose from "mongoose";

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

export class FixedExpenseService extends BaseService<IFixedExpense> {
  constructor() {
    super(FixedExpense);
  }

  buildFilter(
    userId: string,
    queryParams: FixedExpenseQueryParamsDto,
  ): Record<string, unknown> {
    const filter = new FilterBuilder()
      .addEquals("isActive", queryParams.isActive?.toString())
      .build();

    // Só adiciona userId ao filtro se ele existir
    if (userId) {
      filter.userId = userId;
    }

    return filter;
  }

  async getAll(
    userId: string,
    filter: Record<string, unknown>,
  ): Promise<IFixedExpense[]> {
    const finalFilter = userId ? { ...filter, userId } : filter;
    return this.findAll(finalFilter, { createdAt: -1 });
  }

  async createFixedExpense(
    userId: string,
    data: CreateFixedExpenseData,
  ): Promise<IFixedExpense> {
    const fixedExpenseData: any = {
      ...data,
      isActive: data.isActive ?? true,
    };

    // Só adiciona userId se ele existir
    if (userId) {
      fixedExpenseData.userId = new mongoose.Types.ObjectId(userId);
    }

    const fixedExpense = await this.create(fixedExpenseData);

    logger.info(
      { fixedExpenseId: fixedExpense._id, amount: fixedExpense.amount },
      "Fixed expense created",
    );
    return fixedExpense;
  }

  async updateFixedExpense(
    id: string,
    userId: string,
    data: UpdateFixedExpenseData,
  ): Promise<IFixedExpense> {
    // Verificar se a despesa fixa pertence ao usuário (se userId existir)
    if (userId) {
      const existingFixedExpense = await this.findById(id);
      if (
        existingFixedExpense.userId &&
        existingFixedExpense.userId.toString() !== userId
      ) {
        throw new Error("Unauthorized to update this fixed expense");
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
    // Verificar se a despesa fixa pertence ao usuário (se userId existir)
    if (userId) {
      const existingFixedExpense = await this.findById(id);
      if (
        existingFixedExpense.userId &&
        existingFixedExpense.userId.toString() !== userId
      ) {
        throw new Error("Unauthorized to delete this fixed expense");
      }
    }

    await this.delete(id);
    logger.info({ fixedExpenseId: id }, "Fixed expense deleted");
  }

  async getTotalFixedExpenses(userId: string): Promise<number> {
    const filter: any = { isActive: true };
    if (userId) {
      filter.userId = userId;
    }

    const activeFixedExpenses = await this.findAll(filter, {});
    return activeFixedExpenses.reduce(
      (total, expense) => total + expense.amount,
      0,
    );
  }
}
