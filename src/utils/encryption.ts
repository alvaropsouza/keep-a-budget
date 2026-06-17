import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION_PREFIX = "v1";
const IV_LENGTH = 12;

let cachedKey: Buffer | null = null;
let cachedBlindKey: Buffer | null = null;

const getKey = (): Buffer => {
  if (cachedKey) return cachedKey;

  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set");
  }

  const key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes encoded as 64 hex characters");
  }

  cachedKey = key;
  return key;
};

// Separate sub-key for the blind index so the HMAC never reuses the raw AES key.
const getBlindKey = (): Buffer => {
  if (cachedBlindKey) return cachedBlindKey;
  cachedBlindKey = createHash("sha256").update(getKey()).update(":blind-index").digest();
  return cachedBlindKey;
};

export const isEncrypted = (value: string): boolean =>
  value.startsWith(`${VERSION_PREFIX}:`);

export const encryptField = (plaintext: string): string => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    VERSION_PREFIX,
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
};

export const decryptField = (value: string): string => {
  // Legacy plaintext rows (pre-encryption / pending backfill) pass through unchanged.
  if (!isEncrypted(value)) {
    return value;
  }

  const [, ivB64, tagB64, dataB64] = value.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};

// Deterministic HMAC used to enforce uniqueness / lookup on an encrypted column.
export const blindIndex = (value: string): string =>
  createHmac("sha256", getBlindKey()).update(value).digest("hex");
