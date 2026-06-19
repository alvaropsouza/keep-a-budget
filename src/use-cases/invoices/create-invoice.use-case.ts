import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import type { ICardInvoice } from "../../interfaces/card-invoice";
import { BanksEnum } from "../../enums/banks.enum";

export type CreateInvoiceInput = {
  bank: BanksEnum;
  closingDate: Date;
  dueDate: Date;
  balance?: number;
  userId: string;
};

@Injectable()
export class CreateInvoiceUseCase {
  private readonly logger = new Logger(CreateInvoiceUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: CreateInvoiceInput): Promise<ICardInvoice> {
    this.logger.log({ userId: input.userId, bank: input.bank }, "CreateInvoiceUseCase.execute");
    const result = await this.invoiceRepository.create(input);
    this.logger.log({ id: result.id }, "CreateInvoiceUseCase.execute done");
    return result;
  }
}
