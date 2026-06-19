import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { AppError } from "../../utils/app-error";
import type { IFixedExpense } from "../../interfaces/fixed-expense";
import type { UpdateFixedExpenseDto } from "../../dto/fixed-expense.dto";

export type UpdateFixedExpenseInput = UpdateFixedExpenseDto & { id: string; userId: string };

@Injectable()
export class UpdateFixedExpenseUseCase {
  private readonly logger = new Logger(UpdateFixedExpenseUseCase.name);

  constructor(private readonly fixedExpenseRepository: FixedExpenseRepository) {}

  async execute(input: UpdateFixedExpenseInput): Promise<IFixedExpense> {
    this.logger.log({ input }, "UpdateFixedExpenseUseCase.execute");

    const existing = await this.fixedExpenseRepository.findById(input.id);
    if (!existing) throw new AppError("Resource not found", 404);
    if (existing.userId && existing.userId !== input.userId) {
      throw new AppError("Unauthorized to update this fixed expense", 403);
    }

    const { id, userId, ...data } = input;
    const result = await this.fixedExpenseRepository.update(id, data);
    if (!result) throw new AppError("Resource not found", 404);

    this.logger.log({ id: result.id }, "UpdateFixedExpenseUseCase.execute done");
    return result;
  }
}
