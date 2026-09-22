import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { AppError } from "../../errors/app-error";
import { PaymentMethodTypeEnum } from "../../enums/payment-method-type.enum";

export async function assertUsablePaymentMethod(
  paymentMethodRepository: PaymentMethodRepository,
  userId: string,
  name?: string | null,
  options: { requireCreditCard?: boolean } = {},
): Promise<void> {
  if (!name) return;

  const paymentMethod = await paymentMethodRepository.findByName(userId, name);
  if (!paymentMethod) {
    throw new AppError(`Forma de pagamento "${name}" não cadastrada. Cadastre em Configurações.`, 400);
  }
  if (!paymentMethod.isActive) {
    throw new AppError(`Forma de pagamento "${name}" está desativada.`, 400);
  }
  if (options.requireCreditCard && paymentMethod.type !== PaymentMethodTypeEnum.CREDIT_CARD) {
    throw new AppError(`"${name}" não é um cartão de crédito — faturas só existem para cartão.`, 400);
  }
}
