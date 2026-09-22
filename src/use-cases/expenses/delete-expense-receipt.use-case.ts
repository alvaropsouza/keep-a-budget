import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../errors/app-error";
import type { IExpense } from "../../interfaces/expense";

export type DeleteExpenseReceiptInput = { id: string; userId: string };

@Injectable()
export class DeleteExpenseReceiptUseCase {
  private readonly logger = new Logger(DeleteExpenseReceiptUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteExpenseReceiptInput): Promise<IExpense> {
    this.logger.log({ input }, "DeleteExpenseReceiptUseCase.execute");

    const existing = await this.expenseRepository.findById(input.id, input.userId);
    if (!existing) throw new AppError("Resource not found", 404);

    const result = await this.expenseRepository.update(input.id, { receipt: null });
    if (!result) throw new AppError("Resource not found", 404);

    if (existing.receipt) {
      try {
        await this.s3Service.deleteObject(existing.receipt);
      } catch (err) {
        this.logger.error({ err, id: input.id }, "Failed to delete expense receipt from S3");
      }
    }

    this.logger.log({ id: input.id }, "DeleteExpenseReceiptUseCase.execute done");
    return result;
  }
}
