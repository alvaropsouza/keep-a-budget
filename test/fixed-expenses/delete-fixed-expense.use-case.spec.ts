import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/config/prisma";
import { DeleteFixedExpenseUseCase } from "../../src/use-cases/fixed-expenses/delete-fixed-expense.use-case";
import type { FixedExpenseRepository } from "../../src/repositories/fixed-expense.repository";
import type { ExpenseRepository } from "../../src/repositories/expense.repository";
import type { InvoiceRepository } from "../../src/repositories/invoice.repository";
import type { IExpense } from "../../src/interfaces/expense";
import type { IFixedExpense } from "../../src/interfaces/fixed-expense";

type TransactionRunner = <T>(operation: (tx: unknown) => Promise<T>) => Promise<T>;

const runInline: TransactionRunner = (operation) => operation({});
Object.defineProperty(prisma, "$transaction", { value: runInline, configurable: true });

const fixed = { id: "fx-1", userId: "user-1" } as IFixedExpense;

const linkedExpenses = [
  { id: "exp-1", amount: 120, cardInvoiceId: "inv-1" },
  { id: "exp-2", amount: 80, cardInvoiceId: null },
] as IExpense[];

const buildUseCase = () => {
  const deletedExpenseIds: string[] = [];
  const balanceDeltas: Array<[string, number]> = [];
  let deletedFixedId: string | null = null;

  const fixedExpenseRepository = {
    findById: async () => fixed,
    delete: async (id: string) => {
      deletedFixedId = id;
      return fixed;
    },
  } as unknown as FixedExpenseRepository;

  const expenseRepository = {
    findRemovableByFixedExpense: async () => linkedExpenses,
    delete: async (id: string) => {
      deletedExpenseIds.push(id);
      return null;
    },
  } as unknown as ExpenseRepository;

  const invoiceRepository = {
    updateBalance: async (invoiceId: string, delta: number) => {
      balanceDeltas.push([invoiceId, delta]);
    },
  } as unknown as InvoiceRepository;

  const useCase = new DeleteFixedExpenseUseCase(
    fixedExpenseRepository,
    expenseRepository,
    invoiceRepository,
  );

  return {
    useCase,
    deletedExpenseIds,
    balanceDeltas,
    getDeletedFixedId: () => deletedFixedId,
  };
};

test("deleting a fixed expense removes its launched expenses and refunds the invoice balance", async () => {
  const ctx = buildUseCase();

  const result = await ctx.useCase.execute({ id: "fx-1", userId: "user-1" });

  assert.deepEqual(result, { removedExpenses: 2 });
  assert.deepEqual(ctx.deletedExpenseIds, ["exp-1", "exp-2"]);
  assert.deepEqual(ctx.balanceDeltas, [["inv-1", -120]]);
  assert.equal(ctx.getDeletedFixedId(), "fx-1");
});
