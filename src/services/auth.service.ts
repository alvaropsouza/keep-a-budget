import { Injectable } from "@nestjs/common";
import { randomBytes, createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import {
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

const scryptAsync = promisify(scrypt);
const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? "30");
const WEBAUTHN_RP_NAME = process.env.WEBAUTHN_RP_NAME ?? "keep-a-budget";
const WEBAUTHN_RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";
const WEBAUTHN_ORIGIN = process.env.WEBAUTHN_ORIGIN ?? "http://localhost:3000";
const WEBAUTHN_CHALLENGE_TTL_MS = 5 * 60 * 1000;

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
  publicKey: Buffer;
  counter: number;
  transports: string[];
  deviceType: string;
  backedUp: boolean;
};

@Injectable()
export class AuthService {
  private async createSessionForUser(user: SessionUserRecord): Promise<AuthSession> {
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

    return this.createSessionForUser(user);
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
  ): Promise<AuthSession> {
    const normalizedEmail = normalizeEmail(email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { passkeys: true },
    });

    if (!user || user.passkeys.length === 0) {
      unauthorized();
    }

    const challenge = await this.getChallenge(user.id, "authentication");
    const storedPasskey = user.passkeys.find((passkey) => passkey.credentialId === response.id);

    if (!storedPasskey) {
      unauthorized();
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
        publicKey: new Uint8Array(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports,
      },
    });

    if (!verification.verified || !verification.authenticationInfo) {
      unauthorized();
    }

    const { newCounter } = verification.authenticationInfo;

    await prisma.passkeyCredential.update({
      where: { credentialId: credential.credentialId },
      data: { counter: newCounter },
    });

    await this.deleteChallenge(user.id, "authentication");

    return this.createSessionForUser(user);
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

