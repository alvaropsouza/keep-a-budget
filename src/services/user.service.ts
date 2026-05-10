import { Injectable } from "@nestjs/common";
import { IUser } from "../models/User";
import logger from "../config/logger";
import { AppError } from "../utils/AppError";
import { prisma } from "../lib/prisma";
import { hashPassword } from "./auth.service";
import { isValidCpf, isValidRg, normalizeCpf, normalizeRg } from "../utils/brDocuments";
import type { User } from "../generated/prisma/client";

const mapUser = (row: User): IUser => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  lastName: row.lastName,
  email: row.email,
  cpf: row.cpf ?? undefined,
  rg: row.rg ?? undefined,
  phone: row.phone ?? undefined,
  salary: row.salary == null ? undefined : Number(row.salary),
  avatar: row.avatar ?? undefined,
  lastLogin: row.lastLogin,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const ensureValidDocuments = (data: Partial<IUser>): void => {
  if (data.cpf !== undefined) {
    const cpf = normalizeCpf(data.cpf);
    if (cpf && !isValidCpf(cpf)) {
      throw new AppError("CPF invalido", 400);
    }
  }

  if (data.rg !== undefined) {
    const rg = normalizeRg(data.rg);
    if (rg && !isValidRg(rg)) {
      throw new AppError("RG invalido", 400);
    }
  }
};

const notFound = (): never => {
  const error = new AppError("Resource not found", 404);
  (error as Error).name = "DocumentNotFoundError";
  throw error;
};

const throwIfDocumentConflict = (error: unknown): void => {
  if (!(error instanceof Error)) return;
  const message = error.message;
  if (message.includes("users_cpf_key") || message.includes("users_rg_key")) {
    throw new AppError("CPF ou RG ja cadastrado", 409);
  }
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
    ensureValidDocuments(data);
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.cpf !== undefined) updateData.cpf = data.cpf ? normalizeCpf(data.cpf) : null;
    if (data.rg !== undefined) updateData.rg = data.rg ? normalizeRg(data.rg) : null;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.salary !== undefined) updateData.salary = data.salary;
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.lastLogin !== undefined) updateData.lastLogin = data.lastLogin;
    if (data.password) updateData.passwordHash = await hashPassword(data.password);

    let row: User | null = null;
    try {
      row = await prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      throwIfDocumentConflict(error);
      row = null;
    }

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
    ensureValidDocuments(data);
    const payload = {
      ...data,
      email: data.email?.trim().toLowerCase(),
      cpf: data.cpf ? normalizeCpf(data.cpf) : undefined,
      rg: data.rg ? normalizeRg(data.rg) : undefined,
      lastLogin: data.lastLogin ?? new Date(),
    };

    const passwordHash = data.password ? await hashPassword(data.password) : null;

    let row: User;
    try {
      row = await prisma.user.create({
        data: {
          name: payload.name!,
          lastName: payload.lastName!,
          email: payload.email!,
          cpf: payload.cpf ?? null,
          rg: payload.rg ?? null,
          passwordHash,
          phone: payload.phone ?? null,
          salary: payload.salary ?? null,
          avatar: payload.avatar ?? null,
          lastLogin: payload.lastLogin ?? null,
        },
      });
    } catch (error) {
      throwIfDocumentConflict(error);
      throw error;
    }

    const user = mapUser(row);
    logger.info({ userId: user.id, email: user.email }, "User created");
    return user;
  }
}
