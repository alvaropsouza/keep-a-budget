import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
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

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: UpdateInvoiceInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id }, "UpdateInvoiceUseCase.execute");
    const { id, userId, isClosed, ...data } = input;
    const status =
      isClosed == null ? undefined : isClosed ? InvoiceStatusEnum.CLOSED : InvoiceStatusEnum.OPEN;

    const updated = await this.invoiceRepository.update(id, { ...data, status }, userId);

    if (isClosed != null || data.closingDate != null || data.bank != null) {
      await this.invoiceRepository.syncBankStatuses(updated.bank, userId);
    }

    const result = await this.invoiceRepository.findByIdOrThrow(id, userId);
    this.logger.log({ id: result.id }, "UpdateInvoiceUseCase.execute done");
    return result;
  }
}
