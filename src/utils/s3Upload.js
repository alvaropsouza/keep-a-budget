const { Upload } = require('@aws-sdk/lib-storage');
const s3Client = require('../config/s3');
const crypto = require('crypto');

const uploadToS3 = async (fileBuffer, fileName, mimeType) => {
  const fileKey = `receipts/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${fileName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType,
    },
  });

  const result = await upload.done();
  
  // Return the S3 URL from the upload result
  return result.Location || `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
};

module.exports = { uploadToS3 };
