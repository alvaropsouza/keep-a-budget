import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import type { IExpense } from "../../interfaces/expense";

export type GetExpenseByIdInput = { id: string; userId: string };

@Injectable()
export class GetExpenseByIdUseCase {
  private readonly logger = new Logger(GetExpenseByIdUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: GetExpenseByIdInput): Promise<IExpense> {
    this.logger.log({ input }, "GetExpenseByIdUseCase.execute");

    const expense = await this.expenseRepository.findById(input.id, input.userId);
    if (!expense) throw new AppError("Resource not found", 404);

    if (expense.receipt) {
      try {
        const signedUrl = await this.s3Service.getSignedUrl(expense.receipt);
        return { ...expense, receipt: signedUrl };
      } catch (err) {
        this.logger.error({ err, expenseId: expense.id }, "Failed to sign receipt URL");
      }
    }

    this.logger.log({ id: expense.id }, "GetExpenseByIdUseCase.execute done");
    return expense;
  }
}
