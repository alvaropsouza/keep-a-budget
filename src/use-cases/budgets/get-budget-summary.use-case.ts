import { Injectable, Logger } from "@nestjs/common";
import { BudgetRepository } from "../../repositories/budget.repository";

export type GetBudgetSummaryInput = { userId: string; month: number; year: number };

export type BudgetSummaryItem = {
  id: string;
  category: string;
  budgetAmount: number;
  spent: number;
  percentage: number;
  banks: string[];
  month: number;
  year: number;
  closed: boolean;
  partiallyClosed: boolean;
};

@Injectable()
export class GetBudgetSummaryUseCase {
  private readonly logger = new Logger(GetBudgetSummaryUseCase.name);

  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: GetBudgetSummaryInput): Promise<BudgetSummaryItem[]> {
    this.logger.log({ input }, "GetBudgetSummaryUseCase.execute");

    const budgets = await this.budgetRepository.findSummaryRows(input.userId, input.month, input.year);
    if (budgets.length === 0) return [];

    const allInvoiceIds = [...new Set(budgets.flatMap((b) => b.cardInvoices.map((ci) => ci.cardInvoiceId)))];
    const categories = budgets.map((b) => b.category);

    const expenses = await this.budgetRepository.findExpenseAmountsByInvoicesAndCategories(
      input.userId,
      allInvoiceIds,
      categories,
    );

    const result = budgets.map((b) => {
      const invoiceSet = new Set(b.cardInvoices.map((ci) => ci.cardInvoiceId));
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
        month: b.month,
        year: b.year,
        closed,
        partiallyClosed,
      };
    });

    this.logger.log({ count: result.length }, "GetBudgetSummaryUseCase.execute done");
    return result;
  }
}
