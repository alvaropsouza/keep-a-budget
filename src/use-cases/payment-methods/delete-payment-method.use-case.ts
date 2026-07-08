import { Injectable, Logger } from "@nestjs/common";
import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { AppError } from "../../utils/app-error";

export type DeletePaymentMethodInput = { id: string; userId: string };

@Injectable()
export class DeletePaymentMethodUseCase {
  private readonly logger = new Logger(DeletePaymentMethodUseCase.name);

  constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

  async execute(input: DeletePaymentMethodInput): Promise<void> {
    this.logger.log({ input }, "DeletePaymentMethodUseCase.execute");

    const existing = await this.paymentMethodRepository.findById(input.id);
    if (!existing) throw new AppError("Resource not found", 404);
    if (existing.userId !== input.userId) {
      throw new AppError("Unauthorized to delete this payment method", 403);
    }

    const usages = await this.paymentMethodRepository.countUsages(input.userId, existing.name);
    if (usages > 0) {
      throw new AppError(
        "Essa forma de pagamento tem despesas ou faturas vinculadas. Desative em vez de excluir.",
        409,
      );
    }

    await this.paymentMethodRepository.delete(input.id);
    this.logger.log({ id: input.id }, "DeletePaymentMethodUseCase.execute done");
  }
}
