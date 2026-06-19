import { Injectable } from "@nestjs/common";
import type { Category } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";

export const DEFAULT_CATEGORIES: { name: string; icon: string }[] = [
  { name: "Alimentação", icon: "UtensilsCrossed" },
  { name: "Transporte", icon: "Car" },
  { name: "Lazer", icon: "Clapperboard" },
  { name: "Compras", icon: "ShoppingBag" },
  { name: "Saúde", icon: "Pill" },
  { name: "Educação", icon: "GraduationCap" },
  { name: "Contas", icon: "FileText" },
  { name: "Eletrônicos", icon: "Laptop" },
  { name: "Viagem", icon: "Plane" },
  { name: "Outros", icon: "Package" },
];

export const PROTECTED_CATEGORY_NAME = "Outros";

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
  ): Promise<Category> {
    return prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Category> {
    return prisma.category.delete({ where: { id } });
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
