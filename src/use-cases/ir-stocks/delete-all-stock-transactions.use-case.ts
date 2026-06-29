import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";

export type DeleteAllStockTransactionsInput = { userId: string };

@Injectable()
export class DeleteAllStockTransactionsUseCase {
  private readonly logger = new Logger(DeleteAllStockTransactionsUseCase.name);

  constructor(private readonly stockTransactionRepository: StockTransactionRepository) {}

  async execute(input: DeleteAllStockTransactionsInput): Promise<{ deleted: number }> {
    this.logger.log({ userId: input.userId }, "DeleteAllStockTransactionsUseCase.execute");
    const deleted = await this.stockTransactionRepository.deleteAllByUserId(input.userId);
    this.logger.log({ deleted }, "DeleteAllStockTransactionsUseCase.execute done");
    return { deleted };
  }
}
