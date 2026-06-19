import { Injectable, Logger } from "@nestjs/common";
import type { Budget } from "../../generated/prisma/client/client";
import { BudgetRepository } from "../../repositories/budget.repository";
import { AppError } from "../../utils/app-error";

export type DeleteBudgetInput = { id: string; userId: string };

@Injectable()
export class DeleteBudgetUseCase {
  private readonly logger = new Logger(DeleteBudgetUseCase.name);

  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: DeleteBudgetInput): Promise<Budget> {
    this.logger.log({ input }, "DeleteBudgetUseCase.execute");

    const budget = await this.budgetRepository.findById(input.id);
    if (!budget) throw new AppError("Budget not found", 404);
    if (budget.userId !== input.userId) throw new AppError("Unauthorized", 403);

    const result = await this.budgetRepository.delete(input.id);
    this.logger.log({ id: input.id }, "DeleteBudgetUseCase.execute done");
    return result;
  }
}
