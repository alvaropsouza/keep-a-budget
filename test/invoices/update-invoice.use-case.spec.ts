import { test } from "node:test";
import assert from "node:assert/strict";
import { UpdateInvoiceUseCase } from "../../src/use-cases/invoices/update-invoice.use-case";
import type { InvoiceRepository } from "../../src/repositories/invoice.repository";
import type { ExpenseRepository } from "../../src/repositories/expense.repository";
import type { PaymentMethodRepository } from "../../src/repositories/payment-method.repository";
import type { ICardInvoice } from "../../src/interfaces/card-invoice";
import type { IPaymentMethod } from "../../src/interfaces/payment-method";
import { PaymentMethodTypeEnum } from "../../src/enums/payment-method-type.enum";

const existing = {
  id: "inv-1",
  bank: "Nubank",
  closingDate: new Date("2026-09-30T00:00:00.000Z"),
  dueDate: new Date("2026-10-07T00:00:00.000Z"),
} as ICardInvoice;

const buildUseCase = (paymentMethod: IPaymentMethod | null) => {
  const bankUpdates: Array<[string, string]> = [];

  const invoiceRepository = {
    findByIdOrThrow: async () => existing,
    update: async () => ({ ...existing, bank: "XP" }) as ICardInvoice,
    syncBankStatuses: async () => undefined,
  } as unknown as InvoiceRepository;

  const expenseRepository = {
    updateBankByInvoice: async (invoiceId: string, bank: string) => {
      bankUpdates.push([invoiceId, bank]);
    },
  } as unknown as ExpenseRepository;

  const paymentMethodRepository = {
    findByName: async () => paymentMethod,
  } as unknown as PaymentMethodRepository;

  return {
    useCase: new UpdateInvoiceUseCase(invoiceRepository, expenseRepository, paymentMethodRepository),
    bankUpdates,
  };
};

const card = { name: "XP", type: PaymentMethodTypeEnum.CREDIT_CARD, isActive: true } as IPaymentMethod;

test("moving an invoice to another card carries its expenses along", async () => {
  const { useCase, bankUpdates } = buildUseCase(card);

  await useCase.execute({ id: "inv-1", userId: "user-1", bank: "XP" });

  assert.deepEqual(bankUpdates, [["inv-1", "XP"]]);
});

test("a due date before the closing date is rejected", async () => {
  const { useCase, bankUpdates } = buildUseCase(card);

  await assert.rejects(
    useCase.execute({ id: "inv-1", userId: "user-1", dueDate: new Date("2026-09-20T00:00:00.000Z") }),
    /vencimento não pode ser anterior/i,
  );
  assert.deepEqual(bankUpdates, []);
});

test("moving an invoice to a non-card payment method is rejected", async () => {
  const { useCase, bankUpdates } = buildUseCase({
    name: "Pix",
    type: PaymentMethodTypeEnum.PIX,
    isActive: true,
  } as IPaymentMethod);

  await assert.rejects(useCase.execute({ id: "inv-1", userId: "user-1", bank: "Pix" }), /não é um cartão/i);
  assert.deepEqual(bankUpdates, []);
});
