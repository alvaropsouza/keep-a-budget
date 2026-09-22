import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { AppError } from "../../errors/app-error";
import { assertUsablePaymentMethod } from "../payment-methods/assert-usable-payment-method";
import type { ICardInvoice } from "../../interfaces/card-invoice";
import { InvoiceStatusEnum } from "../../enums/invoice-status.enum";

export type UpdateInvoiceInput = {
  id: string;
  userId: string;
  bank?: string;
  closingDate?: Date;
  dueDate?: Date;
  balance?: number;
  isClosed?: boolean;
};

@Injectable()
export class UpdateInvoiceUseCase {
  private readonly logger = new Logger(UpdateInvoiceUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: UpdateInvoiceInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id }, "UpdateInvoiceUseCase.execute");
    const { id, userId, isClosed, ...data } = input;

    const existing = await this.invoiceRepository.findByIdOrThrow(id, userId);
    const nextClosingDate = data.closingDate ?? existing.closingDate;
    const nextDueDate = data.dueDate ?? existing.dueDate;
    if (nextDueDate < nextClosingDate) {
      throw new AppError("O vencimento não pode ser anterior ao fechamento da fatura.", 400);
    }

    const movedBank = data.bank && data.bank !== existing.bank ? data.bank : null;
    if (movedBank) {
      await assertUsablePaymentMethod(this.paymentMethodRepository, userId, movedBank, {
        requireCreditCard: true,
      });
    }

    const status =
      isClosed == null ? undefined : isClosed ? InvoiceStatusEnum.CLOSED : InvoiceStatusEnum.OPEN;

    const updated = await this.invoiceRepository.update(id, { ...data, status }, userId);

    if (movedBank) {
      await this.expenseRepository.updateBankByInvoice(id, movedBank);
      await this.invoiceRepository.syncBankStatuses(existing.bank, userId);
    }

    if (isClosed != null || data.closingDate != null || data.bank != null) {
      await this.invoiceRepository.syncBankStatuses(updated.bank, userId);
    }

    const result = await this.invoiceRepository.findByIdOrThrow(id, userId);
    this.logger.log({ id: result.id }, "UpdateInvoiceUseCase.execute done");
    return result;
  }
}
