import { Injectable } from "@nestjs/common";
import { randomBytes, createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? "30");

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (derivedKey.length !== storedBuffer.length) return false;
  return timingSafeEqual(derivedKey, storedBuffer);
};

export type AuthUser = {
  userId: string;
  email: string;
  name?: string;
};

export type AuthSession = {
  user: AuthUser;
  expiresAt: Date;
  sessionToken: string;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const buildUserName = (name: string, lastName: string): string => {
  const fullName = `${name} ${lastName}`.trim();
  return fullName.length > 0 ? fullName : name;
};

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const createSessionToken = (): string => randomBytes(48).toString("hex");

const getExpiryDate = (): Date => {
  const now = Date.now();
  const duration = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return new Date(now + duration);
};

const unauthorized = (): never => {
  throw new AppError("Unauthorized", 401);
};

@Injectable()
export class AuthService {
  async loginWithEmail(email: string, password: string): Promise<AuthSession> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      throw new AppError("Email ou senha invalidos.", 401);
    }

    if (!user.passwordHash) {
      throw new AppError("Conta sem senha configurada. Contate o administrador.", 403);
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      throw new AppError("Email ou senha invalidos.", 401);
    }

    const sessionToken = createSessionToken();
    const tokenHash = hashToken(sessionToken);
    const expiresAt = getExpiryDate();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),
      prisma.userSession.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      }),
    ]);

    return {
      user: {
        userId: user.id,
        email: user.email,
        name: buildUserName(user.name, user.lastName),
      },
      expiresAt,
      sessionToken,
    };
  }

  async authenticateToken(token: string): Promise<AuthSession> {
    if (!token) {
      unauthorized();
    }

    const tokenHash = hashToken(token);
    const session = await prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session) {
      unauthorized();
    }

    const validSession = session!;

    if (validSession.revokedAt) {
      unauthorized();
    }

    if (validSession.expiresAt.getTime() <= Date.now()) {
      unauthorized();
    }

    await prisma.userSession.update({
      where: { id: validSession.id },
      data: { updatedAt: new Date() },
    });

    return {
      user: {
        userId: validSession.user.id,
        email: validSession.user.email,
        name: buildUserName(validSession.user.name, validSession.user.lastName),
      },
      expiresAt: validSession.expiresAt,
      sessionToken: token,
    };
  }

  async revokeSession(token: string | null | undefined): Promise<void> {
    if (!token) {
      return;
    }

    const tokenHash = hashToken(token);
    await prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

