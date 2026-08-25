import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  MAX_TICKET_IMAGE_BYTES,
  UploadValidationError,
  validateKycDocumentUpload,
  validateTicketImageUpload,
} from "../server/upload-validation";
import { detectAudioFormat } from "../server/replit_integrations/audio/client";

function dataUrl(mime: string, bytes: Buffer) {
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const pdf = Buffer.from("%PDF-1.7\n", "ascii");

assert.equal(validateTicketImageUpload(dataUrl("image/png", png)).mime, "image/png");
assert.equal(validateKycDocumentUpload(dataUrl("application/pdf", pdf)).mime, "application/pdf");
assert.throws(() => validateTicketImageUpload(dataUrl("image/jpeg", png)), UploadValidationError, "declared MIME must match magic bytes");
assert.throws(() => validateKycDocumentUpload("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="), UploadValidationError, "SVG must be rejected");
assert.throws(() => validateTicketImageUpload(dataUrl("image/png", Buffer.alloc(MAX_TICKET_IMAGE_BYTES + 1, 0))), UploadValidationError, "ticket images must respect decoded-size cap");
assert.throws(() => validateKycDocumentUpload(dataUrl("application/pdf", Buffer.alloc(MAX_DOCUMENT_UPLOAD_BYTES + 1, 0))), UploadValidationError, "documents must respect decoded-size cap");

assert.equal(detectAudioFormat(Buffer.from("RIFF\x00\x00\x00\x00WAVE", "binary")), "wav");
assert.equal(detectAudioFormat(Buffer.from("RIFF\x00\x00\x00\x00WEBP", "binary")), "unknown", "non-audio RIFF containers must be rejected");

const [routes, staticServer, audioRoutes, audioClient] = await Promise.all([
  readFile("server/routes.ts", "utf8"),
  readFile("server/static.ts", "utf8"),
  readFile("server/replit_integrations/audio/routes.ts", "utf8"),
  readFile("server/replit_integrations/audio/client.ts", "utf8"),
]);
assert.match(routes, /validateTicketImageUpload\(input\.photoUrl\)/);
assert.match(routes, /validateKycDocumentUpload\(input\.kycDocumentUrl\)/);
assert.match(routes, /validateKycDocumentUpload\(input\.cancelledChequeUrl\)/);
assert.match(routes, /Content-Disposition", `attachment;/);
assert.match(routes, /X-Content-Type-Options", "nosniff"/);
assert.doesNotMatch(routes, /res\.redirect\(302, url\.toString\(\)\)/, "stored KYC documents must not redirect to arbitrary URLs");
assert.doesNotMatch(staticServer, /uploads?\//i, "static server must not expose an uploads directory");
assert.match(audioRoutes, /decodeStrictBase64\(audio, MAX_AUDIO_UPLOAD_BYTES\)/);
assert.match(audioRoutes, /detectAudioFormat\(rawBuffer\) === "unknown"/);
assert.match(audioClient, /await unlink\(inputPath\).*await unlink\(outputPath\)/s);

console.log("Verified upload signature checks, decoded-size caps, attachment-only document delivery, audio validation, and non-static upload storage.");
