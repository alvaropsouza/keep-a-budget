import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import crypto from "node:crypto";
import logger from "../config/logger";
import { getS3UrlConfig } from "./s3Url";

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
): string => {
  // eslint-disable-next-line unicorn/prefer-string-replace-all
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-");
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString("hex");
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
    // Example: /keep-a-budget-receipts/receipts/file.jpg -> receipts/file.jpg
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

/**
 * Upload a file to S3 (private) and return the S3 key
 *
 * @param fileBuffer - The file content as Buffer
 * @param fileName - Original filename
 * @param mimeType - MIME type of the file
 * @param options - Upload options
 * @returns The S3 key of the uploaded file
 */
export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  options: {
    keyPrefix?: string;
    acl?: ObjectCannedACL;
  } = {},
): Promise<string> => {
  const config = getS3UrlConfig();
  const fileKey = generateS3Key(fileName, options.keyPrefix);

  logger.debug(
    { bucket: config.bucket, key: fileKey, size: fileBuffer.length },
    "Starting S3 upload",
  );

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: config.bucket,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
      // ACL removed - files are now private by default
    },
  });

  await upload.done();

  logger.info(
    { bucket: config.bucket, key: fileKey },
    "File uploaded successfully (private)",
  );

  return fileKey; // Return key instead of public URL
};

/**
 * Generate a pre-signed URL for secure, temporary access to a private S3 object
 *
 * @param keyOrUrl - The S3 object key or a full URL (will extract key if URL)
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns A pre-signed URL that grants temporary access
 */
export const getSignedS3Url = async (
  keyOrUrl: string,
  expiresIn: number = 3600,
): Promise<string> => {
  const config = getS3UrlConfig();

  // Extract key from URL if necessary (handles legacy data)
  const key = extractS3Key(keyOrUrl);

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

  logger.debug(
    { key, expiresIn, bucket: config.bucket },
    "Generated pre-signed URL",
  );

  return signedUrl;
};
