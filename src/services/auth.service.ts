import { randomBytes, createHash, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH) as Buffer;
  const storedBuffer = Buffer.from(storedHash, "hex");
  if (derivedKey.length !== storedBuffer.length) return false;
  return timingSafeEqual(derivedKey, storedBuffer);
};
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? "30");

type SessionRow = {
  id: string;
  user_id: string;
  expires_at: Date;
  revoked_at: Date | null;
  email: string;
  name: string;
  last_name: string;
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

let tableReady: Promise<void> | null = null;

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

const ensureSessionTable = async (): Promise<void> => {
  if (!tableReady) {
    tableReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id uuid PRIMARY KEY,
          user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash text NOT NULL UNIQUE,
          expires_at timestamptz NOT NULL,
          revoked_at timestamptz,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx
          ON user_sessions(user_id);
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx
          ON user_sessions(expires_at);
      `);
    })();
  }

  await tableReady;
};

export class AuthService {
  async loginWithEmail(email: string, password: string): Promise<AuthSession> {
    await ensureSessionTable();

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

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const sessionToken = createSessionToken();
    const tokenHash = hashToken(sessionToken);
    const expiresAt = getExpiryDate();

    await prisma.$executeRaw`
      INSERT INTO user_sessions (id, user_id, token_hash, expires_at)
      VALUES (${randomUUID()}::uuid, ${user.id}::uuid, ${tokenHash}, ${expiresAt})
    `;

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
    await ensureSessionTable();

    if (!token) {
      unauthorized();
    }

    const tokenHash = hashToken(token);
    const rows = await prisma.$queryRaw<SessionRow[]>`
      SELECT
        s.id,
        s.user_id,
        s.expires_at,
        s.revoked_at,
        u.email,
        u.name,
        u.last_name
      FROM user_sessions s
      INNER JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ${tokenHash}
      LIMIT 1
    `;

    const session = rows[0];
    if (!session) {
      unauthorized();
    }

    if (session.revoked_at) {
      unauthorized();
    }

    if (new Date(session.expires_at).getTime() <= Date.now()) {
      unauthorized();
    }

    await prisma.$executeRaw`
      UPDATE user_sessions
      SET updated_at = now()
      WHERE id = ${session.id}::uuid
    `;

    return {
      user: {
        userId: session.user_id,
        email: session.email,
        name: buildUserName(session.name, session.last_name),
      },
      expiresAt: new Date(session.expires_at),
      sessionToken: token,
    };
  }

  async revokeSession(token: string | null | undefined): Promise<void> {
    await ensureSessionTable();

    if (!token) {
      return;
    }

    const tokenHash = hashToken(token);
    await prisma.$executeRaw`
      UPDATE user_sessions
      SET revoked_at = now(), updated_at = now()
      WHERE token_hash = ${tokenHash}
        AND revoked_at IS NULL
    `;
  }
}
