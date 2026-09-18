import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { CategoryRepository, FIXED_EXPENSE_CATEGORY } from "../../repositories/category.repository";
import { AppError } from "../../errors/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";
import { InvoiceStatusEnum } from "../../enums/invoice-status.enum";
import { cycleEligibility, expenseDateForInvoice, CYCLE_SKIP_MESSAGES } from "../../utils/fixed-expense-cycle";
import type { IExpense } from "../../interfaces/expense";

export type LinkFixedExpensesToInvoiceInput = {
  userId: string;
  cardInvoiceId: string;
  fixedExpenseIds: string[];
};

@Injectable()
export class LinkFixedExpensesToInvoiceUseCase {
  private readonly logger = new Logger(LinkFixedExpensesToInvoiceUseCase.name);

  constructor(
    private readonly fixedExpenseRepository: FixedExpenseRepository,
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(input: LinkFixedExpensesToInvoiceInput): Promise<IExpense[]> {
    this.logger.log({ userId: input.userId, cardInvoiceId: input.cardInvoiceId }, "LinkFixedExpensesToInvoiceUseCase.execute");

    const uniqueIds = [...new Set(input.fixedExpenseIds)];
    if (uniqueIds.length === 0) {
      throw new AppError("Selecione ao menos uma despesa fixa", 400);
    }

    const invoice = await this.invoiceRepository.findById(input.cardInvoiceId, input.userId);
    if (!invoice) {
      throw new AppError("Fatura não encontrada", 404);
    }
    if (invoice.status !== InvoiceStatusEnum.OPEN) {
      throw new AppError("Só é possível lançar despesas fixas em uma fatura aberta", 400);
    }

    const fixedExpenses = await this.fixedExpenseRepository.findManyByIds(input.userId, uniqueIds);
    if (fixedExpenses.length !== uniqueIds.length) {
      throw new AppError("Despesa fixa não encontrada", 404);
    }

    const inactive = fixedExpenses.find((fixed) => !fixed.isActive);
    if (inactive) {
      throw new AppError(`"${inactive.name}" está inativa e não pode ser lançada`, 400);
    }

    const alreadyLinked = fixedExpenses.find((fixed) => fixed.linkedInvoiceIds.includes(invoice.id));
    if (alreadyLinked) {
      throw new AppError(`"${alreadyLinked.name}" já foi lançada nesta fatura`, 409);
    }

    for (const fixed of fixedExpenses) {
      const eligibility = cycleEligibility(fixed, invoice.closingDate);
      if (!eligibility.due) {
        throw new AppError(`"${fixed.name}" ${CYCLE_SKIP_MESSAGES[eligibility.reason]}`, 400);
      }
    }

    if (fixedExpenses.some((fixed) => !fixed.category)) {
      await this.categoryRepository.ensureExists(
        input.userId,
        FIXED_EXPENSE_CATEGORY.name,
        FIXED_EXPENSE_CATEGORY.icon,
      );
    }

    const created = await runWithTransaction(
      async (tx) => {
        const expenses: IExpense[] = [];
        let total = 0;

        for (const fixed of fixedExpenses) {
          const expense = await this.expenseRepository.create(
            {
              userId: input.userId,
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
          expenses.push(expense);
          total += expense.amount;
        }

        await this.invoiceRepository.updateBalance(invoice.id, total, tx);

        return expenses;
      },
      { operationName: "fixedExpense.linkToInvoice", metadata: { cardInvoiceId: invoice.id, count: fixedExpenses.length } },
    );

    this.logger.log({ count: created.length }, "LinkFixedExpensesToInvoiceUseCase.execute done");
    return created;
  }
}
