import { Injectable, Logger } from "@nestjs/common";
import { FixedExpenseRepository } from "../../repositories/fixed-expense.repository";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { assertUsablePaymentMethod } from "./assert-usable-payment-method";
import type { IFixedExpense } from "../../interfaces/fixed-expense";
import type { CreateFixedExpenseDto } from "../../dto/fixed-expense.dto";

export type CreateFixedExpenseInput = CreateFixedExpenseDto & { userId: string };

@Injectable()
export class CreateFixedExpenseUseCase {
  private readonly logger = new Logger(CreateFixedExpenseUseCase.name);

  constructor(
    private readonly fixedExpenseRepository: FixedExpenseRepository,
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async execute(input: CreateFixedExpenseInput): Promise<IFixedExpense> {
    this.logger.log({ userId: input.userId, name: input.name }, "CreateFixedExpenseUseCase.execute");

    await assertUsablePaymentMethod(this.paymentMethodRepository, input.userId, input.paymentMethodName);

    const result = await this.fixedExpenseRepository.create(input);

    this.logger.log({ id: result.id, amount: result.amount }, "CreateFixedExpenseUseCase.execute done");
    return result;
  }
}
