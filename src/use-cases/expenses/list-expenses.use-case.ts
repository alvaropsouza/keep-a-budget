import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository, ExpenseFilter } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";
import type { IExpense } from "../../interfaces/expense";
import type { ExpenseQueryParamsDto } from "../../dto/expense.dto";

export type ListExpensesInput = { userId: string; query: ExpenseQueryParamsDto };

@Injectable()
export class ListExpensesUseCase {
  private readonly logger = new Logger(ListExpensesUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: ListExpensesInput): Promise<IExpense[]> {
    this.logger.log({ input }, "ListExpensesUseCase.execute");

    const q = input.query;
    const filter: ExpenseFilter = {
      bank: q.bank,
      category: q.category,
      cardInvoiceId: q.cardInvoiceId,
      amountGte: q.minAmount !== undefined ? Number(q.minAmount) : undefined,
      amountLte: q.maxAmount !== undefined ? Number(q.maxAmount) : undefined,
      createdAtGte: q.createdStartDate ? new Date(q.createdStartDate) : undefined,
      createdAtLte: q.createdEndDate ? new Date(q.createdEndDate) : undefined,
      updatedAtGte: q.updatedStartDate ? new Date(q.updatedStartDate) : undefined,
      updatedAtLte: q.updatedEndDate ? new Date(q.updatedEndDate) : undefined,
    };

    const expenses = await this.expenseRepository.findMany(input.userId, filter);

    const result = await Promise.all(
      expenses.map(async (expense) => {
        if (!expense.receipt) return expense;
        try {
          const signedUrl = await this.s3Service.getSignedUrl(expense.receipt);
          return { ...expense, receipt: signedUrl };
        } catch (err) {
          this.logger.error({ err, expenseId: expense.id }, "Failed to sign receipt URL");
          return expense;
        }
      }),
    );

    this.logger.log({ count: result.length }, "ListExpensesUseCase.execute done");
    return result;
  }
}
