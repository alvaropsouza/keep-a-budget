import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../errors/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";

export type DeleteExpenseInput = { id: string; userId: string };

@Injectable()
export class DeleteExpenseUseCase {
  private readonly logger = new Logger(DeleteExpenseUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteExpenseInput): Promise<void> {
    this.logger.log({ input }, "DeleteExpenseUseCase.execute");

    const receipt = await runWithTransaction(async (tx) => {
      const expense = await this.expenseRepository.findById(input.id, input.userId, tx);
      if (!expense) throw new AppError("Resource not found", 404);

      if (expense.cardInvoiceId) {
        const invoice = await this.invoiceRepository.findById(expense.cardInvoiceId.toString(), undefined, tx);
        if (invoice?.isClosed) {
          throw new AppError("Cannot delete expenses from a closed invoice. Please reopen the invoice first.", 400);
        }
      }

      await this.expenseRepository.delete(input.id, tx);

      if (expense.cardInvoiceId) {
        if (expense.type === ExpenseTypeEnum.ADVANCE) {
          await this.invoiceRepository.applyAdvance(expense.cardInvoiceId, -expense.amount, tx);
        } else {
          await this.invoiceRepository.updateBalance(expense.cardInvoiceId, -expense.amount, tx);
        }
      }

      return expense.receipt;
    }, { operationName: "expense.delete", metadata: { expenseId: input.id } });

    if (receipt) await this.deleteReceiptFile(receipt, input.id);

    this.logger.log({ id: input.id }, "DeleteExpenseUseCase.execute done");
  }

  private async deleteReceiptFile(receipt: string, expenseId: string): Promise<void> {
    try {
      await this.s3Service.deleteObject(receipt);
    } catch (err) {
      this.logger.error({ err, expenseId }, "Failed to delete expense receipt from S3");
    }
  }
}
