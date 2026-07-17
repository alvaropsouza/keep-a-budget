import { Injectable } from "@nestjs/common";
import { prisma } from "../config/prisma";
import { InvoiceStatus, type Budget, type Expense, type Prisma } from "../generated/prisma/client/client";
import type { BudgetSummaryRow } from "../utils/budget-summary";

type BudgetWithInvoices = Budget & {
  cardInvoices: { cardInvoiceId: string; bank: string }[];
};

const summarySelect = {
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
} satisfies Prisma.BudgetSelect;

type RawSummaryRow = {
  id: string;
  category: string;
  amount: unknown;
  month: number;
  year: number;
  cardInvoices: { cardInvoiceId: string; bank: string; cardInvoice: { status: InvoiceStatus } }[];
};

function toSummaryRow(row: RawSummaryRow): BudgetSummaryRow {
  return {
    ...row,
    cardInvoices: row.cardInvoices.map((ci) => ({
      cardInvoiceId: ci.cardInvoiceId,
      bank: ci.bank,
      cardInvoice: { isClosed: ci.cardInvoice.status === InvoiceStatus.CLOSED },
    })),
  };
}

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
      select: summarySelect,
      orderBy: { category: "asc" },
    });
    return rows.map(toSummaryRow);
  }

  async findActiveSummaryRows(
    userId: string,
    month: number,
    year: number,
  ): Promise<BudgetSummaryRow[]> {
    const rows = await prisma.budget.findMany({
      where: {
        userId,
        OR: [
          { cardInvoices: { some: { cardInvoice: { status: InvoiceStatus.OPEN } } } },
          { month, year },
        ],
      },
      select: summarySelect,
      orderBy: [{ year: "asc" }, { month: "asc" }, { category: "asc" }],
    });
    return rows.map(toSummaryRow);
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
