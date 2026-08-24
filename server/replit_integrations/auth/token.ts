import crypto from "crypto";

// This applies only to the Android deep-link fallback. Browser sessions use
// the HTTP-only server session cookie configured in index.ts.
export const NATIVE_AUTH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export interface AuthClaims {
  sub: string;
  email?: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error("JWT_SECRET or SESSION_SECRET must be set");
  return secret;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function b64urlDecode(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

export function signAuthToken(claims: { sub: string; email?: string }): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({
      sub: claims.sub,
      email: claims.email,
      iat: now,
      exp: now + NATIVE_AUTH_TOKEN_TTL_SECONDS,
    }),
  );
  const data = `${header}.${payload}`;
  const sig = b64url(crypto.createHmac("sha256", getSecret()).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyAuthToken(token: string): AuthClaims | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;

  // Reject anything that isn't an HS256-signed token. Defense in depth: the
  // HMAC compare below would already fail for alg=none (non-empty secret →
  // non-empty expected MAC), but pinning the alg keeps future changes safe.
  try {
    const header = JSON.parse(b64urlDecode(h).toString("utf-8"));
    if (header?.alg !== "HS256" || header?.typ !== "JWT") return null;
  } catch {
    return null;
  }

  // Compare raw 32-byte HMAC outputs, not base64url strings, so the comparison
  // is over fixed-width binary and side-steps any string-encoding ambiguity.
  const provided = b64urlDecode(sig);
  const expected = crypto.createHmac("sha256", getSecret()).update(`${h}.${p}`).digest();
  if (provided.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(provided, expected)) return null;

  try {
    const claims = JSON.parse(b64urlDecode(p).toString("utf-8")) as AuthClaims;
    if (!claims.sub || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}
