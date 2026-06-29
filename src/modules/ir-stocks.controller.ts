import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { CreateStockTransactionDto, StockTransactionQueryDto } from "../dto/stock-transaction.dto";
import { SessionAuthGuard } from "../guards/session-auth.guard";
import { ApiTags } from "@nestjs/swagger";
import { validateDto } from "../utils/validation";
import { AppError } from "../utils/app-error";
import { ListStockTransactionsUseCase } from "../use-cases/ir-stocks/list-stock-transactions.use-case";
import { CreateStockTransactionUseCase } from "../use-cases/ir-stocks/create-stock-transaction.use-case";
import { DeleteStockTransactionUseCase } from "../use-cases/ir-stocks/delete-stock-transaction.use-case";
import { GetStockPositionsUseCase } from "../use-cases/ir-stocks/get-stock-positions.use-case";
import { GetStockGainsByMonthUseCase } from "../use-cases/ir-stocks/get-stock-gains-by-month.use-case";
import { GetTickerInfoUseCase } from "../use-cases/ir-stocks/get-ticker-info.use-case";
import { GetTopBrokersUseCase } from "../use-cases/ir-stocks/get-top-brokers.use-case";
import { BatchCreateStockTransactionsUseCase } from "../use-cases/ir-stocks/batch-create-stock-transactions.use-case";
import { DeleteAllStockTransactionsUseCase } from "../use-cases/ir-stocks/delete-all-stock-transactions.use-case";

@ApiTags("ir-stocks")
@UseGuards(SessionAuthGuard)
@Controller("ir-stocks")
export class IrStocksController {
  constructor(
    private readonly listStockTransactionsUseCase: ListStockTransactionsUseCase,
    private readonly createStockTransactionUseCase: CreateStockTransactionUseCase,
    private readonly deleteStockTransactionUseCase: DeleteStockTransactionUseCase,
    private readonly getStockPositionsUseCase: GetStockPositionsUseCase,
    private readonly getStockGainsByMonthUseCase: GetStockGainsByMonthUseCase,
    private readonly getTickerInfoUseCase: GetTickerInfoUseCase,
    private readonly getTopBrokersUseCase: GetTopBrokersUseCase,
    private readonly batchCreateStockTransactionsUseCase: BatchCreateStockTransactionsUseCase,
    private readonly deleteAllStockTransactionsUseCase: DeleteAllStockTransactionsUseCase,
  ) {}

  @Get()
  async list(@Query() query: StockTransactionQueryDto, @Req() req: FastifyRequest) {
    return this.listStockTransactionsUseCase.execute({
      userId: req.authUser!.userId,
      year: Number(query.year),
    });
  }

  @Get("positions")
  async positions(@Query() query: StockTransactionQueryDto, @Req() req: FastifyRequest) {
    return this.getStockPositionsUseCase.execute({
      userId: req.authUser!.userId,
      year: Number(query.year),
    });
  }

  @Get("gains-by-month")
  async gainsByMonth(@Query() query: StockTransactionQueryDto, @Req() req: FastifyRequest) {
    return this.getStockGainsByMonthUseCase.execute({
      userId: req.authUser!.userId,
      year: Number(query.year),
    });
  }

  @Get("top-brokers")
  async topBrokers(@Req() req: FastifyRequest) {
    return this.getTopBrokersUseCase.execute({ userId: req.authUser!.userId });
  }

  @Get("ticker-info/:ticker")
  async tickerInfo(@Param("ticker") ticker: string) {
    if (!ticker || ticker.length > 10) throw new BadRequestException("Ticker inválido");
    return this.getTickerInfoUseCase.execute({ ticker });
  }

  @Post("batch")
  @HttpCode(HttpStatus.CREATED)
  async batchCreate(@Body() body: { transactions: CreateStockTransactionDto[] }, @Req() req: FastifyRequest) {
    if (!Array.isArray(body?.transactions) || body.transactions.length === 0) {
      throw new AppError("transactions deve ser um array não vazio", 400);
    }
    return this.batchCreateStockTransactionsUseCase.execute({
      userId: req.authUser!.userId,
      transactions: body.transactions,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateStockTransactionDto, @Req() req: FastifyRequest) {
    const { valid, errors } = await validateDto(CreateStockTransactionDto, body);
    if (!valid) throw new AppError("Dados inválidos", 400, errors);

    return this.createStockTransactionUseCase.execute({
      ...body,
      userId: req.authUser!.userId,
    });
  }

  @Delete()
  async deleteAll(@Req() req: FastifyRequest) {
    return this.deleteAllStockTransactionsUseCase.execute({ userId: req.authUser!.userId });
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @Req() req: FastifyRequest) {
    await this.deleteStockTransactionUseCase.execute({ id, userId: req.authUser!.userId });
    return { message: "Transação removida" };
  }
}
