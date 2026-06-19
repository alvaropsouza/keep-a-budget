import { Injectable, Logger } from "@nestjs/common";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { AppError } from "../../utils/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { parseInvoiceCsv } from "../../utils/invoice-csv-parser";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";
import type { ICardInvoice } from "../../interfaces/card-invoice";

export type ImportExpensesFromCsvInput = {
  id: string;
  csvContent: string;
  excludeIndexes?: number[];
  userId: string;
};

@Injectable()
export class ImportExpensesFromCsvUseCase {
  private readonly logger = new Logger(ImportExpensesFromCsvUseCase.name);

  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly expenseRepository: ExpenseRepository,
  ) {}

  async execute(input: ImportExpensesFromCsvInput): Promise<ICardInvoice> {
    this.logger.log({ id: input.id }, "ImportExpensesFromCsvUseCase.execute");

    const invoice = await this.invoiceRepository.findByIdOrThrow(input.id, input.userId);

    if (invoice.isClosed) {
      throw new AppError(
        "Cannot import expenses into a closed invoice. Please reopen the invoice first.",
        400,
      );
    }

    const rows = parseInvoiceCsv(
      invoice.bank,
      input.csvContent,
      input.excludeIndexes ? new Set(input.excludeIndexes) : undefined,
    );

    await runWithTransaction(async (tx) => {
      const existingTotal = await this.expenseRepository.sumAmountByInvoice(input.id, ExpenseTypeEnum.EXPENSE, tx);

      await this.expenseRepository.deleteByInvoiceType(input.id, ExpenseTypeEnum.EXPENSE, tx);
      await this.invoiceRepository.updateBalance(input.id, -existingTotal, tx);

      if (rows.length === 0) {
        this.logger.warn({ invoiceId: input.id }, "CSV import produced no valid expenses");
        return;
      }

      await this.expenseRepository.createMany(
        rows.map((row) => ({
          bank: invoice.bank,
          type: ExpenseTypeEnum.EXPENSE,
          category: "Importado",
          date: row.date,
          amount: row.amount,
          description: row.description,
          installmentCurrent: row.installment?.current ?? null,
          installmentTotal: row.installment?.total ?? null,
          cardInvoiceId: input.id,
          userId: invoice.userId!,
        })),
        tx,
      );

      const newTotal = rows.reduce((sum, r) => sum + r.amount, 0);
      await this.invoiceRepository.updateBalance(input.id, newTotal, tx);
    }, { operationName: "invoice.importFromCsv", metadata: { invoiceId: input.id } });

    const result = await this.invoiceRepository.findWithExpenses(input.id, input.userId);
    this.logger.log({ id: result.id, imported: rows.length }, "ImportExpensesFromCsvUseCase.execute done");
    return result;
  }
}
