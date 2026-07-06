import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository } from "../../repositories/expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { S3Service } from "../../services/s3.service";
import { AppError } from "../../utils/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";
import { BanksEnum } from "../../enums/banks.enum";
import type { IExpense } from "../../interfaces/expense";

export type CreateExpenseInput = {
  userId: string;
  bank: BanksEnum;
  category: string;
  amount: number;
  description?: string;
  installmentTotal?: number;
  installmentStartNumber?: number;
  installmentStartDate?: string;
  receipt?: string;
  irDeductible?: boolean;
  file?: { buffer: Buffer; filename: string; mimetype: string; userEmail?: string };
};

@Injectable()
export class CreateExpenseUseCase {
  private readonly logger = new Logger(CreateExpenseUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: CreateExpenseInput): Promise<IExpense | IExpense[]> {
    this.logger.log({ userId: input.userId, bank: input.bank, amount: input.amount }, "CreateExpenseUseCase.execute");

    const { installmentTotal, installmentStartDate, installmentStartNumber } = input;

    if (installmentStartNumber && (!installmentTotal || installmentStartNumber > installmentTotal)) {
      throw new AppError("installmentStartNumber must be less than or equal to installmentTotal", 400);
    }

    if (installmentTotal && installmentTotal > 1) {
      return this.createInstallments(input, installmentTotal, installmentStartDate, installmentStartNumber);
    }

    return this.createSingle(input);
  }

  private async createSingle(input: CreateExpenseInput): Promise<IExpense> {
    const expenseDate = input.installmentStartDate ? new Date(input.installmentStartDate) : new Date();

    const expense = await runWithTransaction(async (tx) => {
      let cardInvoice = await this.invoiceRepository.findForExpenseDate(input.bank, expenseDate, input.userId, tx);

      if (cardInvoice?.isClosed) {
        cardInvoice = await this.invoiceRepository.findOpenForExpenseDate(input.bank, expenseDate, input.userId, tx);
        if (!cardInvoice) {
          throw new AppError("Cannot add expenses to a closed invoice. Please reopen the invoice first.", 400);
        }
      }

      const created = await this.expenseRepository.create(
        {
          userId: input.userId,
          bank: input.bank,
          category: input.category,
          amount: input.amount,
          description: input.description,
          receipt: input.receipt ?? null,
          irDeductible: input.irDeductible ?? false,
          type: ExpenseTypeEnum.EXPENSE,
          date: expenseDate,
          cardInvoiceId: cardInvoice?.id ?? null,
        },
        tx,
      );

      if (cardInvoice) {
        await this.invoiceRepository.updateBalance(cardInvoice.id, created.amount, tx);
      }

      return created;
    }, { operationName: "expense.createSingle", metadata: { bank: input.bank, amount: input.amount } });

    if (input.file) {
      try {
        const s3Key = await this.s3Service.upload(input.file.buffer, input.file.filename, input.file.mimetype, {
          userEmail: input.file.userEmail,
        });
        await this.expenseRepository.update(expense.id, { receipt: s3Key });
        expense.receipt = s3Key;
      } catch (err) {
        this.logger.error({ err, expenseId: expense.id }, "Failed to upload receipt");
      }
    }

    this.logger.log({ id: expense.id, amount: expense.amount }, "CreateExpenseUseCase.execute done");
    return expense;
  }

  private async createInstallments(
    input: CreateExpenseInput,
    installmentTotal: number,
    startDate?: string,
    installmentStartNumber: number = 1,
  ): Promise<IExpense[]> {
    if (installmentStartNumber > installmentTotal) {
      throw new AppError("installmentStartNumber cannot be greater than installmentTotal", 400);
    }

    const result = await runWithTransaction(async (tx) => {
      const baseDate = startDate ? new Date(startDate) : new Date();
      const expenses: IExpense[] = [];
      const balancesByInvoice = new Map<string, number>();

      const perInstallment = Math.round((input.amount / installmentTotal) * 100) / 100;
      const lastInstallmentAmount = Math.round((input.amount - perInstallment * (installmentTotal - 1)) * 100) / 100;

      for (let i = installmentStartNumber; i <= installmentTotal; i++) {
        const targetDate = this.calculateInstallmentDate(baseDate, i - installmentStartNumber);
        const cardInvoice = await this.invoiceRepository.ensureForDate(input.bank, targetDate, input.userId, tx);

        if (cardInvoice?.isClosed) {
          throw new AppError(
            `Cannot add expenses to closed invoice for ${targetDate.toISOString()}. Please reopen the invoice first.`,
            400,
          );
        }

        const installmentAmount = i === installmentTotal ? lastInstallmentAmount : perInstallment;

        const created = await this.expenseRepository.create(
          {
            userId: input.userId,
            bank: input.bank,
            category: input.category,
            amount: installmentAmount,
            receipt: input.receipt ?? null,
            irDeductible: input.irDeductible ?? false,
            type: ExpenseTypeEnum.EXPENSE,
            description: `${input.description || input.category} (${i}/${installmentTotal})`,
            date: targetDate,
            installmentCurrent: i,
            installmentTotal,
            cardInvoiceId: cardInvoice?.id ?? null,
          },
          tx,
        );

        expenses.push(created);

        if (created.cardInvoiceId) {
          const invoiceId = created.cardInvoiceId.toString();
          balancesByInvoice.set(invoiceId, (balancesByInvoice.get(invoiceId) ?? 0) + created.amount);
        }
      }

      for (const [invoiceId, amount] of balancesByInvoice) {
        await this.invoiceRepository.updateBalance(invoiceId, amount, tx);
      }

      return expenses;
    }, { operationName: "expense.createInstallments", metadata: { bank: input.bank, installmentTotal } });

    this.logger.log({ count: result.length, installmentTotal }, "CreateExpenseUseCase.execute done (installments)");
    return result;
  }

  private calculateInstallmentDate(baseDate: Date, monthsToAdd: number): Date {
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth();
    const day = baseDate.getUTCDate();
    const targetDate = new Date(Date.UTC(year, month + monthsToAdd, day));
    if (targetDate.getUTCDate() !== day) targetDate.setUTCDate(0);
    return targetDate;
  }
}
