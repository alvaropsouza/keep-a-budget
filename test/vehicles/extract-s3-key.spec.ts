import { test } from "node:test";
import assert from "node:assert/strict";
import { extractS3Key } from "../../src/utils/s3-upload";

process.env.S3_BUCKET_NAME ??= "test-bucket";
process.env.AWS_REGION ??= "us-east-1";

test("signed url with email prefix resolves to the stored key", () => {
  const signed =
    "https://test-bucket.s3.us-east-1.amazonaws.com/user%40mail.com/vehicle-revisions/2026-09/1-abc-nota.pdf?X-Amz-Signature=x";

  assert.equal(extractS3Key(signed), "user@mail.com/vehicle-revisions/2026-09/1-abc-nota.pdf");
});

test("plain key passes through unchanged", () => {
  assert.equal(extractS3Key("user@mail.com/receipts/1-abc.jpg"), "user@mail.com/receipts/1-abc.jpg");
});
