import { randomBytes, randomInt, createHash } from "node:crypto";
import { AppError } from "./app-error";
import type { SessionContext } from "../interfaces/auth";

export const SESSION_DURATION_DAYS = Number(process.env.SESSION_DURATION_DAYS ?? "30");
export const REVOKED_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const buildUserName = (name: string, lastName: string): string => {
  const fullName = `${name} ${lastName}`.trim();
  return fullName.length > 0 ? fullName : name;
};

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

export const createSessionToken = (): string => randomBytes(48).toString("hex");

export const createOtpCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, "0");

export const hashOtpCode = (userId: string, code: string): string =>
  hashToken(`${userId}:${code}`);

export const getSessionExpiryDate = (): Date =>
  new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

export const deviceIdFrom = (context?: SessionContext): string | null => {
  if (context?.deviceId) return `client:${context.deviceId}`;
  if (context?.userAgent) {
    return `ua:${createHash("sha256").update(context.userAgent).digest("hex")}`;
  }
  return null;
};

export const unauthorized = (): never => {
  throw new AppError("Unauthorized", 401);
};
