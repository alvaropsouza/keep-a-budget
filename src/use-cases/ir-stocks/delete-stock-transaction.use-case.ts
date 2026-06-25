import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";
import { AppError } from "../../utils/app-error";

export type DeleteStockTransactionInput = { id: string; userId: string };

@Injectable()
export class DeleteStockTransactionUseCase {
  private readonly logger = new Logger(DeleteStockTransactionUseCase.name);

  constructor(private readonly stockTransactionRepository: StockTransactionRepository) {}

  async execute(input: DeleteStockTransactionInput): Promise<void> {
    this.logger.log({ id: input.id, userId: input.userId }, "DeleteStockTransactionUseCase.execute");

    const transaction = await this.stockTransactionRepository.findById(input.id);
    if (!transaction) throw new AppError("Transação não encontrada", 404);
    if (transaction.userId !== input.userId) throw new AppError("Acesso negado", 403);

    await this.stockTransactionRepository.delete(input.id);
    this.logger.log({ id: input.id }, "DeleteStockTransactionUseCase.execute done");
  }
}
