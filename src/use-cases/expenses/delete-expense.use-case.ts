import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { InvoiceService } from "../../services/invoice.service";
import { AppError } from "../../utils/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";

export type DeleteExpenseInput = { id: string; userId: string };

@Injectable()
export class DeleteExpenseUseCase {
  private readonly logger = new Logger(DeleteExpenseUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceService: InvoiceService,
  ) {}

  async execute(input: DeleteExpenseInput): Promise<void> {
    this.logger.log({ input }, "DeleteExpenseUseCase.execute");

    await runWithTransaction(async (tx) => {
      const expense = await this.expenseRepository.findById(input.id, input.userId, tx);
      if (!expense) throw new AppError("Resource not found", 404);

      if (expense.cardInvoiceId) {
        const invoice = await this.invoiceService.findById(expense.cardInvoiceId.toString(), undefined, tx);
        if (invoice?.isClosed) {
          throw new AppError("Cannot delete expenses from a closed invoice. Please reopen the invoice first.", 400);
        }
      }

      await this.expenseRepository.delete(input.id, tx);

      if (expense.cardInvoiceId) {
        await this.invoiceService.updateBalance(expense.cardInvoiceId, -expense.amount, tx);
      }
    }, { operationName: "expense.delete", metadata: { expenseId: input.id } });

    this.logger.log({ id: input.id }, "DeleteExpenseUseCase.execute done");
  }
}
