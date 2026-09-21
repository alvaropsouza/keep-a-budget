import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { AppError } from "../../errors/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";

export type DeleteFixedExpenseInput = { id: string; userId: string };
export type DeleteFixedExpenseResult = { removedExpenses: number };

@Injectable()
export class DeleteFixedExpenseUseCase {
  private readonly logger = new Logger(DeleteFixedExpenseUseCase.name);

  constructor(
    private readonly fixedExpenseRepository: FixedExpenseRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(input: DeleteFixedExpenseInput): Promise<DeleteFixedExpenseResult> {
    this.logger.log({ input }, "DeleteFixedExpenseUseCase.execute");

    const existing = await this.fixedExpenseRepository.findById(input.id);
    if (!existing) throw new AppError("Resource not found", 404);
    if (existing.userId && existing.userId !== input.userId) {
      throw new AppError("Unauthorized to delete this fixed expense", 403);
    }

    const removedExpenses = await runWithTransaction(
      async (tx) => {
        const linked = await this.expenseRepository.findRemovableByFixedExpense(input.id, tx);

        for (const expense of linked) {
          await this.expenseRepository.delete(expense.id, tx);
          if (expense.cardInvoiceId) {
            await this.invoiceRepository.updateBalance(expense.cardInvoiceId, -expense.amount, tx);
          }
        }

        await this.fixedExpenseRepository.delete(input.id, tx);
        return linked.length;
      },
      { operationName: "fixedExpense.delete", metadata: { fixedExpenseId: input.id } },
    );

    this.logger.log({ id: input.id, removedExpenses }, "DeleteFixedExpenseUseCase.execute done");
    return { removedExpenses };
  }
}
