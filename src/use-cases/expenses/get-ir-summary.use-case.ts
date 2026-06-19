import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";

export type GetIrSummaryInput = { year: number; userId: string };

export type IrCategorySummary = {
  category: string;
  total: number;
  count: number;
  missingReceiptCount: number;
};

@Injectable()
export class GetIrSummaryUseCase {
  private readonly logger = new Logger(GetIrSummaryUseCase.name);

  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(input: GetIrSummaryInput): Promise<IrCategorySummary[]> {
    this.logger.log({ input }, "GetIrSummaryUseCase.execute");

    const expenses = await this.expenseRepository.findIrExpenses(input.year, input.userId);
    const byCategory = new Map<string, IrCategorySummary>();

    for (const expense of expenses) {
      const existing = byCategory.get(expense.category) ?? {
        category: expense.category,
        total: 0,
        count: 0,
        missingReceiptCount: 0,
      };
      existing.total += expense.amount;
      existing.count += 1;
      if (!expense.receipt) existing.missingReceiptCount += 1;
      byCategory.set(expense.category, existing);
    }

    const result = [...byCategory.values()].sort((a, b) => b.total - a.total);
    this.logger.log({ count: result.length }, "GetIrSummaryUseCase.execute done");
    return result;
  }
}
