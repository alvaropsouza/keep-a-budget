import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { AppError } from "../../errors/app-error";
import { assertUsablePaymentMethod } from "../payment-methods/assert-usable-payment-method";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type CreateInvoiceInput = {
  bank: string;
  closingDate: Date;
  dueDate: Date;
  balance?: number;
  userId: string;
};

@Injectable()
export class CreateInvoiceUseCase {
  private readonly logger = new Logger(CreateInvoiceUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<ICardInvoice> {
    this.logger.log({ userId: input.userId, bank: input.bank }, "CreateInvoiceUseCase.execute");
    await assertUsablePaymentMethod(this.paymentMethodRepository, input.userId, input.bank, {
      requireCreditCard: true,
    });
    if (input.dueDate < input.closingDate) {
      throw new AppError("O vencimento não pode ser anterior ao fechamento da fatura.", 400);
    }

    const result = await this.invoiceRepository.create(input);
    this.logger.log({ id: result.id }, "CreateInvoiceUseCase.execute done");
    return result;
  }
}
