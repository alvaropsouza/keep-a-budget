import { Injectable } from "@nestjs/common";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import { getS3UrlConfig } from "../utils/s3-url";
import { generateS3Key, extractS3Key } from "../utils/s3-upload";
import logger from "../config/logger";

@Injectable()
export class S3Service {
  async upload(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    options: { keyPrefix?: string; acl?: ObjectCannedACL; userEmail?: string } = {},
  ): Promise<string> {
    const config = getS3UrlConfig();
    const fileKey = generateS3Key(fileName, options.keyPrefix, options.userEmail);

    logger.debug({ bucket: config.bucket, key: fileKey, size: fileBuffer.length }, "Starting S3 upload");

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.bucket,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: mimeType,
      },
    });

    await upload.done();

    logger.info({ bucket: config.bucket, key: fileKey }, "File uploaded successfully");
    return fileKey;
  }

  async getSignedUrl(keyOrUrl: string, expiresIn: number = 3600): Promise<string> {
    const config = getS3UrlConfig();
    const key = extractS3Key(keyOrUrl);

    const command = new GetObjectCommand({ Bucket: config.bucket, Key: key });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });

    logger.debug({ key, expiresIn, bucket: config.bucket }, "Generated pre-signed URL");
    return signedUrl;
  }

  generateKey(fileName: string, prefix?: string, userEmail?: string): string {
    return generateS3Key(fileName, prefix, userEmail);
  }
}
