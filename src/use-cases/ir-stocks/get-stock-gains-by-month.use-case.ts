import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";
import type { IStockMonthlyGain, StockOperationType } from "../../interfaces/stock-transaction";

export type GetStockGainsByMonthInput = { userId: string; year: number };

const NORMAL_EXEMPTION_THRESHOLD = 20000;

type PositionState = { quantity: number; averageCost: number };

type MonthKey = `${number}-${StockOperationType}`;

function buildMonthKey(month: number, operationType: StockOperationType): MonthKey {
  return `${month}-${operationType}`;
}

@Injectable()
export class GetStockGainsByMonthUseCase {
  private readonly logger = new Logger(GetStockGainsByMonthUseCase.name);

  constructor(private readonly stockTransactionRepository: StockTransactionRepository) {}

  async execute(input: GetStockGainsByMonthInput): Promise<IStockMonthlyGain[]> {
    this.logger.log({ userId: input.userId, year: input.year }, "GetStockGainsByMonthUseCase.execute");

    const allTransactions = await this.stockTransactionRepository.findManyByUserId(input.userId);

    const positions = new Map<string, PositionState>();
    const monthlyGross = new Map<MonthKey, number>();
    const monthlyNetGain = new Map<MonthKey, number>();

    for (const tx of allTransactions) {
      const key = `${tx.ticker}::${tx.broker}`;

      if (tx.type === "COMPRA") {
        const pos = positions.get(key) ?? { quantity: 0, averageCost: 0 };
        const totalCost = pos.quantity * pos.averageCost + tx.quantity * tx.unitPrice + tx.fees;
        const totalQty = pos.quantity + tx.quantity;
        pos.averageCost = totalQty > 0 ? totalCost / totalQty : 0;
        pos.quantity = totalQty;
        positions.set(key, pos);
      } else {
        const pos = positions.get(key) ?? { quantity: 0, averageCost: 0 };
        const txYear = tx.date.getUTCFullYear();
        const txMonth = tx.date.getUTCMonth() + 1;

        if (txYear === input.year) {
          const grossRevenue = tx.quantity * tx.unitPrice - tx.fees;
          const costBasis = tx.quantity * pos.averageCost;
          const netGain = grossRevenue - costBasis;
          const mKey = buildMonthKey(txMonth, tx.operationType);

          monthlyGross.set(mKey, (monthlyGross.get(mKey) ?? 0) + grossRevenue);
          monthlyNetGain.set(mKey, (monthlyNetGain.get(mKey) ?? 0) + netGain);
        }

        pos.quantity = Math.max(0, pos.quantity - tx.quantity);
        if (pos.quantity === 0) pos.averageCost = 0;
        positions.set(key, pos);
      }
    }

    const result: IStockMonthlyGain[] = [];
    for (const [mKey, grossRevenue] of monthlyGross.entries()) {
      const [monthStr, operationType] = mKey.split("-") as [string, StockOperationType];
      const month = Number(monthStr);
      const netGain = monthlyNetGain.get(mKey) ?? 0;
      const isExempt = operationType === "NORMAL" && grossRevenue <= NORMAL_EXEMPTION_THRESHOLD;

      result.push({ month, year: input.year, operationType, grossRevenue, netGain, isExempt });
    }

    result.sort((a, b) => a.month - b.month || a.operationType.localeCompare(b.operationType));
    this.logger.log({ count: result.length }, "GetStockGainsByMonthUseCase.execute done");
    return result;
  }
}
