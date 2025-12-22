import { Upload } from "@aws-sdk/lib-storage";
import s3Client from "../config/s3";
import crypto from "node:crypto";

export const uploadToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> => {
  const fileKey = `receipts/${Date.now()}-${crypto
    .randomBytes(8)
    .toString("hex")}-${fileName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    },
  });

  const result = await upload.done();

  // Return the S3 URL from the upload result
  return (
    result.Location ||
    `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`
  );
};
