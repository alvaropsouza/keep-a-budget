import { Upload } from "@aws-sdk/lib-storage";
import s3Client from "../config/s3";
import crypto from "node:crypto";
import logger from "../config/logger";

export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "-");
  const fileKey = `receipts/${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}-${sanitizedFileName}`;

  logger.debug(
    { bucket: process.env.S3_BUCKET_NAME, key: fileKey },
    "Starting S3 upload"
  );

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "public-read",
    },
  });

  const result = await upload.done();

  if (process.env.S3_ENDPOINT) {
    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${fileKey}`;
  }

  // Return the S3 URL from the upload result
  return (
    result.Location ||
    `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
  );
};
