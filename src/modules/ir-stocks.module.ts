import { Module } from "@nestjs/common";
import { IrStocksController } from "./ir-stocks.controller";
import { AuthModule } from "./auth.module";
import { StockTransactionRepository } from "../repositories/stock-transaction.repository";
import { ListStockTransactionsUseCase } from "../use-cases/ir-stocks/list-stock-transactions.use-case";
import { CreateStockTransactionUseCase } from "../use-cases/ir-stocks/create-stock-transaction.use-case";
import { DeleteStockTransactionUseCase } from "../use-cases/ir-stocks/delete-stock-transaction.use-case";
import { GetStockPositionsUseCase } from "../use-cases/ir-stocks/get-stock-positions.use-case";
import { GetStockGainsByMonthUseCase } from "../use-cases/ir-stocks/get-stock-gains-by-month.use-case";

@Module({
  imports: [AuthModule],
  controllers: [IrStocksController],
  providers: [
    StockTransactionRepository,
    ListStockTransactionsUseCase,
    CreateStockTransactionUseCase,
    DeleteStockTransactionUseCase,
    GetStockPositionsUseCase,
    GetStockGainsByMonthUseCase,
  ],
})
export class IrStocksModule {}
