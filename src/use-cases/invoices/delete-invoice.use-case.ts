import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";

export type DeleteInvoiceInput = { id: string; userId: string };

@Injectable()
export class DeleteInvoiceUseCase {
  private readonly logger = new Logger(DeleteInvoiceUseCase.name);

  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: DeleteInvoiceInput): Promise<void> {
    this.logger.log({ id: input.id }, "DeleteInvoiceUseCase.execute");
    await this.invoiceRepository.deleteWithExpenses(input.id, input.userId);
    this.logger.log({ id: input.id }, "DeleteInvoiceUseCase.execute done");
  }
}
