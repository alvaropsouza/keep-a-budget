const validateEnv = (): void => {
  const required = [
    "DATABASE_URL",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "S3_BUCKET_NAME",
    "ENCRYPTION_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Please check your .env file and ensure all required variables are set.",
    );
  }

  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey!)) {
    throw new Error(
      "Invalid ENCRYPTION_KEY: must be 32 bytes encoded as 64 hexadecimal characters. " +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  const bucketName = process.env.S3_BUCKET_NAME;
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucketName!)) {
    throw new Error(
      "Invalid S3_BUCKET_NAME: Bucket names must start and end with a lowercase letter or number, " +
        "and can only contain lowercase letters, numbers, periods, and hyphens.",
    );
  }

  const region = process.env.AWS_REGION;
  if (!/^[a-z]{2}-[a-z]+-\d$/.test(region!)) {
    throw new Error(
      'Invalid AWS_REGION: Region must be in the format like "us-east-1", "eu-west-2", etc.',
    );
  }
};

export default validateEnv;
