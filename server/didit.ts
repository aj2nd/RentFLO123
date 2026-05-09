// === DIDIT E-KYC CLIENT ===
// Wraps the Didit Verification v2 API:
//   POST  /v2/session/                     → create a verification session
//   GET   /v2/session/{session_id}/decision/ → fetch session decision/status
//
// Auth: single header `x-api-key` (DIDIT_API_KEY).
// Each session is bound to a workflow defined in the Didit dashboard
// (DIDIT_WORKFLOW_ID).
//
// Docs: https://docs.didit.me

import { createHmac, timingSafeEqual } from "crypto";

const DIDIT_BASE = "https://verification.didit.me";

export function diditConfigured(): boolean {
  return !!(process.env.DIDIT_API_KEY && process.env.DIDIT_WORKFLOW_ID);
}

function diditHeaders(): Record<string, string> {
  return {
    "x-api-key": process.env.DIDIT_API_KEY!,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
}

async function diditFetch(path: string, init: RequestInit = {}): Promise<any> {
  const url = `${DIDIT_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...diditHeaders(), ...(init.headers as Record<string, string> | undefined) },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  console.log(`[didit] ${init.method || "GET"} ${path} → ${res.status}`,
    res.ok ? JSON.stringify(data).slice(0, 300) : data);
  if (!res.ok) {
    const msg = data?.message || data?.detail || `Didit request failed (${res.status})`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export interface DiditSession {
  session_id: string;
  session_number?: number;
  session_token?: string;
  url: string;            // hosted verification URL
  status: string;         // "Not Started" | "In Progress" | ...
  workflow_id?: string;
  vendor_data?: string | null;
  callback?: string | null;
  expires_at?: string;
}

export interface DiditDecision {
  session_id: string;
  status: string;        // "Approved" | "Declined" | "In Review" | "Not Started" | "Abandoned" | "Expired" | ...
  workflow_id?: string;
  vendor_data?: string | null;
  // The decision payload contains many feature blocks; we only read what we need.
  id_verification?: {
    status?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    document_type?: string;
    document_number?: string;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface CreateSessionInput {
  callback?: string;
  vendor_data?: string;     // free-form, e.g. our user id
  metadata?: Record<string, unknown>;
}

export async function createDiditSession(input: CreateSessionInput = {}): Promise<DiditSession> {
  const body: Record<string, unknown> = {
    workflow_id: process.env.DIDIT_WORKFLOW_ID,
  };
  if (input.callback) body.callback = input.callback;
  if (input.vendor_data) body.vendor_data = input.vendor_data;
  if (input.metadata) body.metadata = input.metadata;
  return diditFetch(`/v2/session/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getDiditDecision(sessionId: string): Promise<DiditDecision> {
  return diditFetch(`/v2/session/${encodeURIComponent(sessionId)}/decision/`, {
    method: "GET",
  });
}

// Didit webhook signature: HMAC-SHA256 (hex) over the **raw** request bytes
// using the workflow webhook secret. The signature is sent in the
// `x-signature` header. Always pass the untouched raw body buffer here — never
// `JSON.stringify(req.body)`, which can re-order keys / change whitespace and
// break verification.
export function diditWebhookSecretConfigured(): boolean {
  return !!process.env.DIDIT_WEBHOOK_SECRET;
}

export function verifyDiditWebhook(rawBody: Buffer | string, signature: string | undefined): boolean {
  const secret = process.env.DIDIT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  try {
    const buf = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;
    const expected = createHmac("sha256", secret).update(buf).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Treat these statuses as "verified".
export const DIDIT_APPROVED_STATUSES = new Set(["Approved", "approved", "APPROVED"]);
