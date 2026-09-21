import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository, UpdateExpenseData } from "../../repositories/expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { AppError } from "../../errors/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import type { IExpense } from "../../interfaces/expense";

export type UpdateExpenseInput = UpdateExpenseData & { id: string; userId: string };

@Injectable()
export class UpdateExpenseUseCase {
  private readonly logger = new Logger(UpdateExpenseUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(input: UpdateExpenseInput): Promise<IExpense> {
    this.logger.log({ id: input.id, userId: input.userId }, "UpdateExpenseUseCase.execute");

    const { id, userId, ...data } = input;

    const result = await runWithTransaction(async (tx) => {
      const old = await this.expenseRepository.findById(id, userId, tx);
      if (!old) throw new AppError("Resource not found", 404);

      if (old.cardInvoiceId) {
        const invoice = await this.invoiceRepository.findById(old.cardInvoiceId.toString(), undefined, tx);
        if (invoice?.isClosed) {
          throw new AppError("Cannot update expenses in a closed invoice. Please reopen the invoice first.", 400);
        }
      }

      const isMovingDate = data.date !== undefined && data.date.getTime() !== old.date.getTime();
      let targetInvoiceId = old.cardInvoiceId;

      if (isMovingDate && old.cardInvoiceId) {
        const target = await this.invoiceRepository.ensureForDate(data.bank ?? old.bank, data.date!, userId, tx);
        if (target.isClosed) {
          throw new AppError("A fatura da nova data está fechada. Reabra a fatura antes de mover a despesa.", 400);
        }
        targetInvoiceId = target.id;
      }

      const updated = await this.expenseRepository.update(
        id,
        targetInvoiceId === old.cardInvoiceId ? data : { ...data, cardInvoiceId: targetInvoiceId },
        tx,
      );
      if (!updated) throw new AppError("Resource not found", 404);

      const newAmount = data.amount ?? old.amount;

      if (targetInvoiceId !== old.cardInvoiceId) {
        if (old.cardInvoiceId) await this.invoiceRepository.updateBalance(old.cardInvoiceId, -old.amount, tx);
        if (targetInvoiceId) await this.invoiceRepository.updateBalance(targetInvoiceId, newAmount, tx);
      } else if (data.amount !== undefined && data.amount !== old.amount && updated.cardInvoiceId) {
        await this.invoiceRepository.updateBalance(updated.cardInvoiceId, data.amount - old.amount, tx);
      }

      return updated;
    }, { operationName: "expense.update", metadata: { expenseId: id } });

    this.logger.log({ id }, "UpdateExpenseUseCase.execute done");
    return result;
  }
}
