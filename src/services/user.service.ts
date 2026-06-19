import { Inject, Injectable, Optional } from "@nestjs/common";
import { IUser } from "../models/user";
import logger from "../config/logger";
import { AppError } from "../utils/app-error";
import { prisma } from "../lib/prisma";
import { isValidCpf, isValidRg, normalizeCpf, normalizeRg } from "../utils/br-documents";
import { blindIndex, decryptField, encryptField } from "../utils/encryption";
import { CacheService } from "./cache.service";

interface UserRecord {
  id: string;
  name: string;
  lastName: string;
  email: string;
  cpf: string | null;
  rg: string | null;
  phone: string | null;
  salary: string | null;
  avatar: string | null;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const mapUser = (row: UserRecord): IUser => ({
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
  if (message.includes("users_cpf_key") || message.includes("users_rg_hash_key")) {
    throw new AppError("CPF ou RG ja cadastrado", 409);
  }
};

@Injectable()
export class UserService {
  private readonly cacheService: CacheService;

  constructor(@Optional() @Inject(CacheService) cacheService?: CacheService) {
    // Fallback defensivo para evitar falhas de runtime caso DI não resolva o provider.
    this.cacheService = cacheService ?? new CacheService();
  }

  async getAll(): Promise<IUser[]> {
    const cacheKey = "users:all";
    const cached = this.cacheService.get<IUser[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const rows = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    const users = rows.map(mapUser);
    this.cacheService.set(cacheKey, users, ["user", "users:all"]);
    return users;
  }

  async findById(id: string): Promise<IUser> {
    const cacheKey = `user:${id}`;
    const cached = this.cacheService.get<IUser>(cacheKey);
    if (cached) {
      return cached;
    }

    const row = await prisma.user.findUnique({ where: { id } });
    if (!row) {
      notFound();
    }
    const user = mapUser(row as UserRecord);
    this.cacheService.set(cacheKey, user, ["user", `user:${id}`]);
    return user;
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser> {
    ensureValidDocuments(data);
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.cpf !== undefined) updateData.cpf = data.cpf ? normalizeCpf(data.cpf) : null;
    if (data.rg !== undefined) {
      const normalizedRg = data.rg ? normalizeRg(data.rg) : null;
      updateData.rg = normalizedRg ? encryptField(normalizedRg) : null;
      updateData.rgHash = normalizedRg ? blindIndex(normalizedRg) : null;
    }
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.salary !== undefined) {
      updateData.salary = data.salary == null ? null : encryptField(String(data.salary));
    }
    if (data.avatar !== undefined) updateData.avatar = data.avatar;
    if (data.lastLogin !== undefined) updateData.lastLogin = data.lastLogin;

    let row: UserRecord | null = null;
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

    return mapUser(row as UserRecord);
  }

  async delete(id: string): Promise<IUser> {
    const row = await prisma.user.delete({ where: { id } }).catch(() => null);

    if (!row) {
      notFound();
    }

    return mapUser(row as UserRecord);
  }

  async findByEmail(email: string, updateLastLogin = false): Promise<IUser> {
    const normalized = email.trim().toLowerCase();
    const cacheKey = `user:email:${normalized}`;

    // Se não é atualização, tenta cache
    if (!updateLastLogin) {
      const cached = this.cacheService.get<IUser>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    if (updateLastLogin) {
      const row = await prisma.user.update({
        where: { email: normalized },
        data: { lastLogin: new Date() },
      }).catch(() => null);

      if (!row) {
        return notFound();
      }

      const user = mapUser(row as UserRecord);
      // Invalidar cache ao atualizar lastLogin — será recriado na próxima leitura
      this.cacheService.invalidate([`user:${(row as UserRecord).id}`, `user:email:${normalized}`]);
      return user;
    }

    const row = await prisma.user.findUnique({ where: { email: normalized } });
    if (!row) {
      return notFound();
    }
    const user = mapUser(row as UserRecord);
    this.cacheService.set(cacheKey, user, ["user", `user:email:${normalized}`, `user:${(row as UserRecord).id}`]);
    return user;
  }

  async createUser(data: Partial<IUser>): Promise<IUser> {
    ensureValidDocuments(data);
    const payload = {
      ...data,
      email: data.email?.trim().toLowerCase(),
      cpf: data.cpf ? normalizeCpf(data.cpf) : undefined,
      rg: data.rg ? normalizeRg(data.rg) : undefined,
      lastLogin: data.lastLogin ?? new Date(),
    };

    const normalizedRg = payload.rg ?? null;

    let row: UserRecord;
    try {
      row = await prisma.user.create({
        data: {
          name: payload.name!,
          lastName: payload.lastName!,
          email: payload.email!,
          cpf: payload.cpf ?? null,
          rg: normalizedRg ? encryptField(normalizedRg) : null,
          rgHash: normalizedRg ? blindIndex(normalizedRg) : null,
          phone: payload.phone ?? null,
          salary: payload.salary == null ? null : encryptField(String(payload.salary)),
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
