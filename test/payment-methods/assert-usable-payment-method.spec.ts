import { test } from "node:test";
import assert from "node:assert/strict";
import { assertUsablePaymentMethod } from "../../src/use-cases/payment-methods/assert-usable-payment-method";
import type { PaymentMethodRepository } from "../../src/repositories/payment-method.repository";
import type { IPaymentMethod } from "../../src/interfaces/payment-method";

const repositoryReturning = (method: IPaymentMethod | null): PaymentMethodRepository =>
  ({ findByName: async () => method }) as unknown as PaymentMethodRepository;

test("no payment method name means nothing to validate", async () => {
  await assertUsablePaymentMethod(repositoryReturning(null), "user-1", undefined);
  await assertUsablePaymentMethod(repositoryReturning(null), "user-1", null);
});

test("unknown payment method is rejected", async () => {
  await assert.rejects(
    assertUsablePaymentMethod(repositoryReturning(null), "user-1", "Fantasma"),
    /não cadastrada/i,
  );
});

test("inactive payment method is rejected", async () => {
  const method = { name: "XP", isActive: false } as IPaymentMethod;
  await assert.rejects(
    assertUsablePaymentMethod(repositoryReturning(method), "user-1", "XP"),
    /desativada/i,
  );
});

test("active payment method passes", async () => {
  const method = { name: "XP", isActive: true } as IPaymentMethod;
  await assertUsablePaymentMethod(repositoryReturning(method), "user-1", "XP");
});
