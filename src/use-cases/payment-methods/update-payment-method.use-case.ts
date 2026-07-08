import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { PaymentMethodTypeEnum } from "../../enums/payment-method-type.enum";
import { AppError } from "../../utils/app-error";
import { runWithTransaction } from "../../utils/run-with-transaction";
import type { IPaymentMethod } from "../../interfaces/payment-method";
import type { UpdatePaymentMethodDto } from "../../dto/payment-method.dto";

export type UpdatePaymentMethodInput = UpdatePaymentMethodDto & { id: string; userId: string };

@Injectable()
export class UpdatePaymentMethodUseCase {
  private readonly logger = new Logger(UpdatePaymentMethodUseCase.name);

  constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

  async execute(input: UpdatePaymentMethodInput): Promise<IPaymentMethod> {
    this.logger.log({ id: input.id, userId: input.userId }, "UpdatePaymentMethodUseCase.execute");

    const existing = await this.paymentMethodRepository.findById(input.id);
    if (!existing) throw new AppError("Resource not found", 404);
    if (existing.userId !== input.userId) {
      throw new AppError("Unauthorized to update this payment method", 403);
    }

    const nextName = input.name?.trim();
    if (
      existing.type === PaymentMethodTypeEnum.CREDIT_CARD &&
      ((input.closingDay === undefined && !existing.closingDay) || (input.dueDay === undefined && !existing.dueDay))
    ) {
      throw new AppError("Cartão de crédito precisa de dia de fechamento e de vencimento", 400);
    }

    if (nextName && nextName !== existing.name) {
      const duplicate = await this.paymentMethodRepository.findByName(input.userId, nextName);
      if (duplicate) throw new AppError("Já existe uma forma de pagamento com esse nome", 409);

      const result = await runWithTransaction(async (tx) => {
        await this.paymentMethodRepository.renameUsages(input.userId, existing.name, nextName, tx);
        return this.paymentMethodRepository.update(
          input.id,
          {
            name: nextName,
            color: input.color,
            closingDay: input.closingDay,
            dueDay: input.dueDay,
            isActive: input.isActive,
          },
          tx,
        );
      }, { operationName: "paymentMethod.rename", metadata: { from: existing.name, to: nextName } });

      if (!result) throw new AppError("Resource not found", 404);
      this.logger.log({ id: result.id, renamed: true }, "UpdatePaymentMethodUseCase.execute done");
      return result;
    }

    const result = await this.paymentMethodRepository.update(input.id, {
      color: input.color,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
      isActive: input.isActive,
    });
    if (!result) throw new AppError("Resource not found", 404);

    this.logger.log({ id: result.id }, "UpdatePaymentMethodUseCase.execute done");
    return result;
  }
}
