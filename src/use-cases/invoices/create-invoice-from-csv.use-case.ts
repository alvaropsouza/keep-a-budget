import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { parseInvoiceCsv } from "../../utils/invoice-csv-parser";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";
import { BanksEnum } from "../../enums/banks.enum";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type CreateInvoiceFromCsvInput = {
  bank: BanksEnum;
  closingDate: string;
  dueDate: string;
  csvContent: string;
  excludeIndexes?: number[];
  userId: string;
};

@Injectable()
export class CreateInvoiceFromCsvUseCase {
  private readonly logger = new Logger(CreateInvoiceFromCsvUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly expenseRepository: ExpenseRepository,
  ) {}

  async execute(input: CreateInvoiceFromCsvInput): Promise<ICardInvoice> {
    this.logger.log({ bank: input.bank, userId: input.userId }, "CreateInvoiceFromCsvUseCase.execute");

    const rows = parseInvoiceCsv(
      input.bank,
      input.csvContent,
      input.excludeIndexes ? new Set(input.excludeIndexes) : undefined,
    );

    const invoiceId = await runWithTransaction(async (tx) => {
      const invoice = await this.invoiceRepository.create(
        {
          bank: input.bank,
          closingDate: new Date(input.closingDate),
          dueDate: new Date(input.dueDate),
          balance: 0,
          userId: input.userId,
        },
        tx,
      );

      if (rows.length === 0) {
        this.logger.warn({ closingDate: input.closingDate }, "CSV create produced no valid expenses");
        return invoice.id;
      }

      await this.expenseRepository.createMany(
        rows.map((row) => ({
          bank: input.bank,
          type: ExpenseTypeEnum.EXPENSE,
          category: "Importado",
          date: row.date,
          amount: row.amount,
          description: row.description,
          installmentCurrent: row.installment?.current ?? null,
          installmentTotal: row.installment?.total ?? null,
          cardInvoiceId: invoice.id,
          userId: input.userId,
        })),
        tx,
      );

      const newTotal = rows.reduce((sum, r) => sum + r.amount, 0);
      await this.invoiceRepository.updateBalance(invoice.id, newTotal, tx);

      return invoice.id;
    }, { operationName: "invoice.createFromCsv", metadata: { bank: input.bank } });

    const result = await this.invoiceRepository.findWithExpenses(invoiceId, input.userId);
    this.logger.log({ id: result.id, imported: rows.length }, "CreateInvoiceFromCsvUseCase.execute done");
    return result;
  }
}
