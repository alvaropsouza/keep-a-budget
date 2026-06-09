import { Injectable } from "@nestjs/common";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

export interface BudgetSummaryItem {
  category: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
  banks: string[];
}

@Injectable()
export class BudgetService {
  async upsert(
    userId: string,
    category: string,
    amount: number,
    month: number,
    year: number,
    invoiceIds: string[],
  ) {
    if (invoiceIds.length === 0) {
      throw new AppError("Selecione pelo menos uma fatura", 400);
    }

    const invoices = await prisma.cardInvoice.findMany({
      where: { id: { in: invoiceIds }, userId },
    });

    if (invoices.length !== invoiceIds.length) {
      throw new AppError("Uma ou mais faturas não encontradas", 404);
    }

    // Max 1 invoice per bank
    const banks = invoices.map((inv) => inv.bank);
    if (new Set(banks).size !== banks.length) {
      throw new AppError("Não pode ter duas faturas do mesmo banco", 400);
    }

    // All invoices must be from the same month/year (by closingDate)
    const invoiceMonths = invoices.map((inv) => ({
      month: new Date(inv.closingDate).getMonth() + 1,
      year: new Date(inv.closingDate).getFullYear(),
    }));

    const distinctMonths = new Set(invoiceMonths.map((m) => `${m.month}-${m.year}`));
    if (distinctMonths.size > 1) {
      throw new AppError("Todas as faturas devem ser do mesmo mês", 400);
    }

    return prisma.$transaction(async (tx) => {
      const budget = await tx.budget.upsert({
        where: { userId_category_month_year: { userId, category, month, year } },
        update: { amount },
        create: { userId, category, amount, month, year },
      });

      await tx.budgetCardInvoice.deleteMany({ where: { budgetId: budget.id } });
      await tx.budgetCardInvoice.createMany({
        data: invoices.map((inv) => ({
          budgetId: budget.id,
          cardInvoiceId: inv.id,
          bank: inv.bank,
        })),
      });

      return budget;
    });
  }

  async list(userId: string, month: number, year: number) {
    return prisma.budget.findMany({
      where: { userId, month, year },
      include: {
        cardInvoices: {
          select: { cardInvoiceId: true, bank: true },
        },
      },
      orderBy: { category: "asc" },
    });
  }

  async delete(id: string, userId: string) {
    const budget = await prisma.budget.findUnique({ where: { id } });
    if (!budget) throw new AppError("Budget not found", 404);
    if (budget.userId !== userId) throw new AppError("Unauthorized", 403);
    return prisma.budget.delete({ where: { id } });
  }

  async getSummary(userId: string, month: number, year: number): Promise<BudgetSummaryItem[]> {
    const budgets = await prisma.budget.findMany({
      where: { userId, month, year },
      include: {
        cardInvoices: {
          select: { cardInvoiceId: true, bank: true },
        },
      },
      orderBy: { category: "asc" },
    });

    if (budgets.length === 0) return [];

    return Promise.all(
      budgets.map(async (b) => {
        const invoiceIds = b.cardInvoices.map((bi) => bi.cardInvoiceId);

        const expenses = await prisma.expense.findMany({
          where: {
            userId,
            cardInvoiceId: { in: invoiceIds },
            category: b.category,
          },
          select: { amount: true },
        });

        const spent = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
        const budgetAmount = Number(b.amount);

        return {
          category: b.category,
          budgetAmount,
          spent,
          percentage: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
          banks: b.cardInvoices.map((bi) => bi.bank),
        };
      }),
    );
  }
}
