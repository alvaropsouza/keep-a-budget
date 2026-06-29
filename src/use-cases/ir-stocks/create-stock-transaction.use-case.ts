import { Injectable, Logger } from "@nestjs/common";
import { StockTransactionRepository } from "../../repositories/stock-transaction.repository";
import { S3Service } from "../../services/s3.service";
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
  isOpeningBalance?: boolean;
  file?: { buffer: Buffer; filename: string; mimetype: string };
};

@Injectable()
export class CreateStockTransactionUseCase {
  private readonly logger = new Logger(CreateStockTransactionUseCase.name);

  constructor(
    private readonly stockTransactionRepository: StockTransactionRepository,
    private readonly s3Service: S3Service,
  ) {}

  async execute(input: CreateStockTransactionInput): Promise<IStockTransaction> {
    this.logger.log({ userId: input.userId, ticker: input.ticker, type: input.type }, "CreateStockTransactionUseCase.execute");

    let noteFile: string | undefined;
    if (input.file) {
      try {
        noteFile = await this.s3Service.upload(
          input.file.buffer,
          input.file.filename,
          input.file.mimetype,
          { keyPrefix: "ir-stocks/notes" },
        );
      } catch (err) {
        this.logger.error({ err }, "CreateStockTransactionUseCase: S3 upload failed");
      }
    }

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
      isOpeningBalance: input.isOpeningBalance,
      noteFile,
      year,
    });

    this.logger.log({ id: result.id, ticker: result.ticker, year }, "CreateStockTransactionUseCase.execute done");
    return result;
  }
}
