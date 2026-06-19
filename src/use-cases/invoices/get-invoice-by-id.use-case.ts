import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type GetInvoiceByIdInput = { id: string; userId: string };

@Injectable()
export class GetInvoiceByIdUseCase {
  private readonly logger = new Logger(GetInvoiceByIdUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: GetInvoiceByIdInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id }, "GetInvoiceByIdUseCase.execute");
    const result = await this.invoiceRepository.findWithExpenses(input.id, input.userId);
    this.logger.log({ id: result.id }, "GetInvoiceByIdUseCase.execute done");
    return result;
  }
}
