import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";
import type { IStockTransaction, IStockPosition } from "../../interfaces/stock-transaction";

export type GetStockPositionsInput = { userId: string; year: number };

type PositionState = {
  ticker: string;
  companyName: string;
  cnpj?: string;
  broker: string;
  quantity: number;
  averageCost: number;
};

function applyTransaction(positions: Map<string, PositionState>, tx: IStockTransaction): void {
  const key = `${tx.ticker}::${tx.broker}`;
  const pos = positions.get(key) ?? {
    ticker: tx.ticker,
    companyName: tx.companyName,
    cnpj: tx.cnpj,
    broker: tx.broker,
    quantity: 0,
    averageCost: 0,
  };

  if (tx.type === "COMPRA") {
    const totalCost = pos.quantity * pos.averageCost + tx.quantity * tx.unitPrice + tx.fees;
    const totalQty = pos.quantity + tx.quantity;
    pos.averageCost = totalQty > 0 ? totalCost / totalQty : 0;
    pos.quantity = totalQty;
    pos.companyName = tx.companyName;
    if (tx.cnpj) pos.cnpj = tx.cnpj;
  } else {
    pos.quantity = Math.max(0, pos.quantity - tx.quantity);
    if (pos.quantity === 0) pos.averageCost = 0;
  }

  positions.set(key, pos);
}

@Injectable()
export class GetStockPositionsUseCase {
  private readonly logger = new Logger(GetStockPositionsUseCase.name);

  constructor(private readonly stockTransactionRepository: StockTransactionRepository) {}

  async execute(input: GetStockPositionsInput): Promise<IStockPosition[]> {
    this.logger.log({ userId: input.userId, year: input.year }, "GetStockPositionsUseCase.execute");

    const transactions = await this.stockTransactionRepository.findManyByUserId(input.userId);
    const endOfYear = new Date(Date.UTC(input.year, 11, 31));

    const positions = new Map<string, PositionState>();
    for (const tx of transactions) {
      if (tx.date <= endOfYear) {
        applyTransaction(positions, tx);
      }
    }

    const result: IStockPosition[] = [];
    for (const pos of positions.values()) {
      if (pos.quantity > 0) {
        result.push({
          ticker: pos.ticker,
          companyName: pos.companyName,
          cnpj: pos.cnpj,
          broker: pos.broker,
          quantity: pos.quantity,
          averageCost: pos.averageCost,
          totalCost: pos.quantity * pos.averageCost,
        });
      }
    }

    result.sort((a, b) => a.ticker.localeCompare(b.ticker));
    this.logger.log({ count: result.length }, "GetStockPositionsUseCase.execute done");
    return result;
  }
}
