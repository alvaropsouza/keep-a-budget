import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import type { IFixedExpense } from "../../interfaces/fixed-expense";
import type { FixedExpenseQueryParamsDto } from "../../dto/fixed-expense.dto";

export type ListFixedExpensesInput = { userId: string; query: FixedExpenseQueryParamsDto };

@Injectable()
export class ListFixedExpensesUseCase {
  private readonly logger = new Logger(ListFixedExpensesUseCase.name);

  constructor(private readonly fixedExpenseRepository: FixedExpenseRepository) {}

  async execute(input: ListFixedExpensesInput): Promise<IFixedExpense[]> {
    this.logger.log({ input }, "ListFixedExpensesUseCase.execute");

    const isActive =
      input.query.isActive !== undefined
        ? String(input.query.isActive) === "true"
        : undefined;

    const result = await this.fixedExpenseRepository.findMany(input.userId, isActive);
    this.logger.log({ count: result.length }, "ListFixedExpensesUseCase.execute done");
    return result;
  }
}
