import { test } from "node:test";
import assert from "node:assert/strict";
import { ParseExpenseUseCase } from "../../src/use-cases/ai/parse-expense.use-case";
import type { AiService, UserVocabulary } from "../../src/services/ai.service";
import type { PaymentMethodRepository } from "../../src/repositories/payment-method.repository";
import type { CategoryRepository } from "../../src/repositories/category.repository";
import type { IPaymentMethod } from "../../src/interfaces/payment-method";
import type { Category } from "../../src/generated/prisma/client/client";
import type { ParsedExpenseResponse } from "../../src/dto/parse-expense.dto";

test("the AI prompt is built from the cards and categories the user actually has", async () => {
  let seen: UserVocabulary | undefined;

  const aiService = {
    parseExpense: async (_text: string, vocabulary?: UserVocabulary) => {
      seen = vocabulary;
      return {} as ParsedExpenseResponse;
    },
  } as unknown as AiService;

  const paymentMethodRepository = {
    findMany: async () => [{ name: "Nubank Ultravioleta" }, { name: "Pix" }] as IPaymentMethod[],
  } as unknown as PaymentMethodRepository;

  const categoryRepository = {
    findMany: async () => [{ name: "Mercado" }, { name: "Pets" }] as Category[],
  } as unknown as CategoryRepository;

  const useCase = new ParseExpenseUseCase(aiService, paymentMethodRepository, categoryRepository);
  await useCase.execute({ text: "45 no mercado", userId: "user-1" });

  assert.deepEqual(seen, {
    banks: ["Nubank Ultravioleta", "Pix"],
    categories: ["Mercado", "Pets"],
  });
});
