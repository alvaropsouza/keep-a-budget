import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { AppError } from "../../utils/app-error";
import type { IExpense } from "../../interfaces/expense";

export type DeleteExpenseReceiptInput = { id: string; userId: string };

@Injectable()
export class DeleteExpenseReceiptUseCase {
  private readonly logger = new Logger(DeleteExpenseReceiptUseCase.name);

  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(input: DeleteExpenseReceiptInput): Promise<IExpense> {
    this.logger.log({ input }, "DeleteExpenseReceiptUseCase.execute");

    const existing = await this.expenseRepository.findById(input.id, input.userId);
    if (!existing) throw new AppError("Resource not found", 404);

    const result = await this.expenseRepository.update(input.id, { receipt: null });
    if (!result) throw new AppError("Resource not found", 404);

    this.logger.log({ id: input.id }, "DeleteExpenseReceiptUseCase.execute done");
    return result;
  }
}
