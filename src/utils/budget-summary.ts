export type BudgetSummaryRow = {
  id: string;
  category: string;
  amount: unknown;
  month: number;
  year: number;
  cardInvoices: {
    cardInvoiceId: string;
    bank: string;
    cardInvoice: { isClosed: boolean };
  }[];
};

export type BudgetExpenseAmount = {
  category: string;
  amount: unknown;
  cardInvoiceId: string | null;
};

export type BudgetSummaryItem = {
  id: string;
  category: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
  banks: string[];
  invoiceIds: string[];
  month: number;
  year: number;
  closed: boolean;
  partiallyClosed: boolean;
};

export function computeBudgetSummary(
  budgets: BudgetSummaryRow[],
  expenses: BudgetExpenseAmount[],
): BudgetSummaryItem[] {
  return budgets.map((b) => {
    const invoiceIds = b.cardInvoices.map((ci) => ci.cardInvoiceId);
    const invoiceSet = new Set(invoiceIds);
    const spent = expenses
      .filter((e) => e.cardInvoiceId != null && invoiceSet.has(e.cardInvoiceId) && e.category === b.category)
      .reduce((acc, e) => acc + Number(e.amount), 0);
    const budgetAmount = Number(b.amount);
    const hasInvoices = b.cardInvoices.length > 0;
    const closed = hasInvoices && b.cardInvoices.every((ci) => ci.cardInvoice.isClosed);
    const partiallyClosed =
      hasInvoices && !closed && b.cardInvoices.some((ci) => ci.cardInvoice.isClosed);
    return {
      id: b.id,
      category: b.category,
      budgetAmount,
      spent,
      percentage: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
      banks: b.cardInvoices.map((ci) => ci.bank),
      invoiceIds,
      month: b.month,
      year: b.year,
      closed,
      partiallyClosed,
    };
  });
}
