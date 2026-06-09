import { Injectable } from "@nestjs/common";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export interface BudgetSummaryItem {
  category: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
}

@Injectable()
export class BudgetService {
  async upsert(userId: string, category: string, amount: number, month: number, year: number) {
    return prisma.budget.upsert({
      where: { userId_category_month_year: { userId, category, month, year } },
      update: { amount },
      create: { userId, category, amount, month, year },
    });
  }

  async list(userId: string, month: number, year: number) {
    return prisma.budget.findMany({
      where: { userId, month, year },
      orderBy: { category: "asc" },
    });
  }

  async delete(id: string, userId: string) {
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new AppError("Budget not found", 404);
    if (budget.userId !== userId) throw new AppError("Unauthorized", 403);
    return prisma.budget.delete({ where: { id } });
  }

  async getSummary(userId: string, month: number, year: number, invoiceIds: string[] = []): Promise<BudgetSummaryItem[]> {
    const budgets = await this.list(userId, month, year);
    if (budgets.length === 0) return [];

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const categories = budgets.map((b) => b.category);

    const byDate = { userId, date: { gte: startDate, lte: endDate }, category: { in: categories } };
    const byInvoice = invoiceIds.length > 0
      ? { userId, cardInvoiceId: { in: invoiceIds }, category: { in: categories } }
      : null;

    const expenses = await prisma.expense.findMany({
      where: byInvoice ? { OR: [byDate, byInvoice] } : byDate,
      select: { category: true, amount: true },
    });

    const spentByCategory = expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
      return acc;
    }, {});

    return budgets.map((b) => {
      const budgetAmount = Number(b.amount);
      const spent = spentByCategory[b.category] ?? 0;
      return {
        category: b.category,
        budgetAmount,
        spent,
        percentage: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
      };
    });
  }
}
