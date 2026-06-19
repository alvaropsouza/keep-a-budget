import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository, type InvoiceFilter } from "../../repositories/invoice.repository";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type ListInvoicesInput = InvoiceFilter & { userId: string };

@Injectable()
export class ListInvoicesUseCase {
  private readonly logger = new Logger(ListInvoicesUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: ListInvoicesInput): Promise<ICardInvoice[]> {
    this.logger.log({ userId: input.userId }, "ListInvoicesUseCase.execute");
    const { userId, ...filter } = input;
    const result = await this.invoiceRepository.findMany(filter, userId);
    this.logger.log({ count: result.length }, "ListInvoicesUseCase.execute done");
    return result;
  }
}
