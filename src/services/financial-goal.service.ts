import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "../lib/prisma";
import { CreateFinancialGoalDto, UpdateFinancialGoalDto } from "../dto/financial-goal.dto";
import { Prisma } from "../generated/prisma/client/client";

@Injectable()
export class FinancialGoalService {
  async create(userId: string, dto: CreateFinancialGoalDto) {
    const goal = await prisma.financialGoal.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount ?? 0,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        category: dto.category,
        status: "active",
      },
    });
    return this.format(goal);
  }

  async listByUser(userId: string, status?: string) {
    const where: Prisma.FinancialGoalWhereInput = { userId };
    if (status) where.status = status;

    const goals = await prisma.financialGoal.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return goals.map((g) => this.format(g));
  }

  async getById(id: string, userId: string) {
    const goal = await prisma.financialGoal.findFirst({
      where: { id, userId },
    });
    if (!goal) throw new NotFoundException("Meta não encontrada");
    return this.format(goal);
  }

  async update(id: string, userId: string, dto: UpdateFinancialGoalDto) {
    const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException("Meta não encontrada");

    const updated = await prisma.financialGoal.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        targetAmount: dto.targetAmount,
        currentAmount: dto.currentAmount,
        deadline: dto.deadline !== undefined
          ? (dto.deadline ? new Date(dto.deadline) : null)
          : undefined,
        category: dto.category,
        status: dto.status,
      },
    });
    return this.format(updated);
  }

  async delete(id: string, userId: string) {
    const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException("Meta não encontrada");
    await prisma.financialGoal.delete({ where: { id } });
  }

  private format(goal: {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    targetAmount: Prisma.Decimal;
    currentAmount: Prisma.Decimal;
    deadline: Date | null;
    category: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: goal.id,
      userId: goal.userId,
      name: goal.name,
      description: goal.description,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      deadline: goal.deadline ? goal.deadline.toISOString().split("T")[0] : null,
      category: goal.category,
      status: goal.status,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }
}
