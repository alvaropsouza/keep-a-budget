import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository, type InvoiceSummary } from "../../repositories/invoice.repository";

export type GetInvoiceSummaryInput = { userId: string };

@Injectable()
export class GetInvoiceSummaryUseCase {
  private readonly logger = new Logger(GetInvoiceSummaryUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: GetInvoiceSummaryInput): Promise<InvoiceSummary> {
    this.logger.log({ userId: input.userId }, "GetInvoiceSummaryUseCase.execute");
    const result = await this.invoiceRepository.getSummary(input.userId);
    this.logger.log({}, "GetInvoiceSummaryUseCase.execute done");
    return result;
  }
}
