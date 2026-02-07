import { Upload } from "@aws-sdk/lib-storage";
import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import crypto from "node:crypto";
import logger from "../config/logger";
import { getS3Url, getS3UrlConfig } from "./s3Url";

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
 * Upload a file to S3 and return its public URL
 *
 * @param fileBuffer - The file content as Buffer
 * @param fileName - Original filename
 * @param mimeType - MIME type of the file
 * @param options - Upload options
 * @returns The public URL of the uploaded file
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
      ACL: options.acl || "public-read",
    },
  });

  await upload.done();

  // Generate URL using the centralized helper
  const url = getS3Url(fileKey, config);

  logger.info(
    { bucket: config.bucket, key: fileKey, url },
    "File uploaded successfully",
  );

  return url;
};
