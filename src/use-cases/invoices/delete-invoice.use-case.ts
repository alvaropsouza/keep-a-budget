import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { S3Service } from "../../services/s3.service";

export type DeleteInvoiceInput = { id: string; userId: string };

@Injectable()
export class DeleteInvoiceUseCase {
  private readonly logger = new Logger(DeleteInvoiceUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: DeleteInvoiceInput): Promise<void> {
    this.logger.log({ id: input.id }, "DeleteInvoiceUseCase.execute");
    await this.invoiceRepository.findByIdOrThrow(input.id, input.userId);
    const receipts = await this.expenseRepository.findReceiptKeysByInvoice(input.id);

    await this.invoiceRepository.deleteWithExpenses(input.id, input.userId);
    if (receipts.length > 0) await this.s3Service.deleteObjects(receipts);
    this.logger.log({ id: input.id }, "DeleteInvoiceUseCase.execute done");
  }
}
