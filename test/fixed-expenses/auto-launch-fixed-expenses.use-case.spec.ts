import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/config/prisma";
import { AutoLaunchFixedExpensesUseCase } from "../../src/use-cases/fixed-expenses/auto-launch-fixed-expenses.use-case";
import type { FixedExpenseRepository } from "../../src/repositories/fixed-expense.repository";
import type { ExpenseRepository } from "../../src/repositories/expense.repository";
import type { InvoiceRepository } from "../../src/repositories/invoice.repository";
import type { CategoryRepository } from "../../src/repositories/category.repository";
import type { ICardInvoice } from "../../src/interfaces/card-invoice";
import type { IFixedExpense } from "../../src/interfaces/fixed-expense";
import type { IExpense } from "../../src/interfaces/expense";

Object.defineProperty(prisma, "$transaction", {
  value: (operation: (tx: unknown) => Promise<unknown>) => operation({}),
  configurable: true,
});

const invoice = (id: string, closingDate: string): ICardInvoice =>
  ({ id, userId: "user-1", bank: "Nubank", closingDate: new Date(closingDate), isClosed: false }) as ICardInvoice;

const fixed: IFixedExpense = {
  id: "fx-1",
  userId: "user-1",
  name: "Internet",
  amount: 120,
  category: "Contas",
  paymentMethodName: "Nubank",
  recurrenceMonths: 1,
  dueDay: 10,
  linkedInvoiceIds: [],
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
} as IFixedExpense;

const buildUseCase = (openInvoices: ICardInvoice[], created: string[]) => {
  const fixedExpenseRepository = { findAutoLaunchable: async () => [fixed] } as unknown as FixedExpenseRepository;
  const invoiceRepository = {
    findAllOpen: async () => openInvoices,
    updateBalance: async () => undefined,
  } as unknown as InvoiceRepository;
  const expenseRepository = {
    create: async (data: { cardInvoiceId?: string | null; amount: number }) => {
      created.push(data.cardInvoiceId ?? "");
      return { amount: data.amount } as IExpense;
    },
  } as unknown as ExpenseRepository;
  const categoryRepository = { ensureExists: async () => undefined } as unknown as CategoryRepository;
  return new AutoLaunchFixedExpensesUseCase(
    fixedExpenseRepository,
    expenseRepository,
    invoiceRepository,
    categoryRepository,
  );
};

test("with two open invoices on the same card the expense lands on the one closing first", async () => {
  const created: string[] = [];
  const later = invoice("inv-later", "2026-10-28T00:00:00.000Z");
  const sooner = invoice("inv-sooner", "2026-09-28T00:00:00.000Z");

  const result = await buildUseCase([later, sooner], created).execute();

  assert.equal(result.launched, 1);
  assert.deepEqual(created, ["inv-sooner"]);
});

test("the pick does not depend on the row order the database returns", async () => {
  const created: string[] = [];
  const sooner = invoice("inv-sooner", "2026-09-28T00:00:00.000Z");
  const later = invoice("inv-later", "2026-10-28T00:00:00.000Z");

  await buildUseCase([sooner, later], created).execute();

  assert.deepEqual(created, ["inv-sooner"]);
});
