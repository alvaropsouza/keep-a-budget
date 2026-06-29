import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";
import type { StockTransactionType, StockOperationType } from "../../interfaces/stock-transaction";

interface BatchItem {
  ticker: string;
  companyName: string;
  cnpj?: string;
  broker: string;
  date: string;
  type: StockTransactionType;
  operationType: StockOperationType;
  quantity: number;
  unitPrice: number;
  fees: number;
}

interface BatchCreateInput {
  userId: string;
  transactions: BatchItem[];
}

export interface BatchCreateOutput {
  imported: number;
}

@Injectable()
export class BatchCreateStockTransactionsUseCase {
  private readonly logger = new Logger(BatchCreateStockTransactionsUseCase.name);

  constructor(private readonly repo: StockTransactionRepository) {}

  async execute(input: BatchCreateInput): Promise<BatchCreateOutput> {
    this.logger.log({ userId: input.userId, count: input.transactions.length }, "BatchCreateStockTransactionsUseCase.execute");

    const items = input.transactions.map(tx => {
      const date = new Date(tx.date);
      return {
        userId: input.userId,
        ticker: tx.ticker,
        companyName: tx.companyName,
        cnpj: tx.cnpj,
        broker: tx.broker,
        date,
        type: tx.type,
        operationType: tx.operationType,
        quantity: tx.quantity,
        unitPrice: tx.unitPrice,
        fees: tx.fees,
        year: date.getUTCFullYear(),
      };
    });

    const imported = await this.repo.createMany(items);
    this.logger.log({ imported }, "BatchCreateStockTransactionsUseCase.execute done");
    return { imported };
  }
}
