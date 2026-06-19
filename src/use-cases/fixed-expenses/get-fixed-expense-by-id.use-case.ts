import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { AppError } from "../../utils/app-error";
import type { IFixedExpense } from "../../interfaces/fixed-expense";

export type GetFixedExpenseByIdInput = { id: string; userId: string };

@Injectable()
export class GetFixedExpenseByIdUseCase {
  private readonly logger = new Logger(GetFixedExpenseByIdUseCase.name);

  constructor(private readonly fixedExpenseRepository: FixedExpenseRepository) {}

  async execute(input: GetFixedExpenseByIdInput): Promise<IFixedExpense> {
    this.logger.log({ input }, "GetFixedExpenseByIdUseCase.execute");

    const fixedExpense = await this.fixedExpenseRepository.findById(input.id);
    if (!fixedExpense) throw new AppError("Resource not found", 404);
    if (fixedExpense.userId !== input.userId) throw new AppError("Unauthorized to access this fixed expense", 403);

    this.logger.log({ id: fixedExpense.id }, "GetFixedExpenseByIdUseCase.execute done");
    return fixedExpense;
  }
}
