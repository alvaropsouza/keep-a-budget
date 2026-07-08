import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { PaymentMethodTypeEnum } from "../../enums/payment-method-type.enum";
import { AppError } from "../../utils/app-error";
import type { IPaymentMethod } from "../../interfaces/payment-method";
import type { CreatePaymentMethodDto } from "../../dto/payment-method.dto";

export type CreatePaymentMethodInput = CreatePaymentMethodDto & { userId: string };

@Injectable()
export class CreatePaymentMethodUseCase {
  private readonly logger = new Logger(CreatePaymentMethodUseCase.name);

  constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

  async execute(input: CreatePaymentMethodInput): Promise<IPaymentMethod> {
    this.logger.log({ userId: input.userId, name: input.name, type: input.type }, "CreatePaymentMethodUseCase.execute");

    if (input.type === PaymentMethodTypeEnum.CREDIT_CARD && (!input.closingDay || !input.dueDay)) {
      throw new AppError("Cartão de crédito precisa de dia de fechamento e de vencimento", 400);
    }

    const existing = await this.paymentMethodRepository.findByName(input.userId, input.name.trim());
    if (existing) throw new AppError("Já existe uma forma de pagamento com esse nome", 409);

    const result = await this.paymentMethodRepository.create({
      userId: input.userId,
      name: input.name.trim(),
      type: input.type,
      color: input.color,
      closingDay: input.type === PaymentMethodTypeEnum.CREDIT_CARD ? input.closingDay : undefined,
      dueDay: input.type === PaymentMethodTypeEnum.CREDIT_CARD ? input.dueDay : undefined,
    });

    this.logger.log({ id: result.id }, "CreatePaymentMethodUseCase.execute done");
    return result;
  }
}
