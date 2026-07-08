import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IPaymentMethod } from "../interfaces/payment-method";
import type { PaymentMethodTypeEnum } from "../enums/payment-method-type.enum";
import type { TxClient } from "../utils/run-with-transaction";

const mapPaymentMethod = (row: Prisma.PaymentMethodGetPayload<true>): IPaymentMethod => ({
  id: row.id,
  _id: row.id,
  userId: row.userId,
  name: row.name,
  type: row.type as PaymentMethodTypeEnum,
  color: row.color ?? undefined,
  closingDay: row.closingDay ?? undefined,
  dueDay: row.dueDay ?? undefined,
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

@Injectable()
export class PaymentMethodRepository {
  async findMany(userId: string, isActive?: boolean): Promise<IPaymentMethod[]> {
    const rows = await prisma.paymentMethod.findMany({
      where: { userId, ...(isActive !== undefined ? { isActive } : {}) },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });
    return rows.map(mapPaymentMethod);
  }

  async findById(id: string): Promise<IPaymentMethod | null> {
    const row = await prisma.paymentMethod.findUnique({ where: { id } });
    return row ? mapPaymentMethod(row) : null;
  }

  async findByName(userId: string, name: string, tx?: TxClient): Promise<IPaymentMethod | null> {
    const db = tx ?? prisma;
    const row = await db.paymentMethod.findUnique({
      where: { userId_name: { userId, name } },
    });
    return row ? mapPaymentMethod(row) : null;
  }

  async create(data: {
    userId: string;
    name: string;
    type: string;
    color?: string;
    closingDay?: number;
    dueDay?: number;
  }): Promise<IPaymentMethod> {
    const row = await prisma.paymentMethod.create({
      data: {
        userId: data.userId,
        name: data.name,
        type: data.type,
        color: data.color ?? null,
        closingDay: data.closingDay ?? null,
        dueDay: data.dueDay ?? null,
      },
    });
    return mapPaymentMethod(row);
  }

  async update(
    id: string,
    data: { name?: string; color?: string; closingDay?: number; dueDay?: number; isActive?: boolean },
    tx?: TxClient,
  ): Promise<IPaymentMethod | null> {
    const db = tx ?? prisma;
    const row = await db.paymentMethod.update({ where: { id }, data }).catch(() => null);
    return row ? mapPaymentMethod(row) : null;
  }

  async renameUsages(userId: string, oldName: string, newName: string, tx: TxClient): Promise<void> {
    await tx.expense.updateMany({ where: { userId, bank: oldName }, data: { bank: newName } });
    await tx.cardInvoice.updateMany({ where: { userId, bank: oldName }, data: { bank: newName } });
  }

  async delete(id: string): Promise<IPaymentMethod | null> {
    const row = await prisma.paymentMethod.delete({ where: { id } }).catch(() => null);
    return row ? mapPaymentMethod(row) : null;
  }

  async countUsages(userId: string, name: string): Promise<number> {
    const [expenses, invoices] = await Promise.all([
      prisma.expense.count({ where: { userId, bank: name } }),
      prisma.cardInvoice.count({ where: { userId, bank: name } }),
    ]);
    return expenses + invoices;
  }
}
