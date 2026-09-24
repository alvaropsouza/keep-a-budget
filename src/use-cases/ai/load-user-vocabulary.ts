import { PaymentMethodRepository } from "../../repositories/payment-method.repository";
import { CategoryRepository } from "../../repositories/category.repository";
import type { UserVocabulary } from "../../services/ai.service";

export async function loadUserVocabulary(
  paymentMethodRepository: PaymentMethodRepository,
  categoryRepository: CategoryRepository,
  userId: string,
): Promise<UserVocabulary> {
  const [paymentMethods, categories] = await Promise.all([
    paymentMethodRepository.findMany(userId, true),
    categoryRepository.findMany(userId, false),
  ]);

  return {
    banks: paymentMethods.map((method) => method.name),
    categories: categories.map((category) => category.name),
  };
}
