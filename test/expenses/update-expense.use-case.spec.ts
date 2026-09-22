import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/config/prisma";
import { UpdateExpenseUseCase } from "../../src/use-cases/expenses/update-expense.use-case";
import type { ExpenseRepository, UpdateExpenseData } from "../../src/repositories/expense.repository";
import type { InvoiceRepository } from "../../src/repositories/invoice.repository";
import type { PaymentMethodRepository } from "../../src/repositories/payment-method.repository";
import type { IExpense } from "../../src/interfaces/expense";
import type { ICardInvoice } from "../../src/interfaces/card-invoice";
import type { IPaymentMethod } from "../../src/interfaces/payment-method";
import { PaymentMethodTypeEnum } from "../../src/enums/payment-method-type.enum";

type TransactionRunner = <T>(operation: (tx: unknown) => Promise<T>) => Promise<T>;

const runInline: TransactionRunner = (operation) => operation({});
Object.defineProperty(prisma, "$transaction", { value: runInline, configurable: true });

const existing = {
  id: "exp-1",
  userId: "user-1",
  bank: "Nubank",
  amount: 100,
  date: new Date("2026-09-20T00:00:00.000Z"),
  cardInvoiceId: "inv-old",
} as IExpense;

const cardMethod = {
  name: "Nubank",
  type: PaymentMethodTypeEnum.CREDIT_CARD,
  isActive: true,
  closingDay: 10,
  dueDay: 17,
} as IPaymentMethod;

const buildUseCase = (targetInvoice: ICardInvoice, paymentMethod: IPaymentMethod | null = cardMethod) => {
  const balanceDeltas: Array<[string, number]> = [];
  let updatePayload: UpdateExpenseData | null = null;

  const expenseRepository = {
    findById: async () => existing,
    update: async (id: string, data: UpdateExpenseData) => {
      updatePayload = data;
      return {
        ...existing,
        ...data,
        cardInvoiceId: data.cardInvoiceId !== undefined ? data.cardInvoiceId : existing.cardInvoiceId,
      };
    },
  } as unknown as ExpenseRepository;

  const invoiceRepository = {
    findById: async () => ({ id: "inv-old", isClosed: false }) as ICardInvoice,
    ensureForDate: async () => targetInvoice,
    updateBalance: async (invoiceId: string, delta: number) => {
      balanceDeltas.push([invoiceId, delta]);
    },
  } as unknown as InvoiceRepository;

  const paymentMethodRepository = {
    findByName: async () => paymentMethod,
  } as unknown as PaymentMethodRepository;

  return {
    useCase: new UpdateExpenseUseCase(expenseRepository, invoiceRepository, paymentMethodRepository),
    balanceDeltas,
    getUpdatePayload: () => updatePayload,
  };
};

test("moving expense date to another invoice transfers the balance", async () => {
  const { useCase, balanceDeltas, getUpdatePayload } = buildUseCase({
    id: "inv-new",
    isClosed: false,
  } as ICardInvoice);

  const updated = await useCase.execute({
    id: "exp-1",
    userId: "user-1",
    date: new Date("2026-11-05T00:00:00.000Z"),
    amount: 150,
  });

  assert.equal(updated.cardInvoiceId, "inv-new");
  assert.equal(getUpdatePayload()?.cardInvoiceId, "inv-new");
  assert.deepEqual(balanceDeltas, [
    ["inv-old", -100],
    ["inv-new", 150],
  ]);
});

test("same date keeps the invoice and applies only the amount delta", async () => {
  const { useCase, balanceDeltas } = buildUseCase({ id: "inv-new", isClosed: false } as ICardInvoice);

  await useCase.execute({
    id: "exp-1",
    userId: "user-1",
    date: new Date("2026-09-20T00:00:00.000Z"),
    amount: 130,
  });

  assert.deepEqual(balanceDeltas, [["inv-old", 30]]);
});

test("moving to a closed invoice is rejected", async () => {
  const { useCase, balanceDeltas } = buildUseCase({ id: "inv-new", isClosed: true } as ICardInvoice);

  await assert.rejects(
    useCase.execute({ id: "exp-1", userId: "user-1", date: new Date("2026-11-05T00:00:00.000Z") }),
    /fatura de destino/i,
  );
  assert.deepEqual(balanceDeltas, []);
});

test("changing only the bank moves the expense to the new card invoice", async () => {
  const { useCase, balanceDeltas, getUpdatePayload } = buildUseCase({
    id: "inv-other-bank",
    isClosed: false,
  } as ICardInvoice);

  const updated = await useCase.execute({ id: "exp-1", userId: "user-1", bank: "XP" });

  assert.equal(updated.cardInvoiceId, "inv-other-bank");
  assert.equal(getUpdatePayload()?.cardInvoiceId, "inv-other-bank");
  assert.deepEqual(balanceDeltas, [
    ["inv-old", -100],
    ["inv-other-bank", 100],
  ]);
});

test("changing the bank to a non-card method detaches the expense from the invoice", async () => {
  const { useCase, balanceDeltas, getUpdatePayload } = buildUseCase(
    { id: "inv-new", isClosed: false } as ICardInvoice,
    { name: "Pix", type: PaymentMethodTypeEnum.PIX, isActive: true } as IPaymentMethod,
  );

  const updated = await useCase.execute({ id: "exp-1", userId: "user-1", bank: "Pix" });

  assert.equal(updated.cardInvoiceId, null);
  assert.equal(getUpdatePayload()?.cardInvoiceId, null);
  assert.deepEqual(balanceDeltas, [["inv-old", -100]]);
});

test("changing the bank to an unknown payment method is rejected", async () => {
  const { useCase, balanceDeltas } = buildUseCase({ id: "inv-new", isClosed: false } as ICardInvoice, null);

  await assert.rejects(
    useCase.execute({ id: "exp-1", userId: "user-1", bank: "Fantasma" }),
    /não cadastrada/i,
  );
  assert.deepEqual(balanceDeltas, []);
});
