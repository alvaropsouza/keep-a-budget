import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { AppError } from "../../utils/app-error";
import type { ICardInvoice } from "../../interfaces/card-invoice";
import { InvoiceStatusEnum } from "../../enums/invoice-status.enum";

export type CloseInvoiceInput = { id: string; userId?: string; manualBalance?: number };

@Injectable()
export class CloseInvoiceUseCase {
  private readonly logger = new Logger(CloseInvoiceUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: CloseInvoiceInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id }, "CloseInvoiceUseCase.execute");

    const invoice = await this.invoiceRepository.findByIdOrThrow(input.id, input.userId);

    if (invoice.isClosed) throw new AppError("Invoice is already closed", 400);

    const data: { status: InvoiceStatusEnum; balance?: number } = {
      status: InvoiceStatusEnum.CLOSED,
    };
    if (input.manualBalance != null) data.balance = input.manualBalance;

    await this.invoiceRepository.update(input.id, data, input.userId);
    await this.invoiceRepository.syncBankStatuses(invoice.bank, invoice.userId);
    const result = await this.invoiceRepository.findWithExpenses(input.id, input.userId);

    this.logger.log({ id: result.id, finalBalance: result.balance }, "CloseInvoiceUseCase.execute done");
    return result;
  }
}
