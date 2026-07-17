import { Injectable, Logger } from "@nestjs/common";
import { BudgetRepository } from "../../repositories/budget.repository";
import { computeBudgetSummary, type BudgetSummaryItem } from "../../utils/budget-summary";
import { getBrazilTodayUtcMidnight } from "../../utils/timezone";

export type GetActiveBudgetSummaryInput = { userId: string };

@Injectable()
export class GetActiveBudgetSummaryUseCase {
  private readonly logger = new Logger(GetActiveBudgetSummaryUseCase.name);

  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: GetActiveBudgetSummaryInput): Promise<BudgetSummaryItem[]> {
    this.logger.log({ input }, "GetActiveBudgetSummaryUseCase.execute");

    const today = getBrazilTodayUtcMidnight();
    const month = today.getUTCMonth() + 1;
    const year = today.getUTCFullYear();

    const budgets = await this.budgetRepository.findActiveSummaryRows(input.userId, month, year);
    if (budgets.length === 0) return [];

    const allInvoiceIds = [...new Set(budgets.flatMap((b) => b.cardInvoices.map((ci) => ci.cardInvoiceId)))];
    const categories = [...new Set(budgets.map((b) => b.category))];

    const expenses = await this.budgetRepository.findExpenseAmountsByInvoicesAndCategories(
      input.userId,
      allInvoiceIds,
      categories,
    );

    const result = computeBudgetSummary(budgets, expenses);
    this.logger.log({ count: result.length }, "GetActiveBudgetSummaryUseCase.execute done");
    return result;
  }
}
