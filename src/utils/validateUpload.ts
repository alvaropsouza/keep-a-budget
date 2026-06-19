import { AppError } from "./app-error";

export type AllowedUploadType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "application/pdf";

// Detect the real type from the file's magic bytes. The client-supplied
// mimetype is attacker-controlled and must never be trusted on its own.
const sniffType = (buffer: Buffer): AllowedUploadType | null => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-") {
    return "application/pdf";
  }
  return null;
};

/**
 * Validate an uploaded file by size and real content type (magic bytes).
 * Rejects spoofed mimetypes and anything not on the allowlist (e.g. SVG,
 * which can carry scripts). Returns the trusted detected mimetype, which
 * callers should use instead of the client-supplied one.
 */
export const RECEIPT_UPLOAD_RULES: { allowed: AllowedUploadType[]; maxBytes: number } = {
  allowed: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  maxBytes: 10 * 1024 * 1024,
};

export const validateUpload = (
  buffer: Buffer,
  options: { allowed: AllowedUploadType[]; maxBytes: number },
): AllowedUploadType => {
  if (buffer.length > options.maxBytes) {
    const maxMb = Math.floor(options.maxBytes / (1024 * 1024));
    throw new AppError(`Arquivo muito grande. Máximo ${maxMb}MB.`, 400);
  }

  const detected = sniffType(buffer);
  if (!detected || !options.allowed.includes(detected)) {
    throw new AppError(
      "Tipo de arquivo inválido ou não suportado. Use JPEG, PNG, WEBP ou PDF.",
      400,
    );
  }

  return detected;
};
