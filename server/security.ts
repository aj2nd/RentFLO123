import crypto from "crypto";
import type { RequestHandler } from "express";
import { storage } from "./storage";
import { authStorage } from "./replit_integrations/auth/storage";

// ── Field-Level Encryption (AES-256-GCM) for PII at rest ──────────────────
// Format: base64( iv(12) || authTag(16) || ciphertext )
// Key sourced from PII_ENCRYPTION_KEY env (32 bytes, hex or base64).
// In dev, deterministically derived from SESSION_SECRET so existing data still
// decrypts after restarts (NOT for prod — set PII_ENCRYPTION_KEY in production).

function getKey(): Buffer {
  const raw = process.env.PII_ENCRYPTION_KEY;
  if (raw) {
    // Accept hex (64 chars) or base64
    if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
    const b = Buffer.from(raw, "base64");
    if (b.length === 32) return b;
    throw new Error("PII_ENCRYPTION_KEY must be 32 bytes (hex64 or base64)");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("PII_ENCRYPTION_KEY must be configured in production");
  }
  // Fallback for dev only — derive from SESSION_SECRET
  const secret = process.env.SESSION_SECRET || "dev-only-fallback-do-not-use-in-prod";
  return crypto.createHash("sha256").update("rentflo-pii::" + secret).digest();
}

const ENC_PREFIX = "enc:v1:";

export function isEncryptedPII(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(ENC_PREFIX);
}

export function encryptPII(plaintext: string | null | undefined): string | null {
  if (plaintext == null || plaintext === "") return null as any;
  if (typeof plaintext !== "string") return plaintext as any;
  if (plaintext.startsWith(ENC_PREFIX)) return plaintext; // already encrypted
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptPII(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return value as any;
  if (!value.startsWith(ENC_PREFIX)) return value; // legacy plaintext — return as is
  try {
    const buf = Buffer.from(value.slice(ENC_PREFIX.length), "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}

// ── PII masking for admin/audit display ───────────────────────────────────
export function maskPan(p?: string | null): string | null {
  if (!p) return p ?? null;
  const v = decryptPII(p) ?? "";
  if (v.length < 4) return "****";
  return "XXXXX" + v.slice(-4);
}

export function maskAadhaar(a?: string | null): string | null {
  if (!a) return a ?? null;
  const v = (decryptPII(a) ?? "").replace(/\s+/g, "");
  if (v.length < 4) return "XXXX";
  return "XXXX-XXXX-" + v.slice(-4);
}

export function maskBankAccount(b?: string | null): string | null {
  if (!b) return b ?? null;
  const v = decryptPII(b) ?? "";
  if (v.length < 4) return "****";
  return "******" + v.slice(-4);
}

export function maskIfsc(value?: string | null): string | null {
  if (!value) return value ?? null;
  const decoded = decryptPII(value) ?? "";
  if (decoded.length < 4) return "****";
  return "*******" + decoded.slice(-4);
}

// Public-safe user shape (admin views still get masked PII, never raw).
export function publicUser(u: any) {
  if (!u) return u;
  const {
    panNumber,
    aadhaarNumber,
    bankAccountNumber,
    ifscCode,
    fullLegalName,
    kycDocumentUrl,
    cancelledChequeUrl,
    diditSessionId,
    digilockerRequestId,
    ...rest
  } = u;
  return {
    ...rest,
    fullLegalName: decryptPII(fullLegalName),
    panNumber: maskPan(panNumber),
    aadhaarNumber: maskAadhaar(aadhaarNumber),
    bankAccountNumber: maskBankAccount(bankAccountNumber),
    ifscCode: maskIfsc(ifscCode),
    hasKycDocument: Boolean(kycDocumentUrl),
    hasCancelledCheque: Boolean(cancelledChequeUrl),
  };
}

// ── Timing-safe string compare ────────────────────────────────────────────
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a || "", "utf8");
  const bb = Buffer.from(b || "", "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

// ── Ownership / authorization helpers ─────────────────────────────────────
// Returns { property, role: 'OWNER' | 'TENANT' | 'ADMIN' } or sends 403/404.
export async function requirePropertyAccess(
  req: any,
  res: any,
  propertyId: string,
): Promise<null | { property: any; role: "OWNER" | "TENANT" | "ADMIN" }> {
  const userId = req.user?.claims?.sub;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }
  const property = await storage.getProperty(propertyId);
  if (!property) {
    res.status(404).json({ message: "Property not found" });
    return null;
  }
  const dbUser = await authStorage.getUser(userId);
  if (dbUser?.role === "ADMIN") return { property, role: "ADMIN" };
  if (property.ownerId === userId) return { property, role: "OWNER" };
  if (property.tenantId === userId) return { property, role: "TENANT" };
  res.status(403).json({ message: "Forbidden" });
  return null;
}

export async function requireLedgerAccess(
  req: any,
  res: any,
  ledgerId: string,
): Promise<null | { ledger: any; property: any; role: "OWNER" | "TENANT" | "ADMIN" }> {
  const ledger = await storage.getLedger(ledgerId);
  if (!ledger) {
    res.status(404).json({ message: "Ledger not found" });
    return null;
  }
  const access = await requirePropertyAccess(req, res, ledger.propertyId);
  if (!access) return null;
  return { ledger, property: access.property, role: access.role };
}
