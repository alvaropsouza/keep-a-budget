import logger from "../config/logger";

/**
 * Configuration for S3 URL generation
 */
interface S3UrlConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  usePathStyle?: boolean;
}

/**
 * Get S3 URL configuration from environment
 */
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
    usePathStyle: !!endpoint, // MinIO/local uses path-style URLs
  };
};

/**
 * Generate public URL for an S3 object key
 *
 * @param key - The S3 object key (e.g., "receipts/123-abc.jpg")
 * @param config - Optional S3 configuration (defaults to environment)
 * @returns The public URL to access the file
 *
 * @example
 * // MinIO/Local (path-style):
 * getS3Url("receipts/file.jpg")
 * // => "http://localhost:9000/road-of-life-receipts/receipts/file.jpg"
 *
 * // AWS S3 (virtual-hosted):
 * getS3Url("receipts/file.jpg")
 * // => "https://road-of-life-receipts.s3.us-east-1.amazonaws.com/receipts/file.jpg"
 */
export const getS3Url = (key: string, config?: S3UrlConfig): string => {
  const cfg = config || getS3UrlConfig();

  // For MinIO or custom endpoints (path-style URLs)
  if (cfg.endpoint) {
    const url = `${cfg.endpoint}/${cfg.bucket}/${key}`;
    logger.debug({ key, url, type: "path-style" }, "Generated S3 URL");
    return url;
  }

  // For AWS S3 (virtual-hosted-style URLs)
  const url = `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com/${key}`;
  logger.debug({ key, url, type: "virtual-hosted" }, "Generated S3 URL");
  return url;
};

/**
 * Extract the S3 key from a full S3 URL
 *
 * @param url - The full S3 URL
 * @param config - Optional S3 configuration (defaults to environment)
 * @returns The S3 object key, or null if URL doesn't match expected patterns
 *
 * @example
 * getKeyFromUrl("http://localhost:9000/bucket/receipts/file.jpg")
 * // => "receipts/file.jpg"
 *
 * getKeyFromUrl("https://bucket.s3.us-east-1.amazonaws.com/receipts/file.jpg")
 * // => "receipts/file.jpg"
 */
export const getKeyFromUrl = (
  url: string,
  config?: S3UrlConfig,
): string | null => {
  const cfg = config || getS3UrlConfig();

  try {
    const urlObj = new URL(url);

    // Path-style URL (MinIO/custom endpoint)
    if (cfg.endpoint) {
      const endpointObj = new URL(cfg.endpoint);
      if (urlObj.origin === endpointObj.origin) {
        const pathPrefix = `/${cfg.bucket}/`;
        if (urlObj.pathname.startsWith(pathPrefix)) {
          return urlObj.pathname.slice(pathPrefix.length);
        }
      }
    }

    // Virtual-hosted-style URL (AWS S3)
    const s3HostPattern = new RegExp(
      String.raw`^${cfg.bucket}\.s3\.${cfg.region}\.amazonaws\.com$`,
    );
    if (s3HostPattern.test(urlObj.hostname)) {
      return urlObj.pathname.slice(1); // Remove leading slash
    }

    logger.warn({ url }, "URL does not match expected S3 patterns");
    return null;
  } catch (error) {
    logger.error({ url, error }, "Failed to parse S3 URL");
    return null;
  }
};

/**
 * Validate if a URL is a valid S3 URL for this configuration
 *
 * @param url - The URL to validate
 * @param config - Optional S3 configuration (defaults to environment)
 * @returns true if the URL matches expected S3 patterns
 */
export const isValidS3Url = (url: string, config?: S3UrlConfig): boolean => {
  return getKeyFromUrl(url, config) !== null;
};

/**
 * Get the public base URL for S3 bucket
 * Useful for CORS and CDN configuration
 *
 * @param config - Optional S3 configuration (defaults to environment)
 * @returns The base URL for the S3 bucket
 */
export const getS3BaseUrl = (config?: S3UrlConfig): string => {
  const cfg = config || getS3UrlConfig();

  if (cfg.endpoint) {
    return `${cfg.endpoint}/${cfg.bucket}`;
  }

  return `https://${cfg.bucket}.s3.${cfg.region}.amazonaws.com`;
};
