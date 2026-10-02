import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { deriveSubKey } from "./encryption";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

type FileTokenPayload = { k: string; e: number };

let cachedKey: Buffer | null = null;

const getTokenKey = (): Buffer => {
  cachedKey ??= deriveSubKey("file-token");
  return cachedKey;
};

const isPayload = (value: unknown): value is FileTokenPayload =>
  typeof value === "object" &&
  value !== null &&
  "k" in value &&
  "e" in value &&
  typeof value.k === "string" &&
  typeof value.e === "number";

export const createFileToken = (key: string, expiresInSeconds: number): string => {
  const payload: FileTokenPayload = { k: key, e: Math.floor(Date.now() / 1000) + expiresInSeconds };
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getTokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
};

export const readFileToken = (token: string, options: { allowExpired?: boolean } = {}): string | null => {
  const raw = Buffer.from(token, "base64url");
  if (raw.length <= IV_LENGTH + TAG_LENGTH) return null;

  try {
    const decipher = createDecipheriv(ALGORITHM, getTokenKey(), raw.subarray(0, IV_LENGTH));
    decipher.setAuthTag(raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH));
    const decrypted = Buffer.concat([decipher.update(raw.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]);
    const payload: unknown = JSON.parse(decrypted.toString("utf8"));
    if (!isPayload(payload)) return null;
    if (!options.allowExpired && payload.e < Math.floor(Date.now() / 1000)) return null;
    return payload.k;
  } catch {
    return null;
  }
};

const FILE_ROUTE = /^\/api\/files\/([\w-]+)(?:\/|$)/;

export const readFileTokenFromUrl = (url: URL): string | null => {
  const match = FILE_ROUTE.exec(url.pathname);
  return match ? readFileToken(match[1], { allowExpired: true }) : null;
};

export const resolveFileBaseUrl = (): string | null => {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/+$/, "");
  if (process.env.NODE_ENV !== "production") return `http://localhost:${process.env.PORT ?? "3000"}`;
  return null;
};

export const buildFileUrl = (key: string, expiresInSeconds: number): string => {
  const base = resolveFileBaseUrl() ?? "";
  const name = key.split("/").pop() ?? "file";
  return `${base}/api/files/${createFileToken(key, expiresInSeconds)}/${encodeURIComponent(name)}`;
};
