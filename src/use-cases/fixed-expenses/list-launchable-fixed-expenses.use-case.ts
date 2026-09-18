import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { AppError } from "../../errors/app-error";
import { InvoiceStatusEnum } from "../../enums/invoice-status.enum";
import { cycleEligibility } from "../../utils/fixed-expense-cycle";
import type { ILaunchableFixedExpense } from "../../interfaces/fixed-expense";

export type ListLaunchableFixedExpensesInput = { userId: string; cardInvoiceId: string };

@Injectable()
export class ListLaunchableFixedExpensesUseCase {
  private readonly logger = new Logger(ListLaunchableFixedExpensesUseCase.name);

  constructor(
    private readonly fixedExpenseRepository: FixedExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
  ) {}

  async execute(input: ListLaunchableFixedExpensesInput): Promise<ILaunchableFixedExpense[]> {
    this.logger.log({ input }, "ListLaunchableFixedExpensesUseCase.execute");

    const invoice = await this.invoiceRepository.findById(input.cardInvoiceId, input.userId);
    if (!invoice) throw new AppError("Fatura não encontrada", 404);
    if (invoice.status !== InvoiceStatusEnum.OPEN) {
      throw new AppError("Só é possível lançar despesas fixas em uma fatura aberta", 400);
    }

    const active = await this.fixedExpenseRepository.findMany(input.userId, true);

    const result = active.map((fixed): ILaunchableFixedExpense => {
      if (fixed.linkedInvoiceIds.includes(invoice.id)) {
        return { ...fixed, due: false, blockedReason: "ALREADY_LINKED" };
      }

      const eligibility = cycleEligibility(fixed, invoice.closingDate);
      return eligibility.due
        ? { ...fixed, due: true }
        : { ...fixed, due: false, blockedReason: eligibility.reason };
    });

    this.logger.log({ count: result.length }, "ListLaunchableFixedExpensesUseCase.execute done");
    return result;
  }
}
