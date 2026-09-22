import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/config/prisma";
import { DeleteExpenseUseCase } from "../../src/use-cases/expenses/delete-expense.use-case";
import type { ExpenseRepository } from "../../src/repositories/expense.repository";
import type { InvoiceRepository } from "../../src/repositories/invoice.repository";
import type { IExpense } from "../../src/interfaces/expense";
import type { ICardInvoice } from "../../src/interfaces/card-invoice";
import type { S3Service } from "../../src/services/s3.service";
import { ExpenseTypeEnum } from "../../src/enums/expense-type.enum";

type TransactionRunner = <T>(operation: (tx: unknown) => Promise<T>) => Promise<T>;

const runInline: TransactionRunner = (operation) => operation({});
Object.defineProperty(prisma, "$transaction", { value: runInline, configurable: true });

const buildUseCase = (expense: IExpense) => {
  const balanceDeltas: Array<[string, number]> = [];
  const advanceDeltas: Array<[string, number]> = [];
  const deletedObjects: string[] = [];

  const expenseRepository = {
    findById: async () => expense,
    delete: async () => undefined,
  } as unknown as ExpenseRepository;

  const invoiceRepository = {
    findById: async () => ({ id: "inv-1", isClosed: false }) as ICardInvoice,
    updateBalance: async (invoiceId: string, delta: number) => {
      balanceDeltas.push([invoiceId, delta]);
    },
    applyAdvance: async (invoiceId: string, delta: number) => {
      advanceDeltas.push([invoiceId, delta]);
    },
  } as unknown as InvoiceRepository;

  const s3Service = {
    deleteObject: async (key: string) => {
      deletedObjects.push(key);
    },
  } as unknown as S3Service;

  return {
    useCase: new DeleteExpenseUseCase(expenseRepository, invoiceRepository, s3Service),
    balanceDeltas,
    advanceDeltas,
    deletedObjects,
  };
};

test("deleting a regular expense subtracts it from the invoice balance", async () => {
  const { useCase, balanceDeltas, advanceDeltas } = buildUseCase({
    id: "exp-1",
    amount: 100,
    type: ExpenseTypeEnum.EXPENSE,
    cardInvoiceId: "inv-1",
  } as IExpense);

  await useCase.execute({ id: "exp-1", userId: "user-1" });

  assert.deepEqual(balanceDeltas, [["inv-1", -100]]);
  assert.deepEqual(advanceDeltas, []);
});

test("deleting an advance gives the balance back and clears the advance", async () => {
  const { useCase, balanceDeltas, advanceDeltas } = buildUseCase({
    id: "adv-1",
    amount: 250,
    type: ExpenseTypeEnum.ADVANCE,
    cardInvoiceId: "inv-1",
  } as IExpense);

  await useCase.execute({ id: "adv-1", userId: "user-1" });

  assert.deepEqual(advanceDeltas, [["inv-1", -250]]);
  assert.deepEqual(balanceDeltas, []);
});

test("deleting an expense also removes its receipt from storage", async () => {
  const { useCase, deletedObjects } = buildUseCase({
    id: "exp-2",
    amount: 40,
    type: ExpenseTypeEnum.EXPENSE,
    cardInvoiceId: "inv-1",
    receipt: "receipts/user/nota.pdf",
  } as IExpense);

  await useCase.execute({ id: "exp-2", userId: "user-1" });

  assert.deepEqual(deletedObjects, ["receipts/user/nota.pdf"]);
});

test("deleting an expense without receipt touches no storage", async () => {
  const { useCase, deletedObjects } = buildUseCase({
    id: "exp-3",
    amount: 40,
    type: ExpenseTypeEnum.EXPENSE,
    cardInvoiceId: "inv-1",
  } as IExpense);

  await useCase.execute({ id: "exp-3", userId: "user-1" });

  assert.deepEqual(deletedObjects, []);
});
