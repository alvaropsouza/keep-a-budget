import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IIrDocument } from "../interfaces/ir-document";

const toNumber = (value: unknown): number => (value == null ? 0 : Number(value));

const mapDocument = (row: Prisma.IrDocumentGetPayload<true>): IIrDocument => ({
  id: row.id,
  userId: row.userId,
  date: new Date(row.date),
  category: row.category,
  amount: toNumber(row.amount),
  description: row.description ?? undefined,
  receipt: row.receipt,
  year: row.year,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class IrDocumentRepository {
  async findMany(userId: string, year: number): Promise<IIrDocument[]> {
    const rows = await prisma.irDocument.findMany({
      where: { userId, year },
      orderBy: [{ category: "asc" }, { date: "asc" }],
    });
    return rows.map(mapDocument);
  }

  async findById(id: string): Promise<IIrDocument | null> {
    const row = await prisma.irDocument.findUnique({ where: { id } });
    return row ? mapDocument(row) : null;
  }

  async create(data: {
    userId: string;
    date: Date;
    category: string;
    amount: number;
    description?: string;
    receipt: string;
    year: number;
  }): Promise<IIrDocument> {
    const row = await prisma.irDocument.create({
      data: {
        userId: data.userId,
        date: data.date,
        category: data.category,
        amount: data.amount,
        description: data.description ?? null,
        receipt: data.receipt,
        year: data.year,
      },
    });
    return mapDocument(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.irDocument.delete({ where: { id } });
  }
}
