import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { AppError } from "../../utils/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type AdvanceInvoicePaymentInput = { id: string; amount: number; userId: string };

@Injectable()
export class AdvanceInvoicePaymentUseCase {
  private readonly logger = new Logger(AdvanceInvoicePaymentUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly expenseRepository: ExpenseRepository,
  ) {}

  async execute(input: AdvanceInvoicePaymentInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id, amount: input.amount }, "AdvanceInvoicePaymentUseCase.execute");

    await runWithTransaction(async (tx) => {
      const invoice = await this.invoiceRepository.findByIdOrThrow(input.id, input.userId, tx);

      const availableBalance = invoice.balance ?? 0;

      if (input.amount > availableBalance) {
        throw new AppError("Advance amount cannot exceed available balance", 400, {
          availableBalance,
          requestedAmount: input.amount,
        });
      }

      await this.invoiceRepository.applyAdvance(input.id, input.amount, tx);

      await this.expenseRepository.create(
        {
          bank: invoice.bank,
          type: ExpenseTypeEnum.ADVANCE,
          category: "Advance",
          date: new Date(),
          amount: input.amount,
          description: "Advance payment",
          cardInvoiceId: invoice.id,
          userId: invoice.userId!,
        },
        tx,
      );
    }, { operationName: "invoice.advancePayment", metadata: { invoiceId: input.id } });

    const result = await this.invoiceRepository.findWithExpenses(input.id, input.userId);
    this.logger.log({ id: result.id, amount: input.amount }, "AdvanceInvoicePaymentUseCase.execute done");
    return result;
  }
}
