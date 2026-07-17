import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

import type { BudgetRepository } from "../../src/repositories/budget.repository";
import type { UpsertBudgetInput } from "../../src/use-cases/budgets/upsert-budget.use-case";

type Invoice = { id: string; bank: string; closingDate: Date; userId: string };

function makeRepo(overrides: Record<string, unknown>): BudgetRepository {
  const base = {
    findInvoices: async () => [],
    upsert: async () => ({ id: "budget-1" }),
  };
  return { ...base, ...overrides } as unknown as BudgetRepository;
}

async function loadUseCase() {
  const { UpsertBudgetUseCase } = await import("../../src/use-cases/budgets/upsert-budget.use-case");
  return UpsertBudgetUseCase;
}

const baseInput: UpsertBudgetInput = {
  userId: "user-1",
  category: "Alimentação",
  amount: 800,
  month: 7,
  year: 2026,
  invoiceIds: ["inv-1"],
};

test("rejects empty invoice list", async () => {
  const UpsertBudgetUseCase = await loadUseCase();
  const useCase = new UpsertBudgetUseCase(makeRepo({}));
  await assert.rejects(
    () => useCase.execute({ ...baseInput, invoiceIds: [] }),
    /pelo menos uma fatura/,
  );
});

test("rejects when an invoice is not found", async () => {
  const UpsertBudgetUseCase = await loadUseCase();
  const invoices: Invoice[] = [
    { id: "inv-1", bank: "nubank", closingDate: new Date("2026-07-10T00:00:00.000Z"), userId: "user-1" },
  ];
  const useCase = new UpsertBudgetUseCase(makeRepo({ findInvoices: async () => invoices }));
  await assert.rejects(
    () => useCase.execute({ ...baseInput, invoiceIds: ["inv-1", "inv-2"] }),
    /não encontradas/,
  );
});

test("rejects two invoices from the same bank", async () => {
  const UpsertBudgetUseCase = await loadUseCase();
  const invoices: Invoice[] = [
    { id: "inv-1", bank: "nubank", closingDate: new Date("2026-07-10T00:00:00.000Z"), userId: "user-1" },
    { id: "inv-2", bank: "nubank", closingDate: new Date("2026-07-12T00:00:00.000Z"), userId: "user-1" },
  ];
  const useCase = new UpsertBudgetUseCase(makeRepo({ findInvoices: async () => invoices }));
  await assert.rejects(
    () => useCase.execute({ ...baseInput, invoiceIds: ["inv-1", "inv-2"] }),
    /mesmo banco/,
  );
});

test("rejects invoices from different months", async () => {
  const UpsertBudgetUseCase = await loadUseCase();
  const invoices: Invoice[] = [
    { id: "inv-1", bank: "nubank", closingDate: new Date("2026-07-10T00:00:00.000Z"), userId: "user-1" },
    { id: "inv-2", bank: "itau", closingDate: new Date("2026-08-10T00:00:00.000Z"), userId: "user-1" },
  ];
  const useCase = new UpsertBudgetUseCase(makeRepo({ findInvoices: async () => invoices }));
  await assert.rejects(
    () => useCase.execute({ ...baseInput, invoiceIds: ["inv-1", "inv-2"] }),
    /mesmo mês/,
  );
});

test("rejects when invoice period does not match budget month/year", async () => {
  const UpsertBudgetUseCase = await loadUseCase();
  const invoices: Invoice[] = [
    { id: "inv-1", bank: "nubank", closingDate: new Date("2026-08-10T00:00:00.000Z"), userId: "user-1" },
  ];
  const useCase = new UpsertBudgetUseCase(makeRepo({ findInvoices: async () => invoices }));
  await assert.rejects(
    () => useCase.execute({ ...baseInput, month: 7, year: 2026 }),
    /não pertencem ao período do orçamento/,
  );
});

test("accepts when invoice period matches budget month/year", async () => {
  const UpsertBudgetUseCase = await loadUseCase();
  const invoices: Invoice[] = [
    { id: "inv-1", bank: "nubank", closingDate: new Date("2026-07-10T00:00:00.000Z"), userId: "user-1" },
  ];
  let upsertArgs: unknown = null;
  const repo = makeRepo({
    findInvoices: async () => invoices,
    upsert: async (...args: unknown[]) => {
      upsertArgs = args;
      return { id: "budget-1" };
    },
  });
  const useCase = new UpsertBudgetUseCase(repo);
  const result = await useCase.execute({ ...baseInput, month: 7, year: 2026 });
  assert.equal(result.id, "budget-1");
  assert.ok(Array.isArray(upsertArgs));
});
