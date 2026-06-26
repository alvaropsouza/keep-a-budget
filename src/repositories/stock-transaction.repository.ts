import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IStockTransaction, StockTransactionType, StockOperationType } from "../interfaces/stock-transaction";

const toNumber = (value: unknown): number => (value == null ? 0 : Number(value));

const mapTransaction = (row: Prisma.StockTransactionGetPayload<true>): IStockTransaction => ({
  id: row.id,
  userId: row.userId,
  ticker: row.ticker,
  companyName: row.companyName,
  cnpj: row.cnpj ?? undefined,
  broker: row.broker,
  date: new Date(row.date),
  type: row.type as StockTransactionType,
  operationType: row.operationType as StockOperationType,
  quantity: toNumber(row.quantity),
  unitPrice: toNumber(row.unitPrice),
  fees: toNumber(row.fees),
  year: row.year,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class StockTransactionRepository {
  async findMany(userId: string, year: number): Promise<IStockTransaction[]> {
    const rows = await prisma.stockTransaction.findMany({
      where: { userId, year },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapTransaction);
  }

  async findManyByUserId(userId: string): Promise<IStockTransaction[]> {
    const rows = await prisma.stockTransaction.findMany({
      where: { userId },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    return rows.map(mapTransaction);
  }

  async findById(id: string): Promise<IStockTransaction | null> {
    const row = await prisma.stockTransaction.findUnique({ where: { id } });
    return row ? mapTransaction(row) : null;
  }

  async create(data: {
    userId: string;
    ticker: string;
    companyName: string;
    cnpj?: string;
    broker: string;
    date: Date;
    type: StockTransactionType;
    operationType: StockOperationType;
    quantity: number;
    unitPrice: number;
    fees: number;
    year: number;
  }): Promise<IStockTransaction> {
    const row = await prisma.stockTransaction.create({
      data: {
        userId: data.userId,
        ticker: data.ticker.toUpperCase(),
        companyName: data.companyName,
        cnpj: data.cnpj ?? null,
        broker: data.broker,
        date: data.date,
        type: data.type,
        operationType: data.operationType,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        fees: data.fees,
        year: data.year,
      },
    });
    return mapTransaction(row);
  }

  async findTopBrokers(userId: string, limit = 5): Promise<string[]> {
    const rows = await prisma.stockTransaction.groupBy({
      by: ["broker"],
      where: { userId },
      _count: { broker: true },
      orderBy: { _count: { broker: "desc" } },
      take: limit,
    });
    return rows.map(r => r.broker);
  }

  async delete(id: string): Promise<void> {
    await prisma.stockTransaction.delete({ where: { id } });
  }
}
