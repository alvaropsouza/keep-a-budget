import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { AppError } from "../../utils/app-error";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type ReopenInvoiceInput = { id: string; userId: string };

@Injectable()
export class ReopenInvoiceUseCase {
  private readonly logger = new Logger(ReopenInvoiceUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: ReopenInvoiceInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id }, "ReopenInvoiceUseCase.execute");

    const invoice = await this.invoiceRepository.findByIdOrThrow(input.id, input.userId);

    if (!invoice.isClosed) throw new AppError("Invoice is not closed", 400);

    await this.invoiceRepository.update(input.id, { isClosed: false }, input.userId);
    const result = await this.invoiceRepository.findWithExpenses(input.id, input.userId);

    this.logger.log({ id: result.id }, "ReopenInvoiceUseCase.execute done");
    return result;
  }
}
