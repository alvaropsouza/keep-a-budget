import { test } from "node:test";
import assert from "node:assert/strict";
import { GetStockGainsByMonthUseCase } from "../../src/use-cases/ir-stocks/get-stock-gains-by-month.use-case";
import type { StockTransactionRepository } from "../../src/repositories/stock-transaction.repository";
import type { IStockTransaction } from "../../src/interfaces/stock-transaction";

const buildUseCase = (transactions: IStockTransaction[]) => {
  const repository = {
    findManyByUserId: async () => transactions,
  } as unknown as StockTransactionRepository;
  return new GetStockGainsByMonthUseCase(repository);
};

const buy = (date: string, quantity: number, unitPrice: number, fees = 0): IStockTransaction =>
  ({
    ticker: "PETR4",
    broker: "XP",
    type: "COMPRA",
    operationType: "NORMAL",
    date: new Date(date),
    quantity,
    unitPrice,
    fees,
  }) as IStockTransaction;

const sell = (date: string, quantity: number, unitPrice: number, fees = 0): IStockTransaction =>
  ({
    ticker: "PETR4",
    broker: "XP",
    type: "VENDA",
    operationType: "NORMAL",
    date: new Date(date),
    quantity,
    unitPrice,
    fees,
  }) as IStockTransaction;

test("gross revenue is the sale volume and fees only reduce the gain", async () => {
  const useCase = buildUseCase([buy("2026-01-10T00:00:00.000Z", 100, 10), sell("2026-03-10T00:00:00.000Z", 100, 15, 50)]);

  const [march] = await useCase.execute({ userId: "user-1", year: 2026 });

  assert.equal(march.grossRevenue, 1500);
  assert.equal(march.netGain, 450);
});

test("a month selling just above the exemption ceiling is taxable even after fees", async () => {
  const useCase = buildUseCase([
    buy("2026-01-10T00:00:00.000Z", 1000, 10),
    sell("2026-04-10T00:00:00.000Z", 1000, 20.05, 100),
  ]);

  const [april] = await useCase.execute({ userId: "user-1", year: 2026 });

  assert.equal(april.grossRevenue, 20050);
  assert.equal(april.isExempt, false);
});

test("a month at the exemption ceiling stays exempt", async () => {
  const useCase = buildUseCase([
    buy("2026-01-10T00:00:00.000Z", 1000, 10),
    sell("2026-05-10T00:00:00.000Z", 1000, 20),
  ]);

  const [may] = await useCase.execute({ userId: "user-1", year: 2026 });

  assert.equal(may.grossRevenue, 20000);
  assert.equal(may.isExempt, true);
});
