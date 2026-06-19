import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";
import type { IExpense } from "../../interfaces/expense";

export type ListIrExpensesInput = { year: number; userId: string };

@Injectable()
export class ListIrExpensesUseCase {
  private readonly logger = new Logger(ListIrExpensesUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: ListIrExpensesInput): Promise<IExpense[]> {
    this.logger.log({ input }, "ListIrExpensesUseCase.execute");

    const expenses = await this.expenseRepository.findIrExpenses(input.year, input.userId);

    const result = await Promise.all(
      expenses.map(async (expense) => {
        if (!expense.receipt) return expense;
        try {
          const signedUrl = await this.s3Service.getSignedUrl(expense.receipt);
          return { ...expense, receipt: signedUrl };
        } catch (err) {
          this.logger.error({ err, expenseId: expense.id }, "Failed to sign IR expense receipt URL");
          return expense;
        }
      }),
    );

    this.logger.log({ count: result.length }, "ListIrExpensesUseCase.execute done");
    return result;
  }
}
