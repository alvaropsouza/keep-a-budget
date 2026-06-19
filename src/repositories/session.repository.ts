import { Injectable } from "@nestjs/common";
import { prisma } from "../config/prisma";
import type { UserSession } from "../generated/prisma/client/client";
import type { SessionSummary } from "../interfaces/auth";

export type AuthUserRecord = {
  id: string;
  email: string;
  name: string;
  lastName: string;
};

export type SessionWithUser = UserSession & { user: AuthUserRecord };

export type CreateSessionData = {
  userId: string;
  tokenHash: string;
  deviceId: string | null;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
};

export type OtpRecord = {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: Date;
  consumedAt: Date | null;
  attempts: number;
  createdAt: Date;
};

@Injectable()
export class SessionRepository {
  async findUserByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, lastName: true },
    });
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lastLogin: new Date() } });
  }

  async findLatestOtp(userId: string): Promise<OtpRecord | null> {
    return prisma.emailOtp.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async replaceOtp(userId: string, codeHash: string, expiresAt: Date): Promise<void> {
    await prisma.$transaction([
      prisma.emailOtp.deleteMany({ where: { userId } }),
      prisma.emailOtp.create({ data: { userId, codeHash, expiresAt } }),
    ]);
  }

  async incrementOtpAttempts(id: string): Promise<void> {
    await prisma.emailOtp.update({ where: { id }, data: { attempts: { increment: 1 } } });
  }

  async consumeOtp(id: string): Promise<void> {
    await prisma.emailOtp.update({ where: { id }, data: { consumedAt: new Date() } });
  }

  async upsertSession(data: CreateSessionData): Promise<void> {
    if (data.deviceId) {
      await prisma.userSession.upsert({
        where: { userId_deviceId: { userId: data.userId, deviceId: data.deviceId } },
        create: {
          userId: data.userId,
          tokenHash: data.tokenHash,
          deviceId: data.deviceId,
          expiresAt: data.expiresAt,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
        },
        update: {
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          revokedAt: null,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
        },
      });
    } else {
      await prisma.userSession.create({
        data: {
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          userAgent: data.userAgent,
          ipAddress: data.ipAddress,
        },
      });
    }
  }

  async findByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
    return prisma.userSession.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, name: true, lastName: true } } },
    });
  }

  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    return prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeById(userId: string, sessionId: string): Promise<boolean> {
    const result = await prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }

  async revokeOthers(userId: string, currentTokenHash: string): Promise<number> {
    const result = await prisma.userSession.updateMany({
      where: { userId, revokedAt: null, tokenHash: { not: currentTokenHash } },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  async purgeStale(): Promise<number> {
    const now = new Date();
    const revokedCutoff = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { revokedAt: { lt: revokedCutoff } }],
      },
    });
    return result.count;
  }

  mapToSummary(sessions: UserSession[], currentTokenHash: string): SessionSummary[] {
    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastUsedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      current: session.tokenHash === currentTokenHash,
    }));
  }
}
