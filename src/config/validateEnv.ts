const validateEnv = (): void => {
  const required = [
    "MONGODB_URI",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "S3_BUCKET_NAME",
    "S3_ENDPOINT",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env file and ensure all required variables are set."
    );
  }

  const bucketName = process.env.S3_BUCKET_NAME;
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucketName!)) {
    throw new Error(
      "Invalid S3_BUCKET_NAME: Bucket names must start and end with a lowercase letter or number, " +
        "and can only contain lowercase letters, numbers, periods, and hyphens."
    );
  }

  const region = process.env.AWS_REGION;
  if (!/^[a-z]{2}-[a-z]+-\d$/.test(region!)) {
    throw new Error(
      'Invalid AWS_REGION: Region must be in the format like "us-east-1", "eu-west-2", etc.'
    );
  }
};

export default validateEnv;
