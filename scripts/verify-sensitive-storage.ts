process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-session-secret-only";

const { decryptPII, encryptPII, isEncryptedPII, publicUser } = await import("../server/security");

const sample = "sensitive-value-for-test";
const encrypted = encryptPII(sample);
if (!encrypted || !isEncryptedPII(encrypted) || encrypted.includes(sample) || decryptPII(encrypted) !== sample) {
  throw new Error("PII encryption envelope verification failed");
}

// Existing Railway secrets that predate encrypted sessions remain encrypted at
// rest through a deterministic SHA-256 expansion rather than breaking login.
process.env.PII_ENCRYPTION_KEY = "legacy-railway-secret-that-is-long-enough-to-be-safe";
const legacyEncrypted = encryptPII(sample);
if (!legacyEncrypted || !isEncryptedPII(legacyEncrypted) || decryptPII(legacyEncrypted) !== sample) {
  throw new Error("Legacy PII key compatibility verification failed");
}
process.env.PII_ENCRYPTION_KEY = "too-short";
let rejectedShortKey = false;
try {
  encryptPII(sample);
} catch {
  rejectedShortKey = true;
}
if (!rejectedShortKey) throw new Error("Short PII encryption keys must be rejected");
delete process.env.PII_ENCRYPTION_KEY;

const sanitized = publicUser({
  id: "user-1",
  fullLegalName: encrypted,
  panNumber: encryptPII("ABCDE1234F"),
  aadhaarNumber: encryptPII("123456789012"),
  bankAccountNumber: encryptPII("123456789012"),
  ifscCode: encryptPII("HDFC0001234"),
  kycDocumentUrl: encryptPII("https://private.example/document"),
  cancelledChequeUrl: encryptPII("https://private.example/cheque"),
  diditSessionId: "provider-session-id",
  digilockerRequestId: "provider-request-id",
});

if ("kycDocumentUrl" in sanitized || "cancelledChequeUrl" in sanitized || "diditSessionId" in sanitized || "digilockerRequestId" in sanitized) {
  throw new Error("Public user response exposes a protected field");
}
if (!sanitized.hasKycDocument || !sanitized.hasCancelledCheque || sanitized.panNumber === "ABCDE1234F") {
  throw new Error("Public user masking verification failed");
}

console.log("Encryption envelope, legacy-key compatibility, short-key rejection, masking, and protected-field omission verified.");
