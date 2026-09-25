import { Injectable } from "@nestjs/common";
import type { Category } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { TxClient } from "../utils/run-with-transaction";
import {
  DEFAULT_CATEGORIES,
  FIXED_EXPENSE_CATEGORY,
  PROTECTED_CATEGORY_ICON,
  PROTECTED_CATEGORY_NAME,
} from "../utils/categories";

export { DEFAULT_CATEGORIES, FIXED_EXPENSE_CATEGORY, PROTECTED_CATEGORY_ICON, PROTECTED_CATEGORY_NAME };

@Injectable()
export class CategoryRepository {
  async ensureSeeded(userId: string): Promise<void> {
    const count = await prisma.category.count({ where: { userId } });
    if (count > 0) return;
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c, index) => ({
        userId,
        name: c.name,
        icon: c.icon,
        isDefault: true,
        sortOrder: index,
      })),
    });
  }

  async ensureExists(userId: string, name: string, icon: string): Promise<Category> {
    const existing = await this.findByNameInsensitive(userId, name);
    if (existing) return existing;

    const sortOrder = (await this.findLastSortOrder(userId)) + 1;
    return prisma.category.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name, icon, isDefault: true, sortOrder },
    });
  }

  async findMany(userId: string, includeHidden: boolean): Promise<Category[]> {
    return prisma.category.findMany({
      where: { userId, ...(includeHidden ? {} : { isHidden: false }) },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async findAll(userId: string): Promise<Category[]> {
    return prisma.category.findMany({ where: { userId } });
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({ where: { id } });
  }

  async findByNameInsensitive(userId: string, name: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
    });
  }

  async findLastSortOrder(userId: string): Promise<number> {
    const last = await prisma.category.findFirst({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    return last?.sortOrder ?? -1;
  }

  async create(data: {
    userId: string;
    name: string;
    icon: string;
    isDefault: boolean;
    sortOrder: number;
  }): Promise<Category> {
    return prisma.category.create({ data });
  }

  async update(
    id: string,
    data: { name?: string; icon?: string; isHidden?: boolean; isDefault?: boolean; sortOrder?: number },
    tx?: TxClient,
  ): Promise<Category> {
    const db = tx ?? prisma;
    return db.category.update({ where: { id }, data });
  }

  async renameUsages(userId: string, oldName: string, newName: string, tx: TxClient): Promise<void> {
    await tx.expense.updateMany({ where: { userId, category: oldName }, data: { category: newName } });
    await tx.fixedExpense.updateMany({ where: { userId, category: oldName }, data: { category: newName } });
    await tx.irDocument.updateMany({ where: { userId, category: oldName }, data: { category: newName } });

    const periodKey = (row: { month: number; year: number }): string => `${row.year}-${row.month}`;
    const taken = await tx.budget.findMany({
      where: { userId, category: newName },
      select: { month: true, year: true },
    });
    const takenPeriods = new Set(taken.map(periodKey));
    const current = await tx.budget.findMany({
      where: { userId, category: oldName },
      select: { id: true, month: true, year: true },
    });
    const movableIds = current.filter((row) => !takenPeriods.has(periodKey(row))).map((row) => row.id);
    if (movableIds.length > 0) {
      await tx.budget.updateMany({ where: { id: { in: movableIds } }, data: { category: newName } });
    }
  }

  async delete(id: string, tx?: TxClient): Promise<Category> {
    const db = tx ?? prisma;
    return db.category.delete({ where: { id } });
  }

  async restoreDefaults(userId: string, existing: Category[]): Promise<void> {
    const byName = new Map(existing.map((c) => [c.name.toLowerCase(), c]));
    await prisma.$transaction(
      DEFAULT_CATEGORIES.map((def, index) => {
        const current = byName.get(def.name.toLowerCase());
        if (current) {
          return prisma.category.update({
            where: { id: current.id },
            data: { isHidden: false, isDefault: true, icon: def.icon, sortOrder: index },
          });
        }
        return prisma.category.create({
          data: { userId, name: def.name, icon: def.icon, isDefault: true, sortOrder: index },
        });
      }),
    );
  }
}
