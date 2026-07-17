import { Injectable } from "@nestjs/common";
import { prisma } from "../config/prisma";
import { InvoiceStatus, type Budget, type Expense } from "../generated/prisma/client/client";

type BudgetWithInvoices = Budget & {
  cardInvoices: { cardInvoiceId: string; bank: string }[];
};

type BudgetSummaryRow = {
  id: string;
  category: string;
  amount: unknown;
  month: number;
  year: number;
  cardInvoices: {
    cardInvoiceId: string;
    bank: string;
    cardInvoice: { isClosed: boolean };
  }[];
};

@Injectable()
export class BudgetRepository {
  async findMany(userId: string, month: number, year: number): Promise<BudgetWithInvoices[]> {
    return prisma.budget.findMany({
      where: { userId, month, year },
      include: { cardInvoices: { select: { cardInvoiceId: true, bank: true } } },
      orderBy: { category: "asc" },
    });
  }

  async findById(id: string): Promise<Budget | null> {
    return prisma.budget.findUnique({ where: { id } });
  }

  async findByKey(
    userId: string,
    category: string,
    month: number,
    year: number,
  ): Promise<{ cardInvoices: { cardInvoiceId: string }[] } | null> {
    return prisma.budget.findUnique({
      where: { userId_category_month_year: { userId, category, month, year } },
      select: { cardInvoices: { select: { cardInvoiceId: true } } },
    });
  }

  async findSummaryRows(userId: string, month: number, year: number): Promise<BudgetSummaryRow[]> {
    const rows = await prisma.budget.findMany({
      where: { userId, month, year },
      select: {
        id: true,
        category: true,
        amount: true,
        month: true,
        year: true,
        cardInvoices: {
          select: {
            cardInvoiceId: true,
            bank: true,
            cardInvoice: { select: { status: true } },
          },
        },
      },
      orderBy: { category: "asc" },
    });
    return rows.map((row) => ({
      ...row,
      cardInvoices: row.cardInvoices.map((ci) => ({
        cardInvoiceId: ci.cardInvoiceId,
        bank: ci.bank,
        cardInvoice: { isClosed: ci.cardInvoice.status === InvoiceStatus.CLOSED },
      })),
    }));
  }

  async findInvoices(invoiceIds: string[], userId: string) {
    return prisma.cardInvoice.findMany({ where: { id: { in: invoiceIds }, userId } });
  }

  async findExpensesByInvoicesAndCategory(
    userId: string,
    invoiceIds: string[],
    category: string,
  ): Promise<Expense[]> {
    return prisma.expense.findMany({
      where: { userId, category, cardInvoiceId: { in: invoiceIds } },
      orderBy: { date: "desc" },
    });
  }

  async findExpenseAmountsByInvoicesAndCategories(
    userId: string,
    invoiceIds: string[],
    categories: string[],
  ): Promise<{ category: string; amount: unknown; cardInvoiceId: string | null }[]> {
    return prisma.expense.findMany({
      where: { userId, cardInvoiceId: { in: invoiceIds }, category: { in: categories } },
      select: { category: true, amount: true, cardInvoiceId: true },
    });
  }

  async upsert(
    userId: string,
    category: string,
    amount: number,
    month: number,
    year: number,
    invoices: { id: string; bank: string }[],
  ): Promise<Budget> {
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

  async delete(id: string): Promise<Budget> {
    return prisma.budget.delete({ where: { id } });
  }
}
