import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { CategoryRepository, FIXED_EXPENSE_CATEGORY } from "../../repositories/category.repository";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";
import { cycleEligibility, expenseDateForInvoice } from "../../utils/fixed-expense-cycle";
import type { ICardInvoice } from "../../interfaces/card-invoice";
import type { IFixedExpense } from "../../interfaces/fixed-expense";

export type AutoLaunchFixedExpensesOutput = { launched: number; skipped: number };

@Injectable()
export class AutoLaunchFixedExpensesUseCase {
  private readonly logger = new Logger(AutoLaunchFixedExpensesUseCase.name);

  constructor(
    private readonly fixedExpenseRepository: FixedExpenseRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(): Promise<AutoLaunchFixedExpensesOutput> {
    this.logger.log({}, "AutoLaunchFixedExpensesUseCase.execute");

    const candidates = await this.fixedExpenseRepository.findAutoLaunchable();
    const openInvoices = await this.invoiceRepository.findAllOpen();
    const invoiceByKey = new Map(openInvoices.map((invoice) => [this.key(invoice.userId, invoice.bank), invoice]));

    let launched = 0;
    let skipped = 0;

    for (const fixed of candidates) {
      const userId = fixed.userId;
      const invoice = userId ? this.targetInvoice(fixed, userId, invoiceByKey) : undefined;
      if (!userId || !invoice) {
        skipped += 1;
        continue;
      }

      if (fixed.linkedInvoiceIds.includes(invoice.id)) {
        skipped += 1;
        continue;
      }

      const eligibility = cycleEligibility(fixed, invoice.closingDate);
      if (!eligibility.due) {
        skipped += 1;
        continue;
      }

      try {
        await this.launch(fixed, invoice, userId);
        launched += 1;
      } catch (err) {
        skipped += 1;
        this.logger.error({ err, fixedExpenseId: fixed.id, invoiceId: invoice.id }, "Failed to auto-launch fixed expense");
      }
    }

    this.logger.log({ launched, skipped }, "AutoLaunchFixedExpensesUseCase.execute done");
    return { launched, skipped };
  }

  private key(userId: string | undefined, bank: string): string {
    return `${userId ?? ""}::${bank}`;
  }

  private targetInvoice(
    fixed: IFixedExpense,
    userId: string,
    invoiceByKey: Map<string, ICardInvoice>,
  ): ICardInvoice | undefined {
    if (!fixed.paymentMethodName) return undefined;
    return invoiceByKey.get(this.key(userId, fixed.paymentMethodName));
  }

  private async launch(fixed: IFixedExpense, invoice: ICardInvoice, userId: string): Promise<void> {
    if (!fixed.category) {
      await this.categoryRepository.ensureExists(
        userId,
        FIXED_EXPENSE_CATEGORY.name,
        FIXED_EXPENSE_CATEGORY.icon,
      );
    }

    await runWithTransaction(
      async (tx) => {
        const created = await this.expenseRepository.create(
          {
            userId,
            bank: invoice.bank,
            type: ExpenseTypeEnum.EXPENSE,
            category: fixed.category ?? FIXED_EXPENSE_CATEGORY.name,
            date: expenseDateForInvoice(fixed, invoice.closingDate),
            amount: fixed.amount,
            description: fixed.name,
            cardInvoiceId: invoice.id,
            fixedExpenseId: fixed.id,
          },
          tx,
        );

        await this.invoiceRepository.updateBalance(invoice.id, created.amount, tx);
      },
      { operationName: "fixedExpense.autoLaunch", metadata: { fixedExpenseId: fixed.id, invoiceId: invoice.id } },
    );
  }
}
