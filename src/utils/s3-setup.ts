import { HeadBucketCommand } from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import logger from "../config/logger";

export const setupS3Bucket = async (): Promise<void> => {
  const bucketName = process.env.S3_BUCKET_NAME!;

  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    logger.info({ bucket: bucketName }, "S3 bucket already exists");
  } catch (error) {
    const awsError = error as { name?: string; $metadata?: { httpStatusCode?: number } };
    if (awsError.name === "NotFound" || awsError.$metadata?.httpStatusCode === 404) {
      logger.error({ bucket: bucketName }, "S3 bucket does not exist");
      throw new Error(
        `S3 bucket "${bucketName}" does not exist. Please create it manually.`,
      );
    } else {
      logger.error(
        { error, bucket: bucketName },
        "Error checking S3 bucket existence",
      );
      throw error;
    }
  }
};
