import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { CloseInvoiceUseCase } from "./close-invoice.use-case";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type CloseExpiredInvoicesOutput = { closed: number; invoices: ICardInvoice[] };

@Injectable()
export class CloseExpiredInvoicesUseCase {
  private readonly logger = new Logger(CloseExpiredInvoicesUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly closeInvoiceUseCase: CloseInvoiceUseCase,
  ) {}

  async execute(): Promise<CloseExpiredInvoicesOutput> {
    this.logger.log({}, "CloseExpiredInvoicesUseCase.execute");

    const expired = await this.invoiceRepository.findExpiredOpen();
    const closedInvoices: ICardInvoice[] = [];

    for (const invoice of expired) {
      try {
        const closed = await this.closeInvoiceUseCase.execute({ id: invoice.id });
        closedInvoices.push(closed);
      } catch (err) {
        this.logger.error({ err, invoiceId: invoice.id }, "Failed to auto-close expired invoice");
      }
    }

    this.logger.log({ closed: closedInvoices.length }, "CloseExpiredInvoicesUseCase.execute done");
    return { closed: closedInvoices.length, invoices: closedInvoices };
  }
}
