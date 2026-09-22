import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../src/config/prisma";
import { CreateInvoiceFromCsvUseCase } from "../../src/use-cases/invoices/create-invoice-from-csv.use-case";
import type { InvoiceRepository } from "../../src/repositories/invoice.repository";
import type { ExpenseRepository } from "../../src/repositories/expense.repository";
import type { PaymentMethodRepository } from "../../src/repositories/payment-method.repository";
import type { ICardInvoice } from "../../src/interfaces/card-invoice";
import type { IPaymentMethod } from "../../src/interfaces/payment-method";
import { PaymentMethodTypeEnum } from "../../src/enums/payment-method-type.enum";

type TransactionRunner = <T>(operation: (tx: unknown) => Promise<T>) => Promise<T>;

const runInline: TransactionRunner = (operation) => operation({});
Object.defineProperty(prisma, "$transaction", { value: runInline, configurable: true });

const csv = ["date,title,amount", '2026-09-10,Padaria,"214,89"'].join("\n");

const buildUseCase = (paymentMethod: IPaymentMethod | null) => {
  const createdInvoices: Array<{ bank: string }> = [];
  const createdExpenses: Array<{ bank: string }> = [];

  const invoiceRepository = {
    create: async (data: { bank: string }) => {
      createdInvoices.push(data);
      return { id: "inv-1", bank: data.bank } as ICardInvoice;
    },
    updateBalance: async () => undefined,
    findWithExpenses: async () => ({ id: "inv-1" }) as ICardInvoice,
  } as unknown as InvoiceRepository;

  const expenseRepository = {
    createMany: async (rows: Array<{ bank: string }>) => {
      createdExpenses.push(...rows);
    },
  } as unknown as ExpenseRepository;

  const paymentMethodRepository = {
    findByName: async () => paymentMethod,
  } as unknown as PaymentMethodRepository;

  return {
    useCase: new CreateInvoiceFromCsvUseCase(invoiceRepository, expenseRepository, paymentMethodRepository),
    createdInvoices,
    createdExpenses,
  };
};

const card = (name: string): IPaymentMethod =>
  ({ name, type: PaymentMethodTypeEnum.CREDIT_CARD, isActive: true }) as IPaymentMethod;

test("the invoice keeps the payment method name the user registered", async () => {
  const { useCase, createdInvoices, createdExpenses } = buildUseCase(card("Nubank"));

  await useCase.execute({
    bank: "Nubank",
    closingDate: "2026-09-30T00:00:00.000Z",
    dueDate: "2026-10-07T00:00:00.000Z",
    csvContent: csv,
    userId: "user-1",
  });

  assert.equal(createdInvoices[0].bank, "Nubank");
  assert.equal(createdExpenses[0].bank, "Nubank");
});

test("a card without a supported CSV layout is rejected", async () => {
  const { useCase, createdInvoices } = buildUseCase(card("Itaú"));

  await assert.rejects(
    useCase.execute({
      bank: "Itaú",
      closingDate: "2026-09-30T00:00:00.000Z",
      dueDate: "2026-10-07T00:00:00.000Z",
      csvContent: csv,
      userId: "user-1",
    }),
    /Nubank e XP/,
  );
  assert.deepEqual(createdInvoices, []);
});

test("an unregistered card is rejected before anything is created", async () => {
  const { useCase, createdInvoices } = buildUseCase(null);

  await assert.rejects(
    useCase.execute({
      bank: "Fantasma",
      closingDate: "2026-09-30T00:00:00.000Z",
      dueDate: "2026-10-07T00:00:00.000Z",
      csvContent: csv,
      userId: "user-1",
    }),
    /não cadastrada/i,
  );
  assert.deepEqual(createdInvoices, []);
});
