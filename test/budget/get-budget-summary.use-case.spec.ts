import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";

import type { BudgetRepository } from "../../src/repositories/budget.repository";

type SummaryRow = {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  cardInvoices: { cardInvoiceId: string; bank: string; cardInvoice: { isClosed: boolean } }[];
};
type ExpenseRow = { category: string; amount: number; cardInvoiceId: string | null };

function makeRepo(rows: SummaryRow[], expenses: ExpenseRow[]): BudgetRepository {
  return {
    findSummaryRows: async () => rows,
    findExpenseAmountsByInvoicesAndCategories: async () => expenses,
  } as unknown as BudgetRepository;
}

async function loadUseCase() {
  const { GetBudgetSummaryUseCase } = await import(
    "../../src/use-cases/budgets/get-budget-summary.use-case"
  );
  return GetBudgetSummaryUseCase;
}

const input = { userId: "user-1", month: 7, year: 2026 };

test("returns empty array when no budgets", async () => {
  const GetBudgetSummaryUseCase = await loadUseCase();
  const useCase = new GetBudgetSummaryUseCase(makeRepo([], []));
  assert.deepEqual(await useCase.execute(input), []);
});

test("computes spent, percentage and echoes budget period", async () => {
  const GetBudgetSummaryUseCase = await loadUseCase();
  const rows: SummaryRow[] = [
    {
      id: "b1",
      category: "Alimentação",
      amount: 800,
      month: 7,
      year: 2026,
      cardInvoices: [{ cardInvoiceId: "inv-1", bank: "nubank", cardInvoice: { isClosed: false } }],
    },
  ];
  const expenses: ExpenseRow[] = [
    { category: "Alimentação", amount: 200, cardInvoiceId: "inv-1" },
    { category: "Alimentação", amount: 200, cardInvoiceId: "inv-1" },
  ];
  const [item] = await new GetBudgetSummaryUseCase(makeRepo(rows, expenses)).execute(input);
  assert.equal(item.spent, 400);
  assert.equal(item.budgetAmount, 800);
  assert.equal(item.percentage, 50);
  assert.equal(item.month, 7);
  assert.equal(item.year, 2026);
  assert.equal(item.closed, false);
  assert.equal(item.partiallyClosed, false);
});

test("marks budget closed when every linked invoice is closed", async () => {
  const GetBudgetSummaryUseCase = await loadUseCase();
  const rows: SummaryRow[] = [
    {
      id: "b1",
      category: "Alimentação",
      amount: 800,
      month: 7,
      year: 2026,
      cardInvoices: [
        { cardInvoiceId: "inv-1", bank: "nubank", cardInvoice: { isClosed: true } },
        { cardInvoiceId: "inv-2", bank: "itau", cardInvoice: { isClosed: true } },
      ],
    },
  ];
  const [item] = await new GetBudgetSummaryUseCase(makeRepo(rows, [])).execute(input);
  assert.equal(item.closed, true);
  assert.equal(item.partiallyClosed, false);
});

test("marks budget partiallyClosed when some but not all invoices closed", async () => {
  const GetBudgetSummaryUseCase = await loadUseCase();
  const rows: SummaryRow[] = [
    {
      id: "b1",
      category: "Alimentação",
      amount: 800,
      month: 7,
      year: 2026,
      cardInvoices: [
        { cardInvoiceId: "inv-1", bank: "nubank", cardInvoice: { isClosed: true } },
        { cardInvoiceId: "inv-2", bank: "itau", cardInvoice: { isClosed: false } },
      ],
    },
  ];
  const [item] = await new GetBudgetSummaryUseCase(makeRepo(rows, [])).execute(input);
  assert.equal(item.closed, false);
  assert.equal(item.partiallyClosed, true);
});

test("spent only counts expenses of the budget's own invoices and category", async () => {
  const GetBudgetSummaryUseCase = await loadUseCase();
  const rows: SummaryRow[] = [
    {
      id: "b1",
      category: "Alimentação",
      amount: 800,
      month: 7,
      year: 2026,
      cardInvoices: [{ cardInvoiceId: "inv-1", bank: "nubank", cardInvoice: { isClosed: false } }],
    },
  ];
  const expenses: ExpenseRow[] = [
    { category: "Alimentação", amount: 100, cardInvoiceId: "inv-1" },
    { category: "Alimentação", amount: 999, cardInvoiceId: "inv-2" },
    { category: "Transporte", amount: 999, cardInvoiceId: "inv-1" },
    { category: "Alimentação", amount: 50, cardInvoiceId: null },
  ];
  const [item] = await new GetBudgetSummaryUseCase(makeRepo(rows, expenses)).execute(input);
  assert.equal(item.spent, 100);
});
