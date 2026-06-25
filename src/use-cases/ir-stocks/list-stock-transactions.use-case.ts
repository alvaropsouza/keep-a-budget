import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";
import type { IStockTransaction } from "../../interfaces/stock-transaction";

export type ListStockTransactionsInput = { userId: string; year: number };

@Injectable()
export class ListStockTransactionsUseCase {
  private readonly logger = new Logger(ListStockTransactionsUseCase.name);

  constructor(private readonly stockTransactionRepository: StockTransactionRepository) {}

  async execute(input: ListStockTransactionsInput): Promise<IStockTransaction[]> {
    this.logger.log({ userId: input.userId, year: input.year }, "ListStockTransactionsUseCase.execute");
    const result = await this.stockTransactionRepository.findMany(input.userId, input.year);
    this.logger.log({ count: result.length }, "ListStockTransactionsUseCase.execute done");
    return result;
  }
}
