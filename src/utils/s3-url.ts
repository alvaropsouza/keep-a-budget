interface S3UrlConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  usePathStyle?: boolean;
}

export const getS3UrlConfig = (): S3UrlConfig => {
  const bucket = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION;
  const endpoint = process.env.S3_ENDPOINT;

  if (!bucket || !region) {
    throw new Error("S3_BUCKET_NAME and AWS_REGION are required");
  }

  return {
    bucket,
    region,
    endpoint,
    usePathStyle: !!endpoint,
  };
};
