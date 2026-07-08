import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import type { IPaymentMethod } from "../../interfaces/payment-method";
import type { PaymentMethodQueryParamsDto } from "../../dto/payment-method.dto";

export type ListPaymentMethodsInput = { userId: string; query: PaymentMethodQueryParamsDto };

@Injectable()
export class ListPaymentMethodsUseCase {
  private readonly logger = new Logger(ListPaymentMethodsUseCase.name);

  constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

  async execute(input: ListPaymentMethodsInput): Promise<IPaymentMethod[]> {
    this.logger.log({ input }, "ListPaymentMethodsUseCase.execute");

    const result = await this.paymentMethodRepository.findMany(input.userId, input.query.isActive);

    this.logger.log({ count: result.length }, "ListPaymentMethodsUseCase.execute done");
    return result;
  }
}
