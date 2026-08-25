import { Buffer } from "node:buffer";

export const MAX_DOCUMENT_UPLOAD_BYTES = 1_500_000;
export const MAX_TICKET_IMAGE_BYTES = 1_500_000;
export const MAX_AUDIO_UPLOAD_BYTES = 10 * 1024 * 1024;

export type AllowedUploadMime = "image/png" | "image/jpeg" | "image/webp" | "application/pdf";

const DOCUMENT_MIMES = new Set<AllowedUploadMime>(["image/png", "image/jpeg", "image/webp", "application/pdf"]);
const IMAGE_MIMES = new Set<AllowedUploadMime>(["image/png", "image/jpeg", "image/webp"]);
const DATA_URL = /^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/]*={0,2})$/i;

export class UploadValidationError extends Error {}

function hasPrefix(buffer: Buffer, bytes: number[]) {
  return buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte);
}

function detectedMime(buffer: Buffer): AllowedUploadMime | null {
  if (hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (hasPrefix(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (hasPrefix(buffer, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  return null;
}

export function decodeStrictBase64(value: string, maxBytes: number): Buffer {
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.length === 0 || value.length % 4 !== 0) {
    throw new UploadValidationError("Upload must contain canonical base64 data");
  }
  const buffer = Buffer.from(value, "base64");
  if (buffer.length === 0 || buffer.length > maxBytes) {
    throw new UploadValidationError(`Upload must be between 1 byte and ${maxBytes} bytes`);
  }
  if (buffer.toString("base64") !== value) {
    throw new UploadValidationError("Upload base64 encoding is malformed");
  }
  return buffer;
}

export function validateDataUpload(value: string, allowedMimes: ReadonlySet<AllowedUploadMime>, maxBytes: number) {
  const match = DATA_URL.exec(value);
  if (!match) throw new UploadValidationError("Upload must be a supported base64 data URL");
  const declaredMime = match[1].toLowerCase() as AllowedUploadMime;
  if (!allowedMimes.has(declaredMime)) throw new UploadValidationError("Uploaded file type is not allowed");
  const bytes = decodeStrictBase64(match[2], maxBytes);
  const actualMime = detectedMime(bytes);
  if (!actualMime || actualMime !== declaredMime || !allowedMimes.has(actualMime)) {
    throw new UploadValidationError("Uploaded file contents do not match the allowed file type");
  }
  return {
    mime: actualMime,
    bytes,
    dataUrl: `data:${actualMime};base64,${bytes.toString("base64")}`,
  };
}

export function validateKycDocumentUpload(value: string) {
  return validateDataUpload(value, DOCUMENT_MIMES, MAX_DOCUMENT_UPLOAD_BYTES);
}

export function validateTicketImageUpload(value: string) {
  return validateDataUpload(value, IMAGE_MIMES, MAX_TICKET_IMAGE_BYTES);
}

export function mediaExtension(mime: AllowedUploadMime): "png" | "jpg" | "webp" | "pdf" {
  return mime === "image/png" ? "png" : mime === "image/jpeg" ? "jpg" : mime === "image/webp" ? "webp" : "pdf";
}
