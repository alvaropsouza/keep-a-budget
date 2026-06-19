import { Injectable, Logger } from "@nestjs/common";
import { BudgetRepository } from "../../repositories/budget.repository";

export type ListBudgetsInput = { userId: string; month: number; year: number };

@Injectable()
export class ListBudgetsUseCase {
  private readonly logger = new Logger(ListBudgetsUseCase.name);

  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: ListBudgetsInput) {
    this.logger.log({ input }, "ListBudgetsUseCase.execute");
    const result = await this.budgetRepository.findMany(input.userId, input.month, input.year);
    this.logger.log({ count: result.length }, "ListBudgetsUseCase.execute done");
    return result;
  }
}
