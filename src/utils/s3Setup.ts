import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";
import s3Client from "../config/s3";
import logger from "../config/logger";

export const setupS3Bucket = async (): Promise<void> => {
  const bucketName = process.env.S3_BUCKET_NAME!;

  try {
    // Check if bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    logger.info({ bucket: bucketName }, "S3 bucket already exists");
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      // Create bucket if it doesn't exist
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        logger.info({ bucket: bucketName }, "Created S3 bucket");
      } catch (createError) {
        logger.error(
          { error: createError, bucket: bucketName },
          "Failed to create S3 bucket"
        );
        throw createError;
      }
    } else {
      logger.error(
        { error, bucket: bucketName },
        "Error checking S3 bucket existence"
      );
      throw error;
    }
  }

  // Set public read policy
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "PublicReadGetObject",
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucketName}/*`],
      },
    ],
  };

  try {
    await s3Client.send(
      new PutBucketPolicyCommand({
        Bucket: bucketName,
        Policy: JSON.stringify(policy),
      })
    );
    logger.info({ bucket: bucketName }, "Successfully set public read policy");
  } catch (error) {
    logger.error({ error, bucket: bucketName }, "Failed to set bucket policy");
    // Don't throw here, as the bucket might already be usable even if policy fails (e.g. AWS with blocked public access)
  }
};
