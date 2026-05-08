// === SETU DIGILOCKER E-KYC CLIENT ===
// Wraps the three sandbox endpoints we use:
//   POST   /api/digilocker                    → create a Digilocker request
//   GET    /api/digilocker/:id/status         → poll auth status
//   GET    /api/digilocker/:id/aadhaar        → pull Aadhaar once authenticated
//
// Sandbox base: https://dg-sandbox.setu.co
// Production base: https://dg.setu.co
//
// Auth: three required headers per request — x-client-id, x-client-secret,
// x-product-instance-id (all from Setu dashboard, stored as Replit secrets).

const SETU_SANDBOX_BASE = "https://dg-sandbox.setu.co";
const SETU_PROD_BASE = "https://dg.setu.co";

function setuBaseUrl(): string {
  // Setu doesn't expose a "TEST" prefix on keys, so default to sandbox unless
  // an explicit override env var is present.
  return process.env.SETU_ENV === "production" ? SETU_PROD_BASE : SETU_SANDBOX_BASE;
}

export function setuConfigured(): boolean {
  return !!(
    process.env.SETU_CLIENT_ID &&
    process.env.SETU_CLIENT_SECRET &&
    process.env.SETU_PRODUCT_INSTANCE_ID
  );
}

function setuHeaders(): Record<string, string> {
  return {
    "x-client-id": process.env.SETU_CLIENT_ID!,
    "x-client-secret": process.env.SETU_CLIENT_SECRET!,
    "x-product-instance-id": process.env.SETU_PRODUCT_INSTANCE_ID!,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

async function setuFetch(path: string, init: RequestInit = {}): Promise<any> {
  const url = `${setuBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...setuHeaders(), ...(init.headers as Record<string, string> | undefined) },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  console.log(`[setu] ${init.method || "GET"} ${path} → ${res.status}`,
    res.ok ? JSON.stringify(data).slice(0, 300) : data);
  if (!res.ok) {
    const msg = data?.error?.message || data?.message || `Setu request failed (${res.status})`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export interface SetuDigilockerRequest {
  id: string;            // request id used for polling
  url: string;           // Digilocker auth URL the user must visit
  status: string;        // "unauthenticated" on creation
  validUpto: string;     // ISO timestamp
  traceId?: string;
}

export interface SetuDigilockerStatus {
  id: string;
  status: string; // "unauthenticated" | "authenticated" | "revoked" | ...
}

export interface SetuAadhaar {
  status: string;
  aadhaar?: {
    name?: string;
    dob?: string;
    gender?: string;
    address?: { house?: string; street?: string; locality?: string; vtc?: string; district?: string; state?: string; pincode?: string; country?: string };
    photo?: string;     // base64
    aadhaarNumber?: string; // last-4 only in DigiLocker pulls
    [k: string]: unknown;
  };
}

export async function createDigilockerRequest(redirectUrl: string): Promise<SetuDigilockerRequest> {
  return setuFetch(`/api/digilocker`, {
    method: "POST",
    body: JSON.stringify({ redirectUrl }),
  });
}

export async function getDigilockerStatus(id: string): Promise<SetuDigilockerStatus> {
  return setuFetch(`/api/digilocker/${encodeURIComponent(id)}/status`, { method: "GET" });
}

export async function getDigilockerAadhaar(id: string): Promise<SetuAadhaar> {
  return setuFetch(`/api/digilocker/${encodeURIComponent(id)}/aadhaar`, { method: "GET" });
}
