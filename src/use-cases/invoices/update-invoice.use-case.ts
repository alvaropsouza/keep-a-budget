import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository, type UpdateInvoiceData } from "../../repositories/invoice.repository";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type UpdateInvoiceInput = UpdateInvoiceData & { id: string; userId: string };

@Injectable()
export class UpdateInvoiceUseCase {
  private readonly logger = new Logger(UpdateInvoiceUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: UpdateInvoiceInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id }, "UpdateInvoiceUseCase.execute");
    const { id, userId, ...data } = input;
    const result = await this.invoiceRepository.update(id, data, userId);
    this.logger.log({ id: result.id }, "UpdateInvoiceUseCase.execute done");
    return result;
  }
}
