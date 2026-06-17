import { Injectable, Logger } from "@nestjs/common";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import {
  type AuthenticatorTransportFuture,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { isoUint8Array } from "@simplewebauthn/server/helpers";

// A session is valid for this long after the last login. Logging in again
// from the same device refreshes the window; there is no per-request sliding
// extension, so a session never outlives 30 days without a real login.
const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? "30");
// Revoked sessions are kept this long for audit before purge.
const REVOKED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const WEBAUTHN_RP_NAME = process.env.WEBAUTHN_RP_NAME ?? "Keep a Budget";
const WEBAUTHN_RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const WEBAUTHN_ORIGIN = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";
const WEBAUTHN_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

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

// Where/what a login came from, captured for the session list / audit.
// deviceId is a stable per-device identifier sent by the client (localStorage
// UUID). When absent we fall back to a hash of the User-Agent.
export type SessionContext = {
  userAgent?: string;
  ipAddress?: string;
  deviceId?: string;
};

// A session as exposed to the user in the "my devices" list.
export type SessionSummary = {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  current: boolean;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const buildUserName = (name: string, lastName: string): string => {
  const fullName = `${name} ${lastName}`.trim();
  return fullName.length > 0 ? fullName : name;
};

const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

const createSessionToken = (): string => randomBytes(48).toString("hex");

const createOtpCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, "0");

// Hash scoped to user id so the same code for different users never collides
const hashOtpCode = (userId: string, code: string): string =>
  hashToken(`${userId}:${code}`);

const getExpiryDate = (): Date => {
  const now = Date.now();
  const duration = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000;
  return new Date(now + duration);
};

const unauthorized = (): never => {
  throw new AppError("Unauthorized", 401);
};

type SessionUserRecord = {
  id: string;
  email: string;
  name: string;
  lastName: string;
};

type PasskeyChallengePurpose = "registration" | "authentication";

type StoredPasskey = {
  id: string;
  credentialId: string;
  publicKey: Uint8Array;
  counter: number;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
};

const allowedAuthenticatorTransports = new Set<AuthenticatorTransportFuture>([
  "ble",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

const toAuthenticatorTransports = (
  transports: string[] | null | undefined,
): AuthenticatorTransportFuture[] | undefined => {
  if (!transports || transports.length === 0) {
    return undefined;
  }

  const filtered = transports.filter(
    (transport): transport is AuthenticatorTransportFuture =>
      allowedAuthenticatorTransports.has(transport as AuthenticatorTransportFuture),
  );

  return filtered.length > 0 ? filtered : undefined;
};

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Stable per-device key so we keep exactly one session row per device: the
  // same device re-logging in reuses its row instead of piling up new ones.
  // Prefers the client-supplied device id (localStorage UUID); falls back to a
  // User-Agent hash. Namespaced to avoid collision between the two sources.
  // Null only when neither signal is available.
  private deviceIdFrom(context?: SessionContext): string | null {
    if (context?.deviceId) {
      return `client:${context.deviceId}`;
    }
    if (context?.userAgent) {
      return `ua:${createHash("sha256").update(context.userAgent).digest("hex")}`;
    }
    return null;
  }

  private async createSessionForUser(
    user: SessionUserRecord,
    context?: SessionContext,
  ): Promise<AuthSession> {
    const sessionToken = createSessionToken();
    const tokenHash = hashToken(sessionToken);
    const expiresAt = getExpiryDate();
    const deviceId = this.deviceIdFrom(context);
    const userAgent = context?.userAgent ?? null;
    const ipAddress = context?.ipAddress ?? null;

    // One session per (user, device). With a known device we upsert so a
    // repeat login rotates the token and refreshes the 30-day window on the
    // existing row. Without a device key we can only create a fresh row.
    const sessionWrite = deviceId
      ? prisma.userSession.upsert({
          where: { userId_deviceId: { userId: user.id, deviceId } },
          create: { userId: user.id, tokenHash, deviceId, expiresAt, userAgent, ipAddress },
          update: { tokenHash, expiresAt, revokedAt: null, userAgent, ipAddress },
        })
      : prisma.userSession.create({
          data: { userId: user.id, tokenHash, expiresAt, userAgent, ipAddress },
        });

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      }),
      sessionWrite,
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

  private async upsertChallenge(
    userId: string,
    purpose: PasskeyChallengePurpose,
    challenge: string,
  ): Promise<void> {
    await prisma.webAuthnChallenge.upsert({
      where: {
        userId_purpose: {
          userId,
          purpose,
        },
      },
      create: {
        userId,
        purpose,
        challenge,
        expiresAt: new Date(Date.now() + WEBAUTHN_CHALLENGE_TTL_MS),
      },
      update: {
        challenge,
        expiresAt: new Date(Date.now() + WEBAUTHN_CHALLENGE_TTL_MS),
      },
    });
  }

  private async getChallenge(
    userId: string,
    purpose: PasskeyChallengePurpose,
  ) {
    const challenge = await prisma.webAuthnChallenge.findUnique({
      where: {
        userId_purpose: {
          userId,
          purpose,
        },
      },
    });

    if (!challenge || challenge.expiresAt.getTime() <= Date.now()) {
      throw new AppError("Challenge expirado. Tente novamente.", 400);
    }

    return challenge;
  }

  private async deleteChallenge(
    userId: string,
    purpose: PasskeyChallengePurpose,
  ): Promise<void> {
    await prisma.webAuthnChallenge.deleteMany({
      where: {
        userId,
        purpose,
      },
    });
  }

  async requestEmailOtp(email: string): Promise<{ code: string; userEmail: string } | null> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      this.logger.debug({ email: normalizedEmail }, "OTP requested for unknown email");
      return null;
    }

    const latest = await prisma.emailOtp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (latest && Date.now() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
      this.logger.warn({ userId: user.id }, "OTP resend blocked by cooldown");
      throw new AppError("Aguarde um instante antes de pedir outro código.", 429);
    }

    const code = createOtpCode();
    const codeHash = hashOtpCode(user.id, code);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);

    await prisma.$transaction([
      prisma.emailOtp.deleteMany({ where: { userId: user.id } }),
      prisma.emailOtp.create({
        data: { userId: user.id, codeHash, expiresAt },
      }),
    ]);

    this.logger.log({ userId: user.id }, "OTP created, sending email");
    return { code, userEmail: user.email };
  }

  async verifyEmailOtp(
    email: string,
    code: string,
    context?: SessionContext,
  ): Promise<AuthSession> {
    const invalidCode = (): never => {
      throw new AppError("Código inválido ou expirado.", 401);
    };

    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) invalidCode();

    const otp = await prisma.emailOtp.findFirst({
      where: { userId: user!.id },
      orderBy: { createdAt: "desc" },
    });

    if (
      !otp ||
      otp.consumedAt ||
      otp.expiresAt.getTime() <= Date.now() ||
      otp.attempts >= OTP_MAX_ATTEMPTS
    ) {
      invalidCode();
    }

    const validOtp = otp!;
    const providedHash = Buffer.from(hashOtpCode(user!.id, code), "hex");
    const storedHash = Buffer.from(validOtp.codeHash, "hex");
    const matches =
      providedHash.length === storedHash.length &&
      timingSafeEqual(providedHash, storedHash);

    if (!matches) {
      await prisma.emailOtp.update({
        where: { id: validOtp.id },
        data: { attempts: { increment: 1 } },
      });
      this.logger.warn({ userId: user!.id, attempts: validOtp.attempts + 1 }, "OTP verification failed: wrong code");
      invalidCode();
    }

    await prisma.emailOtp.update({
      where: { id: validOtp.id },
      data: { consumedAt: new Date() },
    });

    this.logger.log({ userId: user!.id }, "OTP verified, session created");
    return this.createSessionForUser(user!, context);
  }

  async beginPasskeyRegistration(userId: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const options = await generateRegistrationOptions({
      rpName: WEBAUTHN_RP_NAME,
      rpID: WEBAUTHN_RP_ID,
      userID: isoUint8Array.fromUTF8String(user.id),
      userName: user.email,
      userDisplayName: buildUserName(user.name, user.lastName),
      attestationType: "none",
      supportedAlgorithmIDs: [-7, -257],
      excludeCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialId,
      })),
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    });

    await this.upsertChallenge(user.id, "registration", options.challenge);

    return options;
  }

  async verifyPasskeyRegistration(
    userId: string,
    response: RegistrationResponseJSON,
  ): Promise<{ verified: boolean }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { passkeys: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const challenge = await this.getChallenge(user.id, "registration");

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new AppError("Falha ao registrar passkey.", 400);
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await prisma.passkeyCredential.create({
      data: {
        userId: user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports?.map((transport) => String(transport)) ?? [],
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      },
    });

    await this.deleteChallenge(user.id, "registration");

    return { verified: true };
  }

  async beginPasskeyAuthentication(
    email: string,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { passkeys: true },
    });

    if (!user || user.passkeys.length === 0) {
      throw new AppError("Nenhuma passkey cadastrada para este usuário.", 404);
    }

    const options = await generateAuthenticationOptions({
      rpID: WEBAUTHN_RP_ID,
      userVerification: "preferred",
      allowCredentials: user.passkeys.map((passkey) => ({
        id: passkey.credentialId,
      })),
    });

    await this.upsertChallenge(user.id, "authentication", options.challenge);

    return options;
  }

  async verifyPasskeyAuthentication(
    email: string,
    response: AuthenticationResponseJSON,
    context?: SessionContext,
  ): Promise<AuthSession> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { passkeys: true },
    });

    if (!user) {
      return unauthorized();
    }

    if (user.passkeys.length === 0) {
      return unauthorized();
    }

    const challenge = await this.getChallenge(user.id, "authentication");
    const storedPasskey = user.passkeys.find((passkey) => passkey.credentialId === response.id);

    if (!storedPasskey) {
      return unauthorized();
    }

    const credential: StoredPasskey = {
      id: storedPasskey.credentialId,
      credentialId: storedPasskey.credentialId,
      publicKey: storedPasskey.publicKey,
      counter: storedPasskey.counter,
      transports: storedPasskey.transports,
      deviceType: storedPasskey.deviceType,
      backedUp: storedPasskey.backedUp,
    };

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge.challenge,
      expectedOrigin: WEBAUTHN_ORIGIN,
      expectedRPID: WEBAUTHN_RP_ID,
      credential: {
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: toAuthenticatorTransports(credential.transports),
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      return unauthorized();
    }

    const { newCounter } = verification.authenticationInfo;

    await prisma.passkeyCredential.update({
      where: { credentialId: credential.credentialId },
      data: { counter: newCounter },
    });

    await this.deleteChallenge(user.id, "authentication");

    return this.createSessionForUser(user, context);
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

    // No per-request extension: the 30-day window is set at login and only a
    // real login (createSessionForUser) refreshes it. Reads never write.
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

  // Active devices for a user. The session matching the caller's own token is
  // flagged so the UI can mark "this device".
  async listSessions(
    userId: string,
    currentToken: string,
  ): Promise<SessionSummary[]> {
    const currentHash = hashToken(currentToken);
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { updatedAt: "desc" },
    });

    return sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastUsedAt: session.updatedAt,
      expiresAt: session.expiresAt,
      current: session.tokenHash === currentHash,
    }));
  }

  // Revoke one session by id, scoped to its owner so a user can only end their
  // own sessions. Returns false if nothing matched.
  async revokeSessionById(userId: string, sessionId: string): Promise<boolean> {
    const result = await prisma.userSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return result.count > 0;
  }

  // Revoke every active session of the user except the caller's own, so the
  // current device stays logged in. Returns how many were revoked.
  async revokeOtherSessions(
    userId: string,
    currentToken: string,
  ): Promise<number> {
    const currentHash = hashToken(currentToken);
    const result = await prisma.userSession.updateMany({
      where: { userId, revokedAt: null, tokenHash: { not: currentHash } },
      data: { revokedAt: new Date() },
    });
    return result.count;
  }

  // Deletes sessions that are already expired, plus revoked ones older than
  // the audit retention window. Keeps the table from growing unbounded.
  async purgeStaleSessions(): Promise<number> {
    const now = new Date();
    const revokedCutoff = new Date(Date.now() - REVOKED_RETENTION_MS);

    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { revokedAt: { lt: revokedCutoff } },
        ],
      },
    });

    return result.count;
  }

}

