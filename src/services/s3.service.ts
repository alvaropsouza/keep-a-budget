import { Injectable } from "@nestjs/common";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand, DeleteObjectCommand, NoSuchKey } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import type { ObjectCannedACL } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import { getS3UrlConfig } from "../utils/s3-url";
import { generateS3Key, extractS3Key } from "../utils/s3-upload";
import { buildFileUrl } from "../utils/file-token";
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

  async getFileUrl(keyOrUrl: string, expiresIn: number = 3600): Promise<string> {
    return buildFileUrl(extractS3Key(keyOrUrl), expiresIn);
  }

  async openObjectStream(key: string): Promise<Readable | null> {
    const config = getS3UrlConfig();
    try {
      const response = await s3Client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
      return response.Body instanceof Readable ? response.Body : null;
    } catch (error) {
      if (error instanceof NoSuchKey) return null;
      throw error;
    }
  }

  async downloadObject(key: string): Promise<Buffer> {
    const config = getS3UrlConfig();
    const command = new GetObjectCommand({ Bucket: config.bucket, Key: key });
    const response = await s3Client.send(command);

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as InstanceType<typeof Readable>) {
      chunks.push(chunk as Uint8Array);
    }
    return Buffer.concat(chunks);
  }

  async deleteObject(keyOrUrl: string): Promise<void> {
    const config = getS3UrlConfig();
    const key = extractS3Key(keyOrUrl);
    await s3Client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
  }

  async deleteObjects(keysOrUrls: string[]): Promise<void> {
    const results = await Promise.allSettled(keysOrUrls.map((key) => this.deleteObject(key)));
    const failed = results.filter((result) => result.status === "rejected").length;
    if (failed > 0) logger.error({ failed, total: keysOrUrls.length }, "Failed to delete objects from S3");
  }

  generateKey(fileName: string, prefix?: string, userEmail?: string): string {
    return generateS3Key(fileName, prefix, userEmail);
  }
}
