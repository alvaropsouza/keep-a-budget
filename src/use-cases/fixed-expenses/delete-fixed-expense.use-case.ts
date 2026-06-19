import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { AppError } from "../../utils/app-error";

export type DeleteFixedExpenseInput = { id: string; userId: string };

@Injectable()
export class DeleteFixedExpenseUseCase {
  private readonly logger = new Logger(DeleteFixedExpenseUseCase.name);

  constructor(private readonly fixedExpenseRepository: FixedExpenseRepository) {}

  async execute(input: DeleteFixedExpenseInput): Promise<void> {
    this.logger.log({ input }, "DeleteFixedExpenseUseCase.execute");

    const existing = await this.fixedExpenseRepository.findById(input.id);
    if (!existing) throw new AppError("Resource not found", 404);
    if (existing.userId && existing.userId !== input.userId) {
      throw new AppError("Unauthorized to delete this fixed expense", 403);
    }

    await this.fixedExpenseRepository.delete(input.id);
    this.logger.log({ id: input.id }, "DeleteFixedExpenseUseCase.execute done");
  }
}
