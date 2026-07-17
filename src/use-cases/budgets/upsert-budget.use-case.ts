import { Injectable, Logger } from "@nestjs/common";
import type { Budget } from "../../generated/prisma/client/client";
import { BudgetRepository } from "../../repositories/budget.repository";
import { AppError } from "../../utils/app-error";
import { invoicePeriod, periodKey, samePeriod } from "../../utils/invoice-period";

export type UpsertBudgetInput = {
  userId: string;
  category: string;
  amount: number;
  month: number;
  year: number;
  invoiceIds: string[];
};

@Injectable()
export class UpsertBudgetUseCase {
  private readonly logger = new Logger(UpsertBudgetUseCase.name);

  constructor(private readonly budgetRepository: BudgetRepository) {}

  async execute(input: UpsertBudgetInput): Promise<Budget> {
    this.logger.log({ input }, "UpsertBudgetUseCase.execute");

    if (input.invoiceIds.length === 0) {
      throw new AppError("Selecione pelo menos uma fatura", 400);
    }

    const invoices = await this.budgetRepository.findInvoices(input.invoiceIds, input.userId);
    if (invoices.length !== input.invoiceIds.length) {
      throw new AppError("Uma ou mais faturas não encontradas", 404);
    }

    const banks = invoices.map((inv) => inv.bank);
    if (new Set(banks).size !== banks.length) {
      throw new AppError("Não pode ter duas faturas do mesmo banco", 400);
    }

    const budgetPeriod = { month: input.month, year: input.year };
    const invoicePeriods = invoices.map((inv) => invoicePeriod(inv.closingDate));

    if (new Set(invoicePeriods.map(periodKey)).size > 1) {
      throw new AppError("Todas as faturas devem ser do mesmo mês", 400);
    }

    const mismatched = invoices.filter(
      (_, i) => !samePeriod(invoicePeriods[i], budgetPeriod),
    );
    if (mismatched.length > 0) {
      throw new AppError(
        "As faturas selecionadas não pertencem ao período do orçamento (mês/ano). O orçamento deve rastrear faturas que fecham no mesmo mês.",
        400,
      );
    }

    const result = await this.budgetRepository.upsert(
      input.userId,
      input.category,
      input.amount,
      input.month,
      input.year,
      invoices.map((inv) => ({ id: inv.id, bank: inv.bank })),
    );

    this.logger.log({ id: result.id }, "UpsertBudgetUseCase.execute done");
    return result;
  }
}
