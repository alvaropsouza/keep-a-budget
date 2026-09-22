import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { AppError } from "../../errors/app-error";

export async function assertUsablePaymentMethod(
  paymentMethodRepository: PaymentMethodRepository,
  userId: string,
  name?: string | null,
): Promise<void> {
  if (!name) return;

  const paymentMethod = await paymentMethodRepository.findByName(userId, name);
  if (!paymentMethod) {
    throw new AppError(`Forma de pagamento "${name}" não cadastrada. Cadastre em Configurações.`, 400);
  }
  if (!paymentMethod.isActive) {
    throw new AppError(`Forma de pagamento "${name}" está desativada.`, 400);
  }
}
