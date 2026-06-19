import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client/client";
import type { User } from "../generated/prisma/client/client";
import { prisma } from "../config/prisma";
import type { IUser } from "../interfaces/user";
import { normalizeCpf, normalizeRg } from "../utils/br-documents";
import { blindIndex, decryptField, encryptField } from "../utils/encryption";
import { AppError } from "../utils/app-error";
import { CacheService } from "../services/cache.service";

const mapUser = (row: User): IUser => ({
  id: row.id,
  _id: row.id,
  name: row.name,
  lastName: row.lastName,
  email: row.email,
  cpf: row.cpf ?? undefined,
  rg: row.rg == null ? undefined : decryptField(row.rg),
  phone: row.phone ?? undefined,
  salary: row.salary == null ? undefined : Number(decryptField(row.salary)),
  avatar: row.avatar ?? undefined,
  lastLogin: row.lastLogin,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const throwIfDocumentConflict = (error: unknown): void => {
  if (!(error instanceof Error)) return;
  const { message } = error;
  if (message.includes("users_cpf_key") || message.includes("users_rg_hash_key")) {
    throw new AppError("CPF ou RG ja cadastrado", 409);
  }
};

const notFound = (): never => {
  const error = new AppError("Resource not found", 404);
  (error as AppError).name = "DocumentNotFoundError";
  throw error;
};

export type CreateUserData = {
  name: string;
  lastName: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  rg?: string | null;
  salary?: number | null;
  avatar?: string | null;
  lastLogin?: Date | null;
};

export type UpdateUserData = {
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cpf?: string | null;
  rg?: string | null;
  salary?: number | null;
  avatar?: string;
  lastLogin?: Date;
};

@Injectable()
export class UserRepository {
  constructor(private readonly cacheService: CacheService) {}

  async findById(id: string): Promise<IUser> {
    const cacheKey = `user:${id}`;
    const cached = this.cacheService.get<IUser>(cacheKey);
    if (cached) return cached;

    const row = await prisma.user.findUnique({ where: { id } });
    if (!row) notFound();

    const user = mapUser(row!);
    this.cacheService.set(cacheKey, user, ["user", `user:${id}`]);
    return user;
  }

  async findMany(): Promise<IUser[]> {
    const cacheKey = "users:all";
    const cached = this.cacheService.get<IUser[]>(cacheKey);
    if (cached) return cached;

    const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    const users = rows.map(mapUser);
    this.cacheService.set(cacheKey, users, ["user", "users:all"]);
    return users;
  }

  async findByEmail(email: string, updateLastLogin = false): Promise<IUser> {
    const normalized = email.trim().toLowerCase();
    const cacheKey = `user:email:${normalized}`;

    if (updateLastLogin) {
      const row = await prisma.user.update({
        where: { email: normalized },
        data: { lastLogin: new Date() },
      }).catch(() => null);

      if (!row) notFound();

      const user = mapUser(row!);
      this.cacheService.invalidate([`user:${row!.id}`, `user:email:${normalized}`]);
      return user;
    }

    const cached = this.cacheService.get<IUser>(cacheKey);
    if (cached) return cached;

    const row = await prisma.user.findUnique({ where: { email: normalized } });
    if (!row) notFound();

    const user = mapUser(row!);
    this.cacheService.set(cacheKey, user, ["user", `user:email:${normalized}`, `user:${row!.id}`]);
    return user;
  }

  async create(data: CreateUserData): Promise<IUser> {
    const normalizedRg = data.rg ? normalizeRg(data.rg) : null;

    let row: User;
    try {
      row = await prisma.user.create({
        data: {
          name: data.name,
          lastName: data.lastName,
          email: data.email.trim().toLowerCase(),
          cpf: data.cpf ? normalizeCpf(data.cpf) : null,
          rg: normalizedRg ? encryptField(normalizedRg) : null,
          rgHash: normalizedRg ? blindIndex(normalizedRg) : null,
          phone: data.phone ?? null,
          salary: data.salary == null ? null : encryptField(String(data.salary)),
          avatar: data.avatar ?? null,
          lastLogin: data.lastLogin ?? null,
        },
      });
    } catch (error) {
      throwIfDocumentConflict(error);
      throw error;
    }

    return mapUser(row);
  }

  async update(id: string, data: UpdateUserData): Promise<IUser> {
    const payload: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) payload.name = data.name;
    if (data.lastName !== undefined) payload.lastName = data.lastName;
    if (data.email !== undefined) payload.email = data.email.trim().toLowerCase();
    if (data.cpf !== undefined) payload.cpf = data.cpf ? normalizeCpf(data.cpf) : null;
    if (data.rg !== undefined) {
      const normalizedRg = data.rg ? normalizeRg(data.rg) : null;
      payload.rg = normalizedRg ? encryptField(normalizedRg) : null;
      payload.rgHash = normalizedRg ? blindIndex(normalizedRg) : null;
    }
    if (data.phone !== undefined) payload.phone = data.phone;
    if (data.salary !== undefined) {
      payload.salary = data.salary == null ? null : encryptField(String(data.salary));
    }
    if (data.avatar !== undefined) payload.avatar = data.avatar;
    if (data.lastLogin !== undefined) payload.lastLogin = data.lastLogin;

    let row: User | null = null;
    try {
      row = await prisma.user.update({ where: { id }, data: payload });
    } catch (error) {
      throwIfDocumentConflict(error);
    }

    if (!row) notFound();

    return mapUser(row!);
  }

  async delete(id: string): Promise<IUser> {
    const row = await prisma.user.delete({ where: { id } }).catch(() => null);
    if (!row) notFound();
    return mapUser(row!);
  }
}
