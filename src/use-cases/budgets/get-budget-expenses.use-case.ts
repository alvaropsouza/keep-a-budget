import { Injectable, Logger } from "@nestjs/common";
import { BudgetRepository } from "../../repositories/budget.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import type { IExpense } from "../../interfaces/expense";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";

export type GetBudgetExpensesInput = {
  userId: string;
  category: string;
  month: number;
  year: number;
};

@Injectable()
export class GetBudgetExpensesUseCase {
  private readonly logger = new Logger(GetBudgetExpensesUseCase.name);

  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: GetBudgetExpensesInput): Promise<IExpense[]> {
    this.logger.log({ input }, "GetBudgetExpensesUseCase.execute");

    const budget = await this.budgetRepository.findByKey(
      input.userId,
      input.category,
      input.month,
      input.year,
    );
    if (!budget) throw new AppError("Budget não encontrado", 404);

    const invoiceIds = budget.cardInvoices.map((ci) => ci.cardInvoiceId);
    const rows = await this.budgetRepository.findExpensesByInvoicesAndCategory(
      input.userId,
      invoiceIds,
      input.category,
    );

    const toNumber = (v: unknown) => (v == null ? 0 : Number(v));

    const result = await Promise.all(
      rows.map(async (row): Promise<IExpense> => {
        let receipt = row.receipt ?? undefined;
        if (receipt) {
          try {
            receipt = await this.s3Service.getSignedUrl(receipt);
          } catch {
            /* keep original key on sign failure */
          }
        }
        return {
          id: row.id,
          _id: row.id,
          userId: row.userId ?? undefined,
          bank: row.bank,
          type: row.type as ExpenseTypeEnum,
          category: row.category,
          date: new Date(row.date),
          amount: toNumber(row.amount),
          description: row.description ?? "",
          receipt,
          irDeductible: row.irDeductible ?? false,
          installment:
            row.installmentCurrent || row.installmentTotal
              ? { current: row.installmentCurrent ?? undefined, total: row.installmentTotal ?? undefined }
              : undefined,
          cardInvoiceId: row.cardInvoiceId,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }),
    );

    this.logger.log({ count: result.length }, "GetBudgetExpensesUseCase.execute done");
    return result;
  }
}
