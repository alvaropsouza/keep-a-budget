import { Injectable, Logger } from "@nestjs/common";
import { ExpenseRepository, UpdateExpenseData } from "../../repositories/expense.repository";
import { InvoiceRepository } from "../../repositories/invoice.repository";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { AppError } from "../../errors/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import { PaymentMethodTypeEnum } from "../../enums/payment-method-type.enum";
import { ExpenseTypeEnum } from "../../enums/expense-type.enum";
import type { IExpense } from "../../interfaces/expense";

export type UpdateExpenseInput = UpdateExpenseData & { id: string; userId: string };

@Injectable()
export class UpdateExpenseUseCase {
  private readonly logger = new Logger(UpdateExpenseUseCase.name);

  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: UpdateExpenseInput): Promise<IExpense> {
    this.logger.log({ id: input.id, userId: input.userId }, "UpdateExpenseUseCase.execute");

    const { id, userId, ...data } = input;

    const result = await runWithTransaction(async (tx) => {
      const old = await this.expenseRepository.findById(id, userId, tx);
      if (!old) throw new AppError("Resource not found", 404);

      if (old.type === ExpenseTypeEnum.ADVANCE) {
        throw new AppError("Adiantamentos não podem ser editados. Exclua o adiantamento e lance novamente.", 400);
      }

      if (old.cardInvoiceId) {
        const invoice = await this.invoiceRepository.findById(old.cardInvoiceId.toString(), undefined, tx);
        if (invoice?.isClosed) {
          throw new AppError("Cannot update expenses in a closed invoice. Please reopen the invoice first.", 400);
        }
      }

      const nextBank = data.bank ?? old.bank;
      const nextDate = data.date ?? old.date;
      const isMovingBank = nextBank !== old.bank;
      const isMovingDate = data.date !== undefined && data.date.getTime() !== old.date.getTime();

      let targetInvoiceId = old.cardInvoiceId;

      if (isMovingBank || isMovingDate) {
        const paymentMethod = await this.paymentMethodRepository.findByName(userId, nextBank, tx);
        if (!paymentMethod) {
          throw new AppError(`Forma de pagamento "${nextBank}" não cadastrada. Cadastre em Configurações.`, 400);
        }
        if (!paymentMethod.isActive) {
          throw new AppError(`Forma de pagamento "${nextBank}" está desativada.`, 400);
        }

        if (paymentMethod.type === PaymentMethodTypeEnum.CREDIT_CARD) {
          const cycle =
            paymentMethod.closingDay && paymentMethod.dueDay
              ? { closingDay: paymentMethod.closingDay, dueDay: paymentMethod.dueDay }
              : undefined;
          const target = await this.invoiceRepository.ensureForDate(nextBank, nextDate, userId, tx, cycle);
          if (target.isClosed) {
            throw new AppError("A fatura de destino está fechada. Reabra a fatura antes de mover a despesa.", 400);
          }
          targetInvoiceId = target.id;
        } else {
          targetInvoiceId = null;
        }
      }

      const updated = await this.expenseRepository.update(
        id,
        targetInvoiceId === old.cardInvoiceId ? data : { ...data, cardInvoiceId: targetInvoiceId },
        tx,
      );
      if (!updated) throw new AppError("Resource not found", 404);

      const newAmount = data.amount ?? old.amount;

      if (targetInvoiceId !== old.cardInvoiceId) {
        if (old.cardInvoiceId) await this.invoiceRepository.updateBalance(old.cardInvoiceId, -old.amount, tx);
        if (targetInvoiceId) await this.invoiceRepository.updateBalance(targetInvoiceId, newAmount, tx);
      } else if (data.amount !== undefined && data.amount !== old.amount && updated.cardInvoiceId) {
        await this.invoiceRepository.updateBalance(updated.cardInvoiceId, data.amount - old.amount, tx);
      }

      return updated;
    }, { operationName: "expense.update", metadata: { expenseId: id } });

    this.logger.log({ id }, "UpdateExpenseUseCase.execute done");
    return result;
  }
}
