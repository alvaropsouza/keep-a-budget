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

function makeRepo(rows: SummaryRow[]): { repo: BudgetRepository; calls: unknown[] } {
  const calls: unknown[] = [];
  const repo = {
    findActiveSummaryRows: async (...args: unknown[]) => {
      calls.push(args);
      return rows;
    },
    findExpenseAmountsByInvoicesAndCategories: async () => [],
  } as unknown as BudgetRepository;
  return { repo, calls };
}

async function loadUseCase() {
  const { GetActiveBudgetSummaryUseCase } = await import(
    "../../src/use-cases/budgets/get-active-budget-summary.use-case"
  );
  return GetActiveBudgetSummaryUseCase;
}

test("returns budgets across months, echoing each budget's own period", async () => {
  const GetActiveBudgetSummaryUseCase = await loadUseCase();
  const rows: SummaryRow[] = [
    {
      id: "b-jul",
      category: "Alimentação",
      amount: 250,
      month: 7,
      year: 2026,
      cardInvoices: [{ cardInvoiceId: "inv-jul", bank: "xp", cardInvoice: { isClosed: true } }],
    },
    {
      id: "b-ago",
      category: "Plantas",
      amount: 100,
      month: 8,
      year: 2026,
      cardInvoices: [{ cardInvoiceId: "inv-ago", bank: "xp", cardInvoice: { isClosed: false } }],
    },
  ];
  const { repo } = makeRepo(rows);
  const result = await new GetActiveBudgetSummaryUseCase(repo).execute({ userId: "user-1" });

  assert.equal(result.length, 2);
  const jul = result.find((r) => r.id === "b-jul");
  const ago = result.find((r) => r.id === "b-ago");
  assert.deepEqual([jul?.month, jul?.year, jul?.closed], [7, 2026, true]);
  assert.deepEqual([ago?.month, ago?.year, ago?.closed], [8, 2026, false]);
  assert.deepEqual(ago?.invoiceIds, ["inv-ago"]);
});

test("returns empty array when no active budgets", async () => {
  const GetActiveBudgetSummaryUseCase = await loadUseCase();
  const { repo } = makeRepo([]);
  assert.deepEqual(await new GetActiveBudgetSummaryUseCase(repo).execute({ userId: "user-1" }), []);
});
