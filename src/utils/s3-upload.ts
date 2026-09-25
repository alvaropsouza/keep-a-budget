import crypto from "node:crypto";
import logger from "../config/logger";
import { getS3UrlConfig } from "./s3-url";

/**
 * Generate a unique S3 key for a file
 *
 * @param fileName - Original filename
 * @param prefix - Optional prefix (default: "receipts")
 * @returns A unique S3 key with timestamp and random hash
 */
export const generateS3Key = (
  fileName: string,
  prefix: string = "receipts",
  userEmail?: string,
): string => {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-");
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString("hex");
  if (userEmail) {
    const sanitizedEmail = userEmail
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, "-");
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return `${sanitizedEmail}/${prefix}/${yearMonth}/${timestamp}-${randomHash}-${sanitizedFileName}`;
  }
  return `${prefix}/${timestamp}-${randomHash}-${sanitizedFileName}`;
};

/**
 * Extract S3 key from a URL or return the key if it's already a key
 * This handles migration from public URLs to S3 keys
 *
 * @param urlOrKey - Either a full S3 URL or just the S3 key
 * @returns The S3 key (e.g., "receipts/123-abc.jpg")
 */
export const extractS3Key = (urlOrKey: string): string => {
  // If it's already a key (doesn't start with http), return as-is
  if (!urlOrKey.startsWith("http://") && !urlOrKey.startsWith("https://")) {
    return urlOrKey;
  }

  try {
    const url = new URL(urlOrKey);
    const pathname = url.pathname;

    // Remove leading slash and bucket name if present
    // Example: /road-of-life-receipts/receipts/file.jpg -> receipts/file.jpg
    const parts = pathname.split("/").filter(Boolean);

    // If first part is bucket name, remove it
    const config = getS3UrlConfig();
    if (parts[0] === config.bucket) {
      parts.shift();
    }

    return parts.join("/");
  } catch {
    // If URL parsing fails, assume it's already a key
    logger.warn({ urlOrKey }, "Failed to parse as URL, treating as S3 key");
    return urlOrKey;
  }
};
