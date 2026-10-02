import { test } from "node:test";
import assert from "node:assert/strict";
import { createFileToken, readFileToken, buildFileUrl } from "../../src/utils/file-token";
import { extractS3Key } from "../../src/utils/s3-upload";

process.env.ENCRYPTION_KEY ??= "a".repeat(64);
process.env.FRONTEND_URL = "https://app.example.com/";
process.env.S3_BUCKET_NAME ??= "bucket";
process.env.AWS_REGION ??= "us-east-1";

const KEY = "user@mail.com/receipts/2026-10/1700000000000-0123456789abcdef-nota.pdf";

test("file token round-trips the key without exposing it", () => {
  const token = createFileToken(KEY, 60);
  assert.equal(readFileToken(token), KEY);
  assert.equal(token.includes("user"), false);
  assert.match(token, /^[\w-]+$/);
});

test("expired token is rejected unless allowExpired", () => {
  const token = createFileToken(KEY, -1);
  assert.equal(readFileToken(token), null);
  assert.equal(readFileToken(token, { allowExpired: true }), KEY);
});

test("tampered or garbage token is rejected", () => {
  const token = createFileToken(KEY, 60);
  const flipped = token.slice(0, -2) + (token.endsWith("AA") ? "BB" : "AA");
  assert.equal(readFileToken(flipped), null);
  assert.equal(readFileToken("nope"), null);
});

test("file url hides S3 and email but keeps file name, and maps back to the key", () => {
  const url = buildFileUrl(KEY, 60);
  assert.match(url, /^https:\/\/app\.example\.com\/api\/files\/[\w-]+\/1700000000000-0123456789abcdef-nota\.pdf$/);
  assert.equal(url.includes("user"), false);
  assert.equal(url.includes("amazonaws"), false);
  assert.equal(extractS3Key(url), KEY);
});
