import { Injectable } from "@nestjs/common";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/app-error";

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

const PROTECTED_NAME = "Outros";

@Injectable()
export class CategoryService {
  private async ensureSeeded(userId: string): Promise<void> {
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

  private async findByNameInsensitive(userId: string, name: string) {
    return prisma.category.findFirst({
      where: { userId, name: { equals: name, mode: "insensitive" } },
    });
  }

  async list(userId: string, includeHidden = false) {
    await this.ensureSeeded(userId);
    return prisma.category.findMany({
      where: { userId, ...(includeHidden ? {} : { isHidden: false }) },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async create(userId: string, name: string, icon: string) {
    await this.ensureSeeded(userId);
    const trimmed = name.trim();
    if (!trimmed) throw new AppError("Nome da categoria é obrigatório", 400);

    const existing = await this.findByNameInsensitive(userId, trimmed);
    if (existing) {
      if (existing.isHidden) {
        return prisma.category.update({
          where: { id: existing.id },
          data: { isHidden: false, icon },
        });
      }
      throw new AppError("Já existe uma categoria com esse nome", 409);
    }

    const last = await prisma.category.findFirst({
      where: { userId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    return prisma.category.create({
      data: {
        userId,
        name: trimmed,
        icon,
        isDefault: false,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(id: string, userId: string, data: { name?: string; icon?: string }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category || category.userId !== userId) {
      throw new AppError("Categoria não encontrada", 404);
    }

    const patch: { name?: string; icon?: string } = {};

    if (data.icon !== undefined) patch.icon = data.icon;

    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (!trimmed) throw new AppError("Nome da categoria é obrigatório", 400);
      if (category.name === PROTECTED_NAME && trimmed !== PROTECTED_NAME) {
        throw new AppError("A categoria \"Outros\" não pode ser renomeada", 400);
      }
      if (trimmed.toLowerCase() !== category.name.toLowerCase()) {
        const clash = await this.findByNameInsensitive(userId, trimmed);
        if (clash && clash.id !== id) {
          throw new AppError("Já existe uma categoria com esse nome", 409);
        }
      }
      patch.name = trimmed;
    }

    return prisma.category.update({ where: { id }, data: patch });
  }

  async remove(id: string, userId: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category || category.userId !== userId) {
      throw new AppError("Categoria não encontrada", 404);
    }
    if (category.name === PROTECTED_NAME) {
      throw new AppError("A categoria \"Outros\" não pode ser removida", 400);
    }
    if (category.isDefault) {
      return prisma.category.update({ where: { id }, data: { isHidden: true } });
    }
    return prisma.category.delete({ where: { id } });
  }

  async restoreDefaults(userId: string) {
    await this.ensureSeeded(userId);
    const existing = await prisma.category.findMany({ where: { userId } });
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

    return this.list(userId);
  }
}
