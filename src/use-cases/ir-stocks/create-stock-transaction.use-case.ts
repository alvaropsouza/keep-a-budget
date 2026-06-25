import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";
import type { IStockTransaction, StockTransactionType, StockOperationType } from "../../interfaces/stock-transaction";

export type CreateStockTransactionInput = {
  userId: string;
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
};

@Injectable()
export class CreateStockTransactionUseCase {
  private readonly logger = new Logger(CreateStockTransactionUseCase.name);

  constructor(private readonly stockTransactionRepository: StockTransactionRepository) {}

  async execute(input: CreateStockTransactionInput): Promise<IStockTransaction> {
    this.logger.log({ userId: input.userId, ticker: input.ticker, type: input.type }, "CreateStockTransactionUseCase.execute");

    const date = new Date(input.date);
    const year = date.getUTCFullYear();

    const result = await this.stockTransactionRepository.create({
      userId: input.userId,
      ticker: input.ticker,
      companyName: input.companyName,
      cnpj: input.cnpj,
      broker: input.broker,
      date,
      type: input.type,
      operationType: input.operationType,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      fees: input.fees,
      year,
    });

    this.logger.log({ id: result.id, ticker: result.ticker, year }, "CreateStockTransactionUseCase.execute done");
    return result;
  }
}
