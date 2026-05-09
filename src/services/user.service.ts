import { Injectable } from "@nestjs/common";
import { IUser } from "../models/User";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { prisma } from "../lib/prisma";
import { hashPassword } from "./auth.service";

const mapUser = (row: any): IUser => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  lastName: row.lastName,
  email: row.email,
  phone: row.phone ?? undefined,
  salary: row.salary == null ? undefined : Number(row.salary),
  avatar: row.avatar ?? undefined,
  lastLogin: row.lastLogin,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const notFound = (): never => {
  const error = new AppError("Resource not found", 404);
  (error as Error).name = "DocumentNotFoundError";
  throw error;
};

@Injectable()
export class UserService {
  async getAll(): Promise<IUser[]> {
    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(mapUser);
  }

  async findById(id: string): Promise<IUser> {
    const row = await prisma.user.findUnique({ where: { id } });
    if (!row) {
      notFound();
    }
    return mapUser(row);
  }

  async update(id: string, data: Partial<IUser> & { password?: string }): Promise<IUser> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.lastLogin !== undefined) updateData.lastLogin = data.lastLogin;
    if (data.password) updateData.passwordHash = await hashPassword(data.password);

    const row = await prisma.user.update({
      where: { id },
      data: updateData,
    }).catch(() => null);

    if (!row) {
      notFound();
    }

    return mapUser(row);
  }

  async delete(id: string): Promise<IUser> {
    const row = await prisma.user.delete({ where: { id } }).catch(() => null);

    if (!row) {
      notFound();
    }

    return mapUser(row);
  }

  async findByEmail(email: string, updateLastLogin = false): Promise<IUser> {
    const normalized = email.trim().toLowerCase();

    if (updateLastLogin) {
      const row = await prisma.user.update({
        where: { email: normalized },
        data: { lastLogin: new Date() },
      }).catch(() => null);

      if (!row) {
        notFound();
      }

      return mapUser(row);
    }

    const row = await prisma.user.findUnique({ where: { email: normalized } });
    if (!row) {
      notFound();
    }
    return mapUser(row);
  }

  async createUser(data: Partial<IUser> & { password?: string }): Promise<IUser> {
    const payload = {
      ...data,
      email: data.email?.trim().toLowerCase(),
      lastLogin: data.lastLogin ?? new Date(),
    };

    const passwordHash = data.password ? await hashPassword(data.password) : null;

    const row = await prisma.user.create({
      data: {
        name: payload.name!,
        lastName: payload.lastName!,
        email: payload.email!,
        passwordHash,
        phone: payload.phone ?? null,
        salary: payload.salary ?? null,
        avatar: payload.avatar ?? null,
        lastLogin: payload.lastLogin ?? null,
      },
    });

    const user = mapUser(row);
    logger.info({ userId: user.id, email: user.email }, "User created");
    return user;
  }
}
