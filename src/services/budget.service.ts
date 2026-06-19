import { Injectable, Inject } from "@nestjs/common";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";
import { ExpenseService } from "./expense.service";
import type { IExpense } from "../models/expense";

export interface BudgetSummaryItem {
  id: string;
  category: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
  banks: string[];
  closed: boolean;
}

@Injectable()
export class BudgetService {
  constructor(@Inject(ExpenseService) private readonly expenseService: ExpenseService) {}
  async getExpenses(userId: string, category: string, month: number, year: number): Promise<IExpense[]> {
    const budget = await prisma.budget.findUnique({
      where: { userId_category_month_year: { userId, category, month, year } },
      select: { cardInvoices: { select: { cardInvoiceId: true } } },
    });

    if (!budget) throw new AppError("Budget não encontrado", 404);

    const invoiceIds = budget.cardInvoices.map((ci) => ci.cardInvoiceId);

    const rows = await prisma.expense.findMany({
      where: { userId, category, cardInvoiceId: { in: invoiceIds } },
      orderBy: { date: "desc" },
    });

    const toNumber = (v: unknown) => (v == null ? 0 : Number(v));

    return Promise.all(
      rows.map(async (row): Promise<IExpense> => {
        let receipt = row.receipt ?? undefined;
        if (receipt) {
          try {
            receipt = await this.expenseService.getReceiptUrl(receipt);
          } catch {
            /* keep original key on sign failure */
          }
        }
        return {
          id: row.id,
          _id: row.id,
          userId: row.userId ?? undefined,
          bank: row.bank as IExpense["bank"],
          type: row.type as IExpense["type"],
          category: row.category,
          date: new Date(row.date),
          amount: toNumber(row.amount),
          description: row.description ?? "",
          receipt,
          irDeductible: row.irDeductible ?? false,
          installment:
            row.installmentCurrent || row.installmentTotal
              ? { current: row.installmentCurrent ?? undefined, total: row.installmentTotal ?? undefined }
              : undefined,
          cardInvoiceId: row.cardInvoiceId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }),
    );
  }

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
      select: {
        id: true,
        category: true,
        amount: true,
        cardInvoices: {
          select: { cardInvoiceId: true, bank: true, cardInvoice: { select: { isClosed: true } } },
        },
      },
      orderBy: { category: "asc" },
    });

    if (budgets.length === 0) return [];

    const allInvoiceIds = [...new Set(budgets.flatMap((b) => b.cardInvoices.map((ci) => ci.cardInvoiceId)))];
    const categories = budgets.map((b) => b.category);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        cardInvoiceId: { in: allInvoiceIds },
        category: { in: categories },
      },
      select: { category: true, amount: true, cardInvoiceId: true },
    });

    return budgets.map((b) => {
      const invoiceSet = new Set(b.cardInvoices.map((ci) => ci.cardInvoiceId));
      const spent = expenses
        .filter((e) => e.cardInvoiceId != null && invoiceSet.has(e.cardInvoiceId) && e.category === b.category)
        .reduce((acc, e) => acc + Number(e.amount), 0);
      const budgetAmount = Number(b.amount);
      const closed = b.cardInvoices.length > 0 && b.cardInvoices.every((ci) => ci.cardInvoice.isClosed);
      return {
        id: b.id,
        category: b.category,
        budgetAmount,
        spent,
        percentage: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
        banks: b.cardInvoices.map((ci) => ci.bank),
        closed,
      };
    });
  }
}
